'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const PANELS = [
  {
    titulo: 'La automatización no es orquestación',
    texto: 'Zoho CRM automatiza cuándo enviar, pero envía lo mismo a todos: sin contexto de mercado, sin personalización por cliente, sin leer su momento mental. No decide qué comunicación genera más depósitos, ni ejecuta nada sin que alguien configure la regla a mano. Kepler sí lo decide, lo personaliza y lo ejecuta directo en el mismo CRM, sin configuración manual.',
    titleColor: '#171717',
    textColor: 'rgba(23,23,23,0.6)',
  },
  {
    titulo: 'El 92,3% de la base histórica nunca abrió un CDT',
    texto: 'KOA tiene 117.000 clientes de libranza: ya vinculados, ya bancarizados, ya conocen la marca. Solo 9.000 (7,7%) han abierto un CDT. Los 108.000 restantes no son un problema de adquisición, es una base dormida esperando el momento correcto para convertir.',
    titleColor: '#FFFFFF',
    textColor: 'rgba(255,255,255,0.55)',
  },
  {
    titulo: 'Contratan para operar, no para crecer',
    texto: 'Las vacantes activas de KOA lo confirman: operaciones, contabilidad, crédito, diseño gráfico. Ninguna es growth, data o CRM strategy. Están contratando para operar y cumplir regulación, no para escalar la inteligencia de captación que exige la meta. Y esa función no se resuelve contratando: se resuelve con una capa de inteligencia autónoma y eficiente sobre lo que ya tienen.',
    titleColor: '#FFFFFF',
    textColor: 'rgba(255,255,255,0.55)',
  },
]

const KP = [
  { range: [0, 0.25, 0.33],          opacity: [1, 1, 0],    blur: [0, 0, 14],    scale: [1, 1, 1.04]    },
  { range: [0.28, 0.36, 0.60, 0.68], opacity: [0, 1, 1, 0], blur: [14, 0, 0, 14],scale: [0.96, 1, 1, 1.04] },
  { range: [0.63, 0.72, 1],           opacity: [0, 1, 1],    blur: [14, 0, 0],    scale: [0.96, 1, 1]    },
]

function usePanel(sp: MotionValue<number>, i: number) {
  const { range, opacity: opV, blur: blurV, scale: scaleV } = KP[i]
  const opacity = useTransform(sp, range, opV)
  const scale   = useTransform(sp, range, scaleV)
  const blurRaw = useTransform(sp, range, blurV)
  const filter  = useTransform(blurRaw, (v: number) => `blur(${v}px)`)
  return { opacity, scale, filter }
}

function Panel({ sp, index }: { sp: MotionValue<number>; index: number }) {
  const panel = PANELS[index]
  const { opacity, scale, filter } = usePanel(sp, index)

  return (
    <motion.div style={{
      opacity, scale, filter,
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 120px',
      pointerEvents: 'none',
      textAlign: 'center',
    }}>
      <h2 style={{
        fontSize: 'clamp(26px, 3vw, 42px)',
        fontWeight: 700,
        color: panel.titleColor,
        letterSpacing: '-0.02em',
        lineHeight: 1.22,
        maxWidth: '800px',
        margin: '0 auto 36px',
      }}>
        {panel.titulo}
      </h2>
      <p style={{
        fontSize: '20px',
        lineHeight: '1.85',
        color: panel.textColor,
        maxWidth: '760px',
        margin: '0 auto',
      }}>
        {panel.texto}
      </p>
    </motion.div>
  )
}

export default function DiagnosticoScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  /* claro (crema Kepler) → oscuro (negro Kepler) → cierre en el morado
     de la primera propuesta (#2A1040) — un poco más claro que el intento
     más oscuro (#170822), mismo matiz que el punto del chrome en
     ContextoScroll. */
  const bgColor = useTransform(
    sp,
    [0, 0.29, 0.32, 0.63, 0.66, 1],
    ['#FFFEF7', '#FFFEF7', '#0A0A0A', '#0A0A0A', '#2A1040', '#2A1040']
  )

  return (
    <div ref={ref} style={{ position: 'relative', height: '300vh' }}>
      <motion.div style={{ position: 'sticky', top: 0, height: '100vh', backgroundColor: bgColor, overflow: 'hidden' }}>
        {[0, 1, 2].map(i => <Panel key={i} sp={sp} index={i} />)}
      </motion.div>
    </div>
  )
}
