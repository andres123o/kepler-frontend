'use client'
// Nube de puntos "3D" real de las reviews del propio Klar (no comparativa) --
// cada punto es una review real, proyectada con PCA sobre el mismo embedding
// Word2Vec usado en el clustering (11 clusters consolidados). Misma mecánica
// Canvas 2D que CompetitiveCluster3D: dispersión -> convergencia atada al
// scroll, arrastre manual (yaw+pitch), sin WebGL.
import { useEffect, useMemo, useRef } from 'react'
import type { MotionValue } from 'framer-motion'
import rawNegativo from './klar-points-negativo.json'
import rawNeutral from './klar-points-neutral.json'
import rawPositivo from './klar-points-positivo.json'

type ClusterMeta = { id: number; color: string; nombre: string; size: number | null }
type Dataset = { clusters: ClusterMeta[]; points: [number, number, number, number][]; variance_pct: number }
export type Band = 'negativo' | 'neutral' | 'positivo'
const DATASETS: Record<Band, Dataset> = {
  negativo: rawNegativo as Dataset,
  neutral: rawNeutral as Dataset,
  positivo: rawPositivo as Dataset,
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export default function KlarClusters3D({ progress, band }: { progress: MotionValue<number>; band: Band }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { finalPos, startPos, rgb, count } = useMemo(() => {
    const DATA = DATASETS[band]
    const n = DATA.points.length
    const nClusters = DATA.clusters.length

    // Mismo truco visual que en el mapa competitivo: se separan los
    // centroides de cada cluster un 60% para que las "islas" se lean con
    // claridad, sin alterar la dispersión interna ni el orden real.
    const globalC = [0, 0, 0]
    const clusterC = Array.from({ length: nClusters }, () => [0, 0, 0])
    const clusterN = new Array(nClusters).fill(0)
    for (const [x, y, z, ci] of DATA.points) {
      globalC[0] += x; globalC[1] += y; globalC[2] += z
      clusterC[ci][0] += x; clusterC[ci][1] += y; clusterC[ci][2] += z
      clusterN[ci]++
    }
    globalC[0] /= n; globalC[1] /= n; globalC[2] /= n
    for (let c = 0; c < nClusters; c++) {
      clusterC[c][0] /= clusterN[c] || 1
      clusterC[c][1] /= clusterN[c] || 1
      clusterC[c][2] /= clusterN[c] || 1
    }

    const SEPARATION = 1.6
    let maxAbs = 0
    const sepPoints: [number, number, number][] = DATA.points.map(([x, y, z, ci]) => {
      const cc = clusterC[ci]
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
    const colorObjs = DATA.clusters.map(c => hexToRgb(c.color))

    for (let i = 0; i < n; i++) {
      const [x, y, z] = sepPoints[i]
      const clusterIdx = DATA.points[i][3]
      finalPos[i * 3] = x * scale
      finalPos[i * 3 + 1] = y * scale
      finalPos[i * 3 + 2] = z * scale

      const r = 2.5 + Math.random() * 2.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      startPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      startPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      startPos[i * 3 + 2] = r * Math.cos(phi) * 0.6

      const c = colorObjs[clusterIdx]
      rgb[i * 3] = c[0]
      rgb[i * 3 + 1] = c[1]
      rgb[i * 3 + 2] = c[2]
    }
    return { finalPos, startPos, rgb, count: n }
  }, [band])

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

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#0A0A0A'
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2, cy = h / 2
      const fit = Math.min(w, h) / 2
      const tilt = Math.sin(Date.now() * 0.00008) * 0.15 + manualPitch
      const cosA = Math.cos(yaw), sinA = Math.sin(yaw)
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt)

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

        const rx = x * cosA - z * sinA
        const rz1 = x * sinA + z * cosA
        const ry = y * cosT - rz1 * sinT
        const rz = y * sinT + rz1 * cosT

        const camZ = rz + 6.6
        if (camZ <= 0.1) continue
        const s = focal / camZ

        const sx = cx + rx * s * fit * 0.72
        const sy = cy - ry * s * fit * 0.72
        const sizeAtEnd = 0.35 + 0.65 * t
        const radius = Math.max(1.5, 3.8 * s) * dpr * sizeAtEnd

        const r = rgb[i3], g = rgb[i3 + 1], b = rgb[i3 + 2]

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
