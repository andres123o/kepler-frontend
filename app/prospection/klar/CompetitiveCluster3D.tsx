'use client'
// Nube de puntos "3D" real (no decorativa): cada punto es una review real de
// Klar/Nu/Stori/Ualá/Hey Banco, proyectada con PCA sobre el mismo embedding
// Word2Vec. Arranca dispersa al azar y "converge" a su posición real de
// cluster segun el progreso de scroll (mismo useScroll de framer-motion que
// ya usan las demas secciones). Dos datasets recortados a solo [x,y,z,empresa]
// -- negativo (quejas, 3649 puntos, 82KB) y positivo (elogios, 7736 puntos,
// 179KB) -- sin texto de reviews.
//
// Canvas 2D puro (sin WebGL/three.js): la proyección de perspectiva y la
// rotación se calculan a mano con trigonometría simple. Se eligió así porque
// WebGL puede estar deshabilitado por política de hardware/sandboxing en
// algunos navegadores corporativos (confirmado en pruebas: "GL_VENDOR =
// Disabled, Sandboxed = yes") — Canvas 2D funciona en absolutamente
// cualquier navegador y es más liviano que arrastrar three.js para esto.
import { useEffect, useMemo, useRef } from 'react'
import type { MotionValue } from 'framer-motion'
import rawNegativo from './competitive-points.json'
import rawPositivo from './competitive-points-positivo.json'

type Dataset = { companies: string[]; colors: string[]; points: [number, number, number, number][]; variance_pct: number }
const DATASETS: Record<'negativo' | 'positivo', Dataset> = {
  negativo: rawNegativo as Dataset,
  positivo: rawPositivo as Dataset,
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export default function CompetitiveCluster3D({ progress, dataset }: { progress: MotionValue<number>; dataset: 'negativo' | 'positivo' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { finalPos, startPos, rgb, count } = useMemo(() => {
    const DATA = DATASETS[dataset]
    const n = DATA.points.length
    const nCompanies = DATA.companies.length

    // Centroide global y por empresa — para separar visualmente las islas.
    // Los clusters reales son estadísticamente significativos pero moderados
    // (silhouette bajo, es el mismo dato que ya se documentó en el análisis
    // riguroso); para que las islas se lean con claridad en una pieza
    // decorativa se separan los centroides un 60% manteniendo intacta la
    // dispersión interna de cada grupo — no se altera el orden ni la
    // posición relativa real, solo se exagera la distancia entre grupos.
    const globalC = [0, 0, 0]
    const companyC = Array.from({ length: nCompanies }, () => [0, 0, 0])
    const companyN = new Array(nCompanies).fill(0)
    for (const [x, y, z, ci] of DATA.points) {
      globalC[0] += x; globalC[1] += y; globalC[2] += z
      companyC[ci][0] += x; companyC[ci][1] += y; companyC[ci][2] += z
      companyN[ci]++
    }
    globalC[0] /= n; globalC[1] /= n; globalC[2] /= n
    for (let c = 0; c < nCompanies; c++) {
      companyC[c][0] /= companyN[c] || 1
      companyC[c][1] /= companyN[c] || 1
      companyC[c][2] /= companyN[c] || 1
    }

    const SEPARATION = 1.6
    let maxAbs = 0
    const sepPoints: [number, number, number][] = DATA.points.map(([x, y, z, ci]) => {
      const cc = companyC[ci]
      const sx = globalC[0] + (cc[0] - globalC[0]) * SEPARATION + (x - cc[0])
      const sy = globalC[1] + (cc[1] - globalC[1]) * SEPARATION + (y - cc[1])
      const sz = globalC[2] + (cc[2] - globalC[2]) * SEPARATION + (z - cc[2])
      maxAbs = Math.max(maxAbs, Math.abs(sx), Math.abs(sy), Math.abs(sz))
      return [sx, sy, sz]
    })
    const scale = 2.4 / maxAbs

    const finalPos = new Float32Array(n * 3)
    const startPos = new Float32Array(n * 3)
    const rgb = new Uint8Array(n * 3)
    const colorObjs = DATA.colors.map(hexToRgb)

    for (let i = 0; i < n; i++) {
      const [x, y, z] = sepPoints[i]
      const companyIdx = DATA.points[i][3]
      finalPos[i * 3] = x * scale
      finalPos[i * 3 + 1] = y * scale
      finalPos[i * 3 + 2] = z * scale

      // posicion inicial: nube esferica dispersa, centrada frente a la cámara
      const r = 2.5 + Math.random() * 2.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      startPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      startPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      startPos[i * 3 + 2] = r * Math.cos(phi) * 0.6

      const c = colorObjs[companyIdx]
      rgb[i * 3] = c[0]
      rgb[i * 3 + 1] = c[1]
      rgb[i * 3 + 2] = c[2]
    }
    return { finalPos, startPos, rgb, count: n }
  }, [dataset])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let yaw = 0
    let manualPitch = 0
    let isDragging = false
    let lastPX = 0, lastPY = 0
    // cada vez que cambia el dataset este efecto se reinicia — reproduce la
    // misma animación de dispersión→convergencia para el nuevo grupo de puntos
    const switchStart = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const order = Uint32Array.from({ length: count }, (_, i) => i)
    const depth = new Float32Array(count)

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    // arrastre manual — orbita en cualquier dirección (yaw + pitch), no solo horizontal
    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'none'
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      lastPX = e.clientX
      lastPY = e.clientY
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - lastPX
      const dy = e.clientY - lastPY
      lastPX = e.clientX
      lastPY = e.clientY
      yaw += dx * 0.007
      manualPitch = Math.max(-1.15, Math.min(1.15, manualPitch + dy * 0.007))
    }
    const onPointerUp = () => {
      isDragging = false
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    const focal = 4.6

    const render = () => {
      const w = canvas.width, h = canvas.height
      const scrollT = easeInOut(Math.min(1, Math.max(0, progress.get())))
      const switchT = easeInOut(Math.min(1, (performance.now() - switchStart) / 1200))
      const t = Math.min(scrollT, switchT)
      if (!isDragging) yaw += 0.0022

      // fondo negro sólido — evita cualquier resto del panel detrás
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#0A0A0A'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2, cy = h / 2
      const fit = Math.min(w, h) / 2
      const tilt = Math.sin(Date.now() * 0.00008) * 0.15 + manualPitch
      const cosA = Math.cos(yaw), sinA = Math.sin(yaw)
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt)

      // profundidad de cada punto, para dibujar de atrás hacia adelante
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const x = startPos[i3]     + (finalPos[i3]     - startPos[i3])     * t
        const z = startPos[i3 + 2] + (finalPos[i3 + 2] - startPos[i3 + 2]) * t
        depth[i] = x * sinA + z * cosA
      }
      order.sort((a, b) => depth[a] - depth[b])

      for (let k = 0; k < count; k++) {
        const i = order[k]
        const i3 = i * 3
        const x = startPos[i3]     + (finalPos[i3]     - startPos[i3])     * t
        const y = startPos[i3 + 1] + (finalPos[i3 + 1] - startPos[i3 + 1]) * t
        const z = startPos[i3 + 2] + (finalPos[i3 + 2] - startPos[i3 + 2]) * t

        // rotación Y (ambient spin) + leve tilt en X
        const rx = x * cosA - z * sinA
        const rz1 = x * sinA + z * cosA
        const ry = y * cosT - rz1 * sinT
        const rz = y * sinT + rz1 * cosT

        const camZ = rz + 6.6
        if (camZ <= 0.1) continue
        const s = focal / camZ

        const sx = cx + rx * s * fit * 0.72
        const sy = cy - ry * s * fit * 0.72
        // los puntos entran pequeños (dispersos) y crecen a su tamaño final
        // a medida que convergen en los clusters reales
        const sizeAtEnd = 0.35 + 0.65 * t
        const radius = Math.max(1.5, 3.8 * s) * dpr * sizeAtEnd

        const r = rgb[i3], g = rgb[i3 + 1], b = rgb[i3 + 2]

        // solo el punto — sin halo ni borde
        ctx.beginPath()
        ctx.fillStyle = `rgba(${r},${g},${b},0.95)`
        ctx.arc(sx, sy, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [progress, finalPos, startPos, rgb, count])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
