'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const PANELS = [
  {
    titulo: 'Fricción pre-lanzamiento',
    texto: 'Ingeniería anticipó la fricción con "CDT a un toque" (v.2.78.0). Este patrón sistémico acaparó el 67% de los releases (4 de 6 en 90 días) para reparar el funnel. Esta inestabilidad previa ya había exigido dos parches críticos semanales (v2.74.0 y .1) en onboarding y publicar 5 causas de fallos PSE para frenar el insostenible volumen de tickets.',
    titleColor: '#FFFFFF',
    textColor: 'rgba(255,255,255,0.55)',
  },
  {
    titulo: 'Fricción post-registro confirmada por usuarios',
    texto: 'Un análisis NLP (tiendas de apps) muestra que el 33% de usuarios reporta fricción en depósitos/PSE, costando -1.30 estrellas (regresión OLS). Un rating idéntico (4.6) en iOS/Android descarta fallos de plataforma y confirma un gap de activación. Este bloqueo del funnel explica las 0 reviews del CDT en dos semanas: la base no logra descubrirlo ni activarlo.',
    titleColor: '#121622',
    textColor: 'rgba(18,22,34,0.6)',
  },
  {
    titulo: 'Potenciando la capacidad operativa para escalar el CDT',
    texto: 'El CDT es clave para el break-even. Para cumplir la visión del CEO de "profundizar relaciones con clientes actuales", Kepler maximiza la activación personalizada y otorga musculatura operativa al equipo de Growth (en actual expansión). Así, el éxito inicial (6.4x la meta, impulsado por tasas del 13% y prensa) dejará de ser temporal para convertirse en un motor de conversión sostenible.',
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

  const bgColor = useTransform(
    sp,
    [0, 0.29, 0.32, 0.63, 0.66, 1],
    ['#2b3550', '#2b3550', '#dfe2e7', '#dfe2e7', '#1b2132', '#1b2132']
  )

  return (
    <div ref={ref} style={{ position: 'relative', height: '300vh' }}>
      <motion.div style={{ position: 'sticky', top: 0, height: '100vh', backgroundColor: bgColor, overflow: 'hidden' }}>
        {[0, 1, 2].map(i => <Panel key={i} sp={sp} index={i} />)}
      </motion.div>
    </div>
  )
}
