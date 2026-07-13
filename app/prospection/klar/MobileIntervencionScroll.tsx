// Versión mobile de IntervencionScroll — misma mecánica (scroll de la sección
// controla qué panel está activo, con crossfade+slide), reflujada de 2 columnas
// lado a lado a 2 franjas apiladas (arriba fija con el gráfico 3D, abajo cicla
// por las 3 bandas de sentimiento).
'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useMotionValue } from 'framer-motion'
import type { Band } from './KlarClusters3D'
import negativoData from './klar-points-negativo.json'
import neutralData from './klar-points-neutral.json'
import positivoData from './klar-points-positivo.json'

const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

const KlarClusters3D = dynamic(() => import('./KlarClusters3D'), { ssr: false })

const BAND_LABEL: Record<Band, string> = {
  negativo: 'Negativo',
  neutral: 'Neutral',
  positivo: 'Positivo',
}

type ClusterMeta = { id: number; color: string; nombre: string; size: number | null }
const CLUSTERS_BY_BAND: Record<Band, ClusterMeta[]> = {
  negativo: (negativoData as { clusters: ClusterMeta[] }).clusters,
  neutral: (neutralData as { clusters: ClusterMeta[] }).clusters,
  positivo: (positivoData as { clusters: ClusterMeta[] }).clusters,
}

// Nombre del cluster reducido a una sola palabra, solo para la leyenda del gráfico
// (el nombre completo vive en la lista corta de la franja inferior).
const SHORT_LABEL: Record<Band, Record<number, string>> = {
  negativo: { 0: 'Cobros', 1: 'Trámites', 2: 'Bloqueos' },
  neutral: { 0: 'Entregas', 1: 'Errores', 2: 'Intereses' },
  positivo: { 0: 'Fidelidad', 1: 'Servicio', 2: 'Usabilidad', 3: 'Aprobación', 4: 'Préstamos' },
}

const BANDS: Array<{ band: Band; titulo: string; desc: string; total: number; items: string[] }> = [
  {
    band: 'negativo',
    titulo: 'Quejas',
    desc: 'Las quejas reales de Klar no son ruido disperso: se concentran en 3 focos claros.',
    total: 282,
    items: [
      'Trámites y soporte · n=133',
      'Crédito y cobros · n=98',
      'Bloqueo de cuenta · n=51',
    ],
  },
  {
    band: 'neutral',
    titulo: 'Fricciones',
    desc: 'Las reviews neutras muestran fricciones puntuales, no rupturas de fondo.',
    total: 61,
    items: [
      'Crédito, intereses y entregas · n=29',
      'Errores técnicos · n=16',
      'Intereses confusos · n=16',
    ],
  },
  {
    band: 'positivo',
    titulo: 'Elogios',
    desc: 'Lo que sí funciona también es real, y es mayoría.',
    total: 1320,
    items: [
      'Aprobación rápida · n=375',
      'Satisfacción general · n=312',
      'Crédito y préstamos · n=309',
      'App fácil de usar · n=232',
      'Sin problemas · n=92',
    ],
  },
]

export default function MobileIntervencionScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const clusterProgress = useMotionValue(1)

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const progress = -rect.top / (rect.height - window.innerHeight)
      const idx = Math.min(BANDS.length - 1, Math.max(0, Math.floor(progress * BANDS.length)))
      setActive(idx)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const activeBand = BANDS[active].band

  return (
    <div ref={containerRef} style={{ position: 'relative', height: `${BANDS.length * 100}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Franja superior — fija, gráfico 3D de reviews de Klar por banda de sentimiento */}
        <div style={{
          flex: '0 0 40vh',
          background: '#0A0A0A',
          position: 'relative',
          boxSizing: 'border-box',
          fontFamily: f,
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <KlarClusters3D progress={clusterProgress} band={activeBand} />
          </div>

          <div style={{
            position: 'absolute', top: '16px', left: '16px', zIndex: 4,
            display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '2px',
          }}>
            {(['negativo', 'neutral', 'positivo'] as Band[]).map((band) => (
              <span key={band} style={{
                fontFamily: f, fontSize: '10.5px', fontWeight: 600, letterSpacing: '-0.01em',
                padding: '5px 11px', borderRadius: '999px',
                transition: 'background-color 0.2s, color 0.2s',
                background: activeBand === band ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: activeBand === band ? '#ffffff' : 'rgba(255,255,255,0.42)',
              }}>
                {BAND_LABEL[band]}
              </span>
            ))}
          </div>

          {/* Leyenda acotada — solo el nombre corto de cada cluster de la banda activa */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: '14px', zIndex: 4,
            padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: '6px 12px',
          }}>
            {CLUSTERS_BY_BAND[activeBand].map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: f, fontSize: '10.5px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>{SHORT_LABEL[activeBand][c.id]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Franja inferior — animada, crema Kepler, cicla por las 3 bandas */}
        <div style={{ flex: 1, background: '#FFFEF7', position: 'relative', overflow: 'hidden', fontFamily: f }}>
          {BANDS.map((b, i) => (
            <div key={b.band} style={{
              position: 'absolute',
              inset: 0,
              padding: '28px 26px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: active === i ? 1 : 0,
              transform: active === i
                ? 'translateY(0px)'
                : active > i ? 'translateY(-18px)' : 'translateY(18px)',
              transition: 'opacity 0.42s ease, transform 0.42s ease',
              pointerEvents: active === i ? 'auto' : 'none',
              boxSizing: 'border-box',
              overflowY: 'auto',
            }}>

              <p style={{
                fontSize: 'clamp(20px, 6vw, 25px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#171717',
                margin: '0 0 12px',
              }}>{b.titulo}</p>

              <p style={{
                fontSize: '14.5px',
                lineHeight: '1.75',
                color: '#171717',
                fontWeight: 400,
                margin: '0 0 20px',
              }}>{b.desc}</p>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '18px' }}>
                <p style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#171717',
                  marginBottom: '14px',
                }}>{`${BAND_LABEL[b.band]} · ${b.total} reviews`}</p>

                {b.items.map((item) => (
                  <p key={item} style={{
                    fontSize: '13.5px',
                    color: '#171717',
                    lineHeight: 1.65,
                    marginBottom: '10px',
                    paddingLeft: '12px',
                    borderLeft: '2px solid rgba(74,0,114,0.3)',
                    fontWeight: 500,
                  }}>{item}</p>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
