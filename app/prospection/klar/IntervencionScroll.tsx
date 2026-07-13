'use client'
import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion'
import type { Band } from './KlarClusters3D'
import negativoData from './klar-points-negativo.json'
import neutralData from './klar-points-neutral.json'
import positivoData from './klar-points-positivo.json'

const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

// WebGL no puede renderizar en el servidor — carga solo en cliente.
const KlarClusters3D = dynamic(() => import('./KlarClusters3D'), { ssr: false })

const BAND_LABEL: Record<Band, string> = {
  negativo: 'Negativo (1-2★)',
  neutral: 'Neutral (3★)',
  positivo: 'Positivo (4-5★)',
}

type ClusterMeta = { id: number; color: string; nombre: string; size: number | null }
const CLUSTERS_BY_BAND: Record<Band, ClusterMeta[]> = {
  negativo: (negativoData as { clusters: ClusterMeta[] }).clusters,
  neutral: (neutralData as { clusters: ClusterMeta[] }).clusters,
  positivo: (positivoData as { clusters: ClusterMeta[] }).clusters,
}

// Nombre del cluster reducido a una sola palabra, solo para la leyenda del gráfico
// (el nombre completo vive en la lista corta de la columna derecha).
const SHORT_LABEL: Record<Band, Record<number, string>> = {
  negativo: { 0: 'Cobros', 1: 'Trámites', 2: 'Bloqueos' },
  neutral: { 0: 'Entregas', 1: 'Errores', 2: 'Intereses' },
  positivo: { 0: 'Fidelidad', 1: 'Servicio', 2: 'Usabilidad', 3: 'Aprobación', 4: 'Préstamos' },
}

// Una sección de scroll por banda de sentimiento, condensando los 11 clusters
// reales del clustering (Word2Vec + KMeans, ver review_clusters.json) en un
// resumen corto por banda.
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

export default function IntervencionScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  const clusterProgress = useMotionValue(1)

  useMotionValueEvent(sp, 'change', (v) => {
    const idx = Math.min(BANDS.length - 1, Math.max(0, Math.floor(v * BANDS.length)))
    setActive(idx)
  })

  const activeBand = BANDS[active].band

  return (
    <div ref={containerRef} style={{ position: 'relative', height: `${BANDS.length * 100}vh` }}>
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
      }}>

        {/* Columna izquierda — fija, "Reviews de Klar, con islas de verdad": mismo
            gráfico de nube de puntos 3D que ContextoScroll pero sobre las reviews
            propias de Klar (no comparativo), con las 3 bandas como etiquetas. */}
        <div style={{
          flex: '1 1 50%',
          background: '#0A0A0A',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: f,
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <KlarClusters3D progress={clusterProgress} band={activeBand} />
          </div>

          <div style={{
            position: 'absolute', top: '28px', left: '28px', right: '28px', zIndex: 4,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '3px' }}>
              {(['negativo', 'neutral', 'positivo'] as Band[]).map((band) => (
                <span key={band} style={{
                  fontFamily: f, fontSize: '12px', fontWeight: 600, letterSpacing: '-0.01em',
                  padding: '6px 14px', borderRadius: '999px',
                  transition: 'background-color 0.2s, color 0.2s',
                  background: activeBand === band ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: activeBand === band ? '#ffffff' : 'rgba(255,255,255,0.42)',
                }}>
                  {BAND_LABEL[band]}
                </span>
              ))}
            </div>
          </div>

          {/* Leyenda acotada — solo el nombre corto de cada cluster de la banda activa,
              sin el resumen completo (eso vive en la columna derecha). */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: '32px', zIndex: 4,
            padding: '0 28px', display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
          }}>
            {CLUSTERS_BY_BAND[activeBand].map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: f, fontSize: '12px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>{SHORT_LABEL[activeBand][c.id]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha — animada, crema Kepler: un resumen corto por banda,
            cambiando a medida que se hace scroll. */}
        <div style={{
          flex: '1 1 50%',
          background: '#FFFEF7',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: f,
        }}>
          {BANDS.map((b, i) => (
            <div key={b.band} style={{
              position: 'absolute',
              inset: 0,
              padding: '72px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: active === i ? 1 : 0,
              transform: active === i
                ? 'translateY(0px)'
                : active > i ? 'translateY(-22px)' : 'translateY(22px)',
              transition: 'opacity 0.42s ease, transform 0.42s ease',
              pointerEvents: active === i ? 'auto' : 'none',
              boxSizing: 'border-box',
            }}>

              <p style={{
                fontSize: 'clamp(26px, 3vw, 36px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#171717',
                margin: '0 0 16px',
              }}>{b.titulo}</p>

              <p style={{
                fontSize: '17px',
                lineHeight: '1.85',
                color: '#171717',
                fontWeight: 400,
                margin: '0 0 28px',
              }}>{b.desc}</p>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '24px' }}>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#171717',
                  marginBottom: '20px',
                }}>{`${BAND_LABEL[b.band]} · ${b.total} reviews`}</p>

                {b.items.map((item) => (
                  <p key={item} style={{
                    fontSize: '15px',
                    color: '#171717',
                    lineHeight: 1.7,
                    marginBottom: '14px',
                    paddingLeft: '16px',
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
