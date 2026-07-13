// Versión mobile de DiagnosticoScroll — misma mecánica (2 paneles pinned con
// crossfade+blur atado al scroll), solo con padding/tipografía para pantalla angosta.
'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const PANELS = [
  {
    titulo: '0% comisiones, hasta que llega el cobro',
    texto: 'Klar promete cero comisiones y sin letras chiquitas, pero reviews reales reportan cobros de cobranza cercanos a $400 e intereses incluso pagando a tiempo. La propia página de Klar reporta un CAT promedio de 187% en su tarjeta estándar. No es un problema del crédito, es de comunicación: optimizar las comunicaciones evitaría fricciones con los usuarios.',
    titleColor: '#171717',
    textColor: 'rgba(23,23,23,0.6)',
  },
  {
    titulo: '100% aprobación, 0% comunicación cuando te la quitan',
    texto: 'Klar promete aprobación garantizada sin revisar tu historial: entrar es fácil. Pero reviews reales muestran el otro lado, clientes que ya pagaban puntual a quienes de un día para otro les redujeron el crédito o les cancelaron la cuenta, sin aviso ni explicación. La promesa cubre la entrada, no lo que pasa después. Sin un aviso claro del motivo, el cliente siente que le mintieron, y esa desconfianza escala directo a una queja ante CONDUSEF.',
    titleColor: '#FFFFFF',
    textColor: 'rgba(255,255,255,0.55)',
  },
]

const KP = [
  { range: [0, 0.35, 0.46],  opacity: [1, 1, 0], blur: [0, 0, 14],  scale: [1, 1, 1.04] },
  { range: [0.40, 0.52, 1],  opacity: [0, 1, 1], blur: [14, 0, 0],  scale: [0.96, 1, 1] },
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
      padding: '32px 26px',
      pointerEvents: 'none',
      textAlign: 'center',
    }}>
      <h2 style={{
        fontSize: 'clamp(21px, 6.5vw, 26px)',
        fontWeight: 700,
        color: panel.titleColor,
        letterSpacing: '-0.02em',
        lineHeight: 1.28,
        margin: '0 auto 18px',
      }}>
        {panel.titulo}
      </h2>
      <p style={{
        fontSize: '14.5px',
        lineHeight: '1.75',
        color: panel.textColor,
        margin: '0 auto',
      }}>
        {panel.texto}
      </p>
    </motion.div>
  )
}

export default function MobileDiagnosticoScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const bgColor = useTransform(
    sp,
    [0, 0.42, 0.46, 1],
    ['#FFFEF7', '#FFFEF7', '#2A1040', '#2A1040']
  )

  return (
    <div ref={ref} style={{ position: 'relative', height: '200vh' }}>
      <motion.div style={{ position: 'sticky', top: 0, height: '100vh', backgroundColor: bgColor, overflow: 'hidden' }}>
        {[0, 1].map(i => <Panel key={i} sp={sp} index={i} />)}
      </motion.div>
    </div>
  )
}
