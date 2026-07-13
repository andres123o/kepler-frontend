// Versión mobile de ContextoScroll — misma mecánica de scroll (panel sticky que
// crece), reflujada a una columna. Archivo independiente, no importa desktop.
'use client'
import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'
import raw from './competitive-points.json'

const deepPurple = '#331A4E'
const magenta    = '#C2185B'
const orange     = '#FF8C00'
const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

const LEGEND = raw as { companies: string[]; colors: string[] }

const CompetitiveCluster3D = dynamic(() => import('./CompetitiveCluster3D'), { ssr: false })

const TABS: Array<{ key: 'negativo' | 'positivo'; label: string }> = [
  { key: 'negativo', label: 'Critican' },
  { key: 'positivo', label: 'Destacan' },
]

export default function MobileContextoScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const [dataset, setDataset] = useState<'negativo' | 'positivo'>('negativo')

  const scale       = useTransform(sp, [0, 0.38], [0.9, 1])
  const radius      = useTransform(sp, [0, 0.38], [24, 0])
  const width       = useTransform(sp, [0, 0.38], ['92%', '100%'])
  const contentOp   = useTransform(sp, [0.16, 0.34], [0, 1])
  const contentY    = useTransform(sp, [0.16, 0.34], [18, 0])
  const clusterProg = useTransform(sp, [0.3, 0.95], [0, 1])

  return (
    <div id="diagnostico-m" ref={ref} style={{ position: 'relative', height: '250vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#FFFEF7' }}>
        <motion.div style={{
          scale, borderRadius: radius, width, height: '100%',
          background: '#0A0A0A', position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>

          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
          }} />

          <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '7px', zIndex: 4 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: deepPurple }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: magenta }} />
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: orange }} />
          </div>

          {/* Selector quejas/elogios — esquina superior derecha, sutil */}
          <motion.div style={{
            opacity: contentOp, position: 'absolute', top: '16px', right: '20px', zIndex: 5,
            display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '2px',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setDataset(tab.key)}
                style={{
                  fontFamily: f, fontSize: '10.5px', fontWeight: 600, letterSpacing: '-0.01em',
                  padding: '5px 11px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  transition: 'background-color 0.2s, color 0.2s',
                  background: dataset === tab.key ? 'rgba(255,255,255,0.14)' : 'transparent',
                  color: dataset === tab.key ? '#ffffff' : 'rgba(255,255,255,0.42)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Caja del gráfico — subida dentro del panel, un poco más grande */}
          <motion.div style={{
            opacity: contentOp, y: contentY, position: 'relative', zIndex: 3,
            display: 'flex', justifyContent: 'center',
            width: '100%', height: '100%', padding: '26px 22px 0',
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '1 / 1', maxHeight: '52vh' }}>
              <CompetitiveCluster3D progress={clusterProg} dataset={dataset} />
            </div>
          </motion.div>

          {/* Texto — anclado abajo del panel */}
          <motion.div style={{
            opacity: contentOp, y: contentY, position: 'absolute', zIndex: 3,
            left: 0, right: 0, bottom: '52px', padding: '0 22px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: f, fontSize: '13.5px', lineHeight: '1.7', color: 'rgba(255,255,255,0.5)', fontWeight: 400, margin: '0 0 14px' }}>
                Cada punto es una reseña real de Klar y de sus 4 competidores más cercanos, proyectada en el mismo espacio semántico: 11.385 reviews analizadas.{' '}
                <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>Ya sea en quejas o en elogios, la nube de Klar (blanco) siempre queda más cerca de Nu y Stori que de Ualá o Hey Banco:</span>{' '}
                comparte con esos dos tanto lo bueno como lo malo. Ahí se define la competencia real, no en todo el mercado a la vez.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px 16px' }}>
                {LEGEND.companies.map((name, i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: LEGEND.colors[i], display: 'inline-block' }} />
                    <span style={{ fontFamily: f, fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.01em' }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
