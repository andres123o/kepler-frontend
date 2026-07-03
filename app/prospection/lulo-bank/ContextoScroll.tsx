'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const deepPurple = '#331A4E' // apenas más claro que el fondo (#2A1040) para que el punto se note un poco
const magenta    = '#C2185B'
const orange     = '#FF8C00'
const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

/* Barras isométricas apiladas — mismo motivo que "Designed for speed" de
   Linear, recoloreado a negro/gris de Kepler. Cada tupla: [forma, filo]. */
const BARS: Array<[string, string]> = [
  ['M137.044 107.668a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v20.529a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-20.529c0-.545.308-1.044.796-1.288z', 'M137.689 110.446l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v18.193'],
  ['M128.594 98.378a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v34.049a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-34.049c0-.545.308-1.044.796-1.288z', 'M129.239 101.156l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v31.713'],
  ['M120.144 82.316a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v54.331a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-54.331c0-.545.308-1.044.796-1.288z', 'M120.789 85.094l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v51.995'],
  ['M111.694 59.504a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v81.373a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-81.373c0-.545.308-1.044.796-1.288z', 'M112.339 62.282l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v79.037'],
  ['M103.244 16.4a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v128.697a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-128.697c0-.545.308-1.044.796-1.288z', 'M103.889 19.178l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v126.361'],
  ['M94.794 67.954a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v81.373a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-81.373c0-.545.308-1.044.796-1.288z', 'M95.439 70.732l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v79.037'],
  ['M86.344 99.216a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v54.331a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-54.331c0-.545.308-1.044.796-1.288z', 'M86.989 101.994l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v51.995'],
  ['M77.894 123.728a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v34.049a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-34.049c0-.545.308-1.044.796-1.288z', 'M78.539 126.506l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v31.713'],
  ['M69.444 141.478a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v20.529a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-20.529c0-.545.308-1.044.796-1.288z', 'M70.089 144.256l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v18.193'],
  ['M60.994 152.459a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v13.768a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-13.768c0-.545.308-1.044.796-1.288z', 'M61.639 155.237l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v11.432'],
  ['M52.544 160.06a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v10.387a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-10.387c0-.545.308-1.044.796-1.288z', 'M53.189 162.838l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v8.051'],
  ['M44.094 165.979a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v8.698a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-8.698c0-.545.308-1.044.796-1.288z', 'M44.739 168.757l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v6.362'],
  ['M35.634 171.055a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v7.852a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-7.852c0-.545.308-1.044.796-1.288z', 'M36.279 173.833l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v5.516'],
  ['M27.184 175.274a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v7.853a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-7.853c0-.545.308-1.044.796-1.288z', 'M27.829 178.052l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v5.517'],
  ['M18.734 179.504a1.44 1.44 0 0 1 1.288 0l115.686 57.843a3.13 3.13 0 0 1 1.73 2.8v7.853a1.44 1.44 0 0 1-.796 1.288l-1.69.845a1.44 1.44 0 0 1-1.288 0l-115.686-57.843a3.13 3.13 0 0 1-1.73-2.8v-7.853c0-.545.308-1.044.796-1.288z', 'M19.379 182.282l113.061 56.531a3.38 3.38 0 0 1 1.868 3.023v5.517'],
]

/* Ola de brillo que recorre las 15 barras en loop continuo — cada barra
   se enciende una vez por ciclo, con su propio desfase (delay). */
const CYCLE = 5.2
const PULSE = 1.2
const STAGGER = (CYCLE - PULSE) / BARS.length

function MomentumBars() {
  return (
    <svg viewBox="0 0 272 267" width="100%" height="100%" fill="none" style={{ display: 'block', overflow: 'visible' }}>
      {BARS.map(([shape, edge], i) => {
        const delay = i * STAGGER
        return (
          <g key={i} strokeWidth={0.5}>
            <motion.path
              d={shape}
              fill="#0A0A0A"
              stroke="rgba(255,255,255,0.34)"
              animate={{ stroke: ['rgba(255,255,255,0.34)', 'rgba(255,140,0,0.85)', 'rgba(255,255,255,0.34)'] }}
              transition={{ duration: PULSE, repeat: Infinity, repeatDelay: CYCLE - PULSE, delay, ease: 'easeInOut' }}
            />
            <motion.path
              d={edge}
              strokeLinecap="round"
              stroke="rgba(255,255,255,0.14)"
              animate={{ stroke: ['rgba(255,255,255,0.14)', 'rgba(255,140,0,0.9)', 'rgba(255,255,255,0.14)'] }}
              transition={{ duration: PULSE, repeat: Infinity, repeatDelay: CYCLE - PULSE, delay, ease: 'easeInOut' }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export default function ContextoScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start end', 'end end'] })

  const scale     = useTransform(sp, [0, 0.38], [0.88, 1])
  const radius    = useTransform(sp, [0, 0.38], [28, 0])
  const width     = useTransform(sp, [0, 0.38], ['90%', '100%'])
  const contentOp = useTransform(sp, [0.16, 0.34], [0, 1])
  const contentY  = useTransform(sp, [0.16, 0.34], [18, 0])

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

          {/* Grid de fondo — blueprint sutil */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }} />

          {/* Viñeta radial para dar profundidad */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)',
          }} />

          {/* Chrome de panel — 3 puntos con los colores del gradiente insignia
              (el mismo del badge "Lulo Bank" del header), siempre al 100% de opacidad,
              sin depender del fade del contenido */}
          <div style={{ position: 'absolute', top: '28px', left: '28px', display: 'flex', gap: '8px', zIndex: 3 }}>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: deepPurple }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: magenta }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: orange }} />
          </div>

          {/* Contenido — dos columnas de igual altura: título+figura / narrativa */}
          <motion.div style={{
            opacity: contentOp, y: contentY, position: 'relative', zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '64px',
            padding: '0 80px', maxWidth: '1080px', width: '100%', margin: '0 auto',
          }}>

            {/* Columna izquierda — título a la izquierda, figura centrada debajo */}
            <div style={{ flex: '1 1 0%', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <p style={{
                fontFamily: f,
                fontSize: 'clamp(25px, 2.5vw, 33px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1.35,
                textAlign: 'left',
                margin: '0 0 32px',
              }}>
                La campaña superó la meta 6.4x con solo el 1% de base.
              </p>
              <div style={{ width: '210px', alignSelf: 'center' }}>
                <MomentumBars />
              </div>
            </div>

            {/* Columna derecha — narrativa, alineada arriba con el título */}
            <div style={{ flex: '1 1 0%', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <div style={{ borderLeft: '2px solid rgba(255,255,255,0.14)', paddingLeft: '24px', marginBottom: '56px' }}>
                <p style={{ fontFamily: f, fontSize: '17px', lineHeight: '1.85', color: 'rgba(255,255,255,0.55)', fontWeight: 400, margin: 0 }}>
                  Lulo lanzó su CDT el 9 de junio. En 15 días captó{' '}
                  <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>$129.000M COP y 6.000 clientes.</span>{' '}
                  La campaña al 13% terminó el 23 de junio.
                </p>
              </div>

              <div style={{ borderLeft: `2px solid ${orange}`, paddingLeft: '24px' }}>
                <p style={{ fontFamily: f, fontSize: '17px', lineHeight: '1.85', color: '#ffffff', fontWeight: 400, margin: 0 }}>
                  Quedan <span style={{ fontWeight: 700 }}>594.000 usuarios elegibles.</span>{' '}
                  Sin Kepler, no hay estímulo que lea el momento de mercado ni el del usuario. La curva de activación cae.
                </p>
              </div>
            </div>

          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
