'use client'
import { useEffect, useRef, useState } from 'react'

const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`
const GRADIENT = `linear-gradient(135deg, #4A0072 0%, #C2185B 50%, #FF8C00 100%)`

const PANELS = [
  {
    tag: '',
    desc: 'Zoho CRM gestiona la comunicación con reglas condicionales básicas: si el campo X cambia, envía el mensaje Y. No fue pensado para optimizar comunicaciones.',
    label: 'No hace esto',
    items: [
      'No analiza señales de los usuarios',
      'No decide qué comunicación tiene más probabilidad de generar depósitos esta semana',
      'No tiene señales de mercado: tasa BanRep, quincena, spread CDT vs. inflación',
    ],
  },
  {
    tag: '',
    desc: 'ZeptoMail les da entrega de email a escala, el relay que ejecuta lo que Zoho decide.',
    label: 'No hace esto',
    items: [
      'No tiene inteligencia propia sobre el momento mental del usuario',
      'No conecta el contexto macro con el segmento que va a convertir',
      'Ejecuta reglas estáticas. No decide qué decirle a quién ni cuándo',
    ],
  },
  {
    tag: '',
    desc: 'Sin una capa de inteligencia, la conversión cross-sell de libranza a CDT se mantiene en 7,7%. No crece.',
    label: 'Ejemplo',
    items: [
      'Empleados públicos estrato 3-4 cobran quincena los días 15 y 30. La liquidez existe, pero nadie la detecta ni la activa automáticamente.',
      'Sin comunicación calibrada al momento de mercado y al momento mental del usuario, esa plata se dispersa en gastos antes del siguiente ciclo.',
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

        {/* Columna izquierda — fija, gradiente insignia Kepler */}
        <div style={{
          flex: '1 1 50%',
          backgroundImage: GRADIENT,
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
            color: '#FFFFFF',
            lineHeight: 1.3,
            margin: '0 0 20px',
          }}>
            Tienen el CRM y el canal. Les falta la capa de inteligencia.
          </p>
        </div>

        {/* Columna derecha — animada, crema Kepler */}
        <div style={{
          flex: '1 1 50%',
          background: '#FFFEF7',
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
                  color: '#171717',
                  borderBottom: '2px solid #171717',
                  paddingBottom: '3px',
                  marginBottom: '24px',
                  alignSelf: 'flex-start',
                }}>{panel.tag}</span>
              )}

              <p style={{
                fontSize: '17px',
                lineHeight: '1.85',
                color: '#171717',
                fontWeight: 400,
                margin: '0 0 28px',
              }}>{panel.desc}</p>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '24px' }}>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#C2185B',
                  marginBottom: '20px',
                }}>{panel.label}</p>

                {panel.items.map((item) => (
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
