// Versión mobile de IntervencionScroll — misma mecánica (scroll de la sección
// controla qué panel está activo, con crossfade+slide), reflujada de 2 columnas
// lado a lado a 2 franjas apiladas (arriba fija, abajo cicla).
'use client'
import { useEffect, useRef, useState } from 'react'

const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`
const GRADIENT = `linear-gradient(135deg, #4A0072 0%, #C2185B 50%, #FF8C00 100%)`

const PANELS = [
  {
    desc: 'mParticle les da contexto interno del usuario en app. Eventos, cohortes, segmentos de comportamiento.',
    label: 'No hace esto',
    items: [
      'No proyecta activación ni qué mueve la tendencia en la semana',
      'No identifica el momento mental del usuario',
      'No tiene señales de mercado: tasa BanRep, quincena, spread CDT, etc.',
    ],
  },
  {
    desc: 'SendGrid les da ejecución de email y comunicaciones a escala. Entrega, templates, segmentación básica.',
    label: 'No hace esto',
    items: [
      'No tiene inteligencia propia sobre el momento del usuario',
      'No conecta señales macro con el segmento que va a convertir',
      'Ejecuta instrucciones. No decide qué decirle a quién ni cuándo',
    ],
  },
  {
    desc: 'Sin Kepler, la tasa de activación semanal no supera el 8% en fintechs de inversión en Colombia. Se mantiene. No crece.',
    label: 'Ejemplo',
    items: [
      'Semana de quincena con spread CDT +5pp sobre inflación. La ventana de conversión existe pero no hay nadie que la detecte y la ejecute automáticamente.',
      'Sin intervención calibrada al contexto, esa liquidez se dispersa en gastos antes del siguiente ciclo.',
    ],
  },
]

export default function MobileIntervencionScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const progress = -rect.top / (rect.height - window.innerHeight)
      const idx = Math.min(PANELS.length - 1, Math.max(0, Math.floor(progress * PANELS.length)))
      setActive(idx)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '300vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Franja superior — fija, gradiente insignia Kepler */}
        <div style={{
          flex: '0 0 34vh',
          backgroundImage: GRADIENT,
          padding: '32px 26px',
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
          fontFamily: f,
        }}>
          <p style={{
            fontSize: 'clamp(20px, 6vw, 25px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            lineHeight: 1.32,
            margin: 0,
          }}>
            Sus herramientas no conectan el contexto de mercado con el momento del usuario
          </p>
        </div>

        {/* Franja inferior — animada, crema Kepler */}
        <div style={{ flex: 1, background: '#FFFEF7', position: 'relative', overflow: 'hidden', fontFamily: f }}>
          {PANELS.map((panel, i) => (
            <div key={i} style={{
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
                fontSize: '14.5px',
                lineHeight: '1.75',
                color: '#171717',
                fontWeight: 400,
                margin: '0 0 20px',
              }}>{panel.desc}</p>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '18px' }}>
                <p style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#C2185B',
                  marginBottom: '14px',
                }}>{panel.label}</p>

                {panel.items.map((item) => (
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
