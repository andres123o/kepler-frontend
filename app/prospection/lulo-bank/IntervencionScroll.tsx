'use client'
import { useEffect, useRef, useState } from 'react'

const f = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif`

const PANELS = [
  {
    tag: '',
    desc: 'mParticle les da contexto interno del usuario en app. Eventos, cohortes, segmentos de comportamiento.',
    label: 'No hace esto',
    items: [
      'No proyecta activación ni qué mueve la tendencia en la semana',
      'No identifica el momento mental del usuario',
      'No tiene señales de mercado: tasa BanRep, quincena, spread CDT, etc.',
    ],
  },
  {
    tag: '',
    desc: 'SendGrid les da ejecución de email y comunicaciones a escala. Entrega, templates, segmentación básica.',
    label: 'No hace esto',
    items: [
      'No tiene inteligencia propia sobre el momento del usuario',
      'No conecta señales macro con el segmento que va a convertir',
      'Ejecuta instrucciones. No decide qué decirle a quién ni cuándo',
    ],
  },
  {
    tag: '',
    desc: 'Sin Kepler, la tasa de activación semanal no supera el 8% en fintechs de inversión en Colombia. Se mantiene. No crece.',
    label: 'Ejemplo',
    items: [
      'Semana de quincena con spread CDT +5pp sobre inflación. La ventana de conversión existe pero no hay nadie que la detecte y la ejecute automáticamente.',
      'Sin intervención calibrada al contexto, esa liquidez se dispersa en gastos antes del siguiente ciclo.',
    ],
  },
]

export default function IntervencionScroll() {
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
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
      }}>

        {/* Columna izquierda — fija, amarillo #fff384 */}
        <div style={{
          flex: '1 1 50%',
          background: '#fff384',
          padding: '80px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
          fontFamily: f,
        }}>
          <p style={{
            fontSize: 'clamp(26px, 3vw, 42px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#121622',
            lineHeight: 1.3,
            margin: '0 0 20px',
          }}>
            Sus herramientas no conectan el contexto de mercado con el momento del usuario
          </p>
        </div>

        {/* Columna derecha — animada, gris claro #f4f4f4 */}
        <div style={{
          flex: '1 1 50%',
          background: '#f4f4f4',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: f,
        }}>
          {PANELS.map((panel, i) => (
            <div key={i} style={{
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

              {panel.tag && (
                <span style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#121622',
                  borderBottom: '2px solid #121622',
                  paddingBottom: '3px',
                  marginBottom: '24px',
                  alignSelf: 'flex-start',
                }}>{panel.tag}</span>
              )}

              <p style={{
                fontSize: '17px',
                lineHeight: '1.85',
                color: '#121622',
                fontWeight: 400,
                margin: '0 0 28px',
              }}>{panel.desc}</p>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '24px' }}>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#667A99',
                  marginBottom: '20px',
                }}>{panel.label}</p>

                {panel.items.map((item) => (
                  <p key={item} style={{
                    fontSize: '15px',
                    color: '#121622',
                    lineHeight: 1.7,
                    marginBottom: '14px',
                    paddingLeft: '16px',
                    borderLeft: '2px solid rgba(0,0,0,0.12)',
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
