'use client'
import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'
import raw from './competitive-points.json'

const deepPurple = '#331A4E' // apenas más claro que el fondo (#2A1040) para que el punto se note un poco
const magenta    = '#C2185B'
const orange     = '#FF8C00'
const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

const LEGEND = raw as { companies: string[]; colors: string[] }

// WebGL no puede renderizar en el servidor — carga solo en cliente.
const CompetitiveCluster3D = dynamic(() => import('./CompetitiveCluster3D'), { ssr: false })

const TABS: Array<{ key: 'negativo' | 'positivo'; label: string }> = [
  { key: 'negativo', label: 'Lo que critican' },
  { key: 'positivo', label: 'Lo que destacan' },
]

export default function ContextoScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const [dataset, setDataset] = useState<'negativo' | 'positivo'>('negativo')

  const scale       = useTransform(sp, [0, 0.38], [0.88, 1])
  const radius      = useTransform(sp, [0, 0.38], [28, 0])
  const width       = useTransform(sp, [0, 0.38], ['90%', '100%'])
  const contentOp   = useTransform(sp, [0.16, 0.34], [0, 1])
  const contentY    = useTransform(sp, [0.16, 0.34], [18, 0])
  const clusterProg = useTransform(sp, [0.3, 0.95], [0, 1])

  return (
    <div id="diagnostico" ref={ref} style={{ position: 'relative', height: '250vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#FFFEF7' }}>
        <motion.div style={{
          scale,
          borderRadius: radius,
          width,
          height: '100%',
          background: '#0A0A0A',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

          {/* Viñeta radial para dar profundidad */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
          }} />

          {/* Chrome de panel — 3 puntos con los colores del gradiente insignia
              (el mismo del badge "Klar" del header), siempre al 100% de opacidad,
              sin depender del fade del contenido */}
          <div style={{ position: 'absolute', top: '28px', left: '28px', display: 'flex', gap: '8px', zIndex: 4 }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: deepPurple }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: magenta }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: orange }} />
          </div>

          {/* Selector quejas/elogios — esquina superior derecha, sutil */}
          <motion.div style={{
            opacity: contentOp, position: 'absolute', top: '22px', right: '28px', zIndex: 5,
            display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '3px',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setDataset(tab.key)}
                style={{
                  fontFamily: f, fontSize: '12px', fontWeight: 600, letterSpacing: '-0.01em',
                  padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
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
            width: '100%', height: '100%', padding: '32px 40px 0',
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '1 / 1', maxHeight: '62vh' }}>
              <CompetitiveCluster3D progress={clusterProg} dataset={dataset} />
            </div>
          </motion.div>

          {/* Texto — anclado abajo del panel, no compite por espacio con la caja */}
          <motion.div className="bottom-[110px] md:bottom-[84px]" style={{
            opacity: contentOp, y: contentY, position: 'absolute', zIndex: 3,
            left: 0, right: 0, padding: '0 64px',
          }}>
            <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
              <p style={{ fontFamily: f, fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.5)', fontWeight: 400, margin: '0 0 16px' }}>
                Cada punto es una reseña real de Klar y de sus 4 competidores más cercanos, proyectada en el mismo espacio semántico: 11.385 reviews analizadas.{' '}
                <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>Ya sea en quejas o en elogios, la nube de Klar (blanco) siempre queda más cerca de Nu y Stori que de Ualá o Hey Banco:</span>{' '}
                comparte con esos dos tanto lo bueno como lo malo. Ahí, frente a Nu y Stori, es donde se define la competencia real, no en todo el mercado a la vez.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '18px' }}>
                {LEGEND.companies.map((name, i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: LEGEND.colors[i], display: 'inline-block' }} />
                    <span style={{ fontFamily: f, fontSize: '12.5px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.01em' }}>{name}</span>
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
