// Versión mobile de S2Scroll — misma mecánica de 3 paneles pinned con
// crossfade+blur atado al scroll, y las mismas animaciones internas (terminal
// tipeando, gráfico dibujándose, notificaciones en cascada), reflujadas de
// layout lado-a-lado a una columna. Archivo independiente, no toca desktop.
'use client'
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const purple  = '#4A0072'
const magenta = '#C2185B'
const orange  = '#FF8C00'
const green   = '#22C55E'
const ink     = '#171717'
const white   = '#FFFFFF'

const GRADIENT = `linear-gradient(115deg, ${purple} 0%, ${magenta} 50%, ${orange} 100%)`
const MONO = `'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace`

// Líneas cortas a propósito (≤ ~34 caracteres) para que quepan completas en el
// ancho angosto del terminal mobile sin wrap ni corte — cada línea es de una
// sola pieza, igual que en una terminal real.
const LINES: Array<{ text: string; type: string; d: number }> = [
  { text: '$ kepler predict --klar --demo',      type: 'cmd',   d: 55 },
  { text: '',                                    type: 'blank', d: 28 },
  { text: '[init] reviews + calendario MX  OK',  type: 'ok',  d: 24 },
  { text: '[init] modelo activación .... OK',    type: 'ok',  d: 22 },
  { text: '',                                    type: 'blank', d: 28 },
  { text: '[fetch] Banxico SIE API ......',      type: 'wait', d: 380 },
  { text: '[fetch] TIIE, CETES, INPC   OK',      type: 'ok',  d: 50  },
  { text: '',                                    type: 'blank', d: 28 },

  { text: 'CONTEXTO MEXICANO ────────────',      type: 'section', d: 50  },
  { text: '› TIIE 28d: 7.56% → 6.75%',            type: 'quote',   d: 140 },
  { text: '› Quincena activa hoy',                type: 'quote',   d: 130 },
  { text: '› Buen Fin 2026 se acerca',            type: 'quote',   d: 110 },
  { text: 'fuente: Banxico SIE, oficial',         type: 'meta',    d: 50  },
  { text: '',                                     type: 'blank',   d: 28  },

  { text: 'VARIABLES A CRUZAR ───────────',       type: 'section', d: 50  },
  { text: 'tiie_28d      a la baja (real)',       type: 'sh_hi', d: 105 },
  { text: 'quincena_bin  activo hoy',             type: 'sh_md', d: 92  },
  { text: 'buen_fin_bin  ventana anual',          type: 'sh_md', d: 85  },
  { text: '',                                     type: 'blank', d: 36  },

  { text: 'cruzando activación ...',              type: 'run', d: 420 },
  { text: '████████████████ 100% ✓ done',        type: 'bar', d: 40  },
  { text: '',                                     type: 'blank', d: 44  },

  { text: '──────────────────────────────',       type: 'div', d: 24  },
  { text: 'EJEMPLO → activación sube con',        type: 'res', d: 380 },
  { text: 'TIIE a la baja + quincena',            type: 'sub', d: 130 },
  { text: '──────────────────────────────',       type: 'div', d: 24  },
]

function lc(type: string) {
  const m: Record<string, string> = {
    cmd:     orange,
    ok:      green,
    wait:    'rgba(255,255,255,0.35)',
    section: 'rgba(255,255,255,0.65)',
    data:    'rgba(255,255,255,0.48)',
    quote:   'rgba(255,255,255,0.6)',
    meta:    'rgba(255,255,255,0.36)',
    hi:      magenta,
    warn:    '#fbbf24',
    sh_hi:   '#f87171',
    sh_md:   green,
    sh_lo:   '#fbbf24',
    run:     'rgba(255,255,255,0.48)',
    bar:     orange,
    div:     'rgba(255,255,255,0.16)',
    res:     '#ffffff',
    num:     orange,
    sub:     'rgba(255,255,255,0.52)',
  }
  return m[type] ?? 'rgba(255,255,255,0.3)'
}

const KP = [
  { range: [0, 0.25, 0.33],          opacity: [1, 1, 0] as number[],    blur: [0, 0, 14] as number[],     scale: [1, 1, 1.04] as number[]     },
  { range: [0.28, 0.36, 0.60, 0.68], opacity: [0, 1, 1, 0] as number[], blur: [14, 0, 0, 14] as number[], scale: [0.96, 1, 1, 1.04] as number[] },
  { range: [0.63, 0.72, 1],          opacity: [0, 1, 1] as number[],    blur: [14, 0, 0] as number[],     scale: [0.96, 1, 1] as number[]     },
]

function usePanel(sp: MotionValue<number>, i: number) {
  const { range, opacity: opV, blur: blurV, scale: scaleV } = KP[i]
  const opacity = useTransform(sp, range, opV)
  const scale   = useTransform(sp, range, scaleV)
  const blurRaw = useTransform(sp, range, blurV)
  const filter  = useTransform(blurRaw, (v: number) => `blur(${v}px)`)
  return { opacity, scale, filter }
}

/* ── Panel 0: Motor Predictivo — terminal arriba, texto abajo ───────── */
function Panel0({ sp }: { sp: MotionValue<number> }) {
  const { opacity, scale, filter } = usePanel(sp, 0)
  const [visible, setVisible] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

  useEffect(() => {
    if (visible >= LINES.length) {
      const t = setTimeout(() => setVisible(0), 3400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisible(v => v + 1), LINES[visible].d)
    return () => clearTimeout(t)
  }, [visible])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [visible])

  return (
    <motion.div style={{ opacity, scale, filter, position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: 'none', fontFamily: f, overflow: 'hidden', padding: '0 22px' }}>

      <div style={{ flex: '0 0 auto', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 700, color: white, letterSpacing: '-0.02em', lineHeight: 1.28, margin: '0 0 10px' }}>
          Motor Predictivo de Conversión
        </h2>
        <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(255,255,255,0.62)', margin: 0 }}>
          Nuestro sistema entiende por qué y cuándo un usuario activa su tarjeta con garantía. Cruza su comportamiento con el contexto macro real de México (TIIE, CETES, inflación, quincena, Buen Fin) para anticipar, por ejemplo, cuándo repunta la demanda de crédito.
        </p>
      </div>

      {/* Terminal — altura fija y baja, línea completa sin wrap (whiteSpace: pre) */}
      <div style={{ flex: '0 0 auto', height: '330px', background: '#0d1117', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0, background: '#161b22' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <span style={{ marginLeft: 10, color: 'rgba(255,255,255,0.2)', fontSize: 9.5, fontFamily: MONO }}>kepler@model — bash</span>
        </div>

        <style>{`#kterm-m::-webkit-scrollbar{display:none}`}</style>
        <div id="kterm-m" ref={scrollRef} style={{ padding: '10px 14px', flex: 1, overflowY: 'auto', overflowX: 'hidden', fontFamily: MONO, fontSize: 10.5, lineHeight: 1.55, scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
          {LINES.slice(0, visible).map((line, i) => (
            <div key={i} style={{ color: lc(line.type), whiteSpace: 'pre', letterSpacing: '0.01em' }}>
              {line.text || ' '}
            </div>
          ))}
          {visible < LINES.length && (
            <motion.span
              style={{ display: 'inline-block', width: 5, height: 11, background: orange, verticalAlign: 'text-bottom' }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' as const }}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Panel 1: Radar Estratégico + gráfico — texto arriba, gráfico abajo ── */
function Panel1({ sp }: { sp: MotionValue<number> }) {
  const { opacity, scale, filter } = usePanel(sp, 1)
  const [drawn, setDrawn] = useState(false)
  const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const unsub = opacity.on('change', (v: number) => {
      if (v > 0.05) { clearTimeout(timer); setDrawn(true) }
      else if (v < 0.02) { timer = setTimeout(() => setDrawn(false), 200) }
    })
    return () => { unsub(); clearTimeout(timer) }
  }, [opacity])

  return (
    <motion.div style={{ opacity, scale, filter, position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', pointerEvents: 'none', fontFamily: f, overflow: 'hidden' }}>

      <div style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 700, color: ink, letterSpacing: '-0.02em', lineHeight: 1.28, margin: '0 0 10px' }}>
          Radar Estratégico de Mercado
        </h2>
        <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(23,23,23,0.62)', margin: 0 }}>
          Convertimos números fríos en argumentos de venta. Cada semana el algoritmo anticipa el mercado mexicano (ej. qué significa la última decisión de Banxico sobre la TIIE) para hablarle al usuario con el timing correcto.
        </p>
      </div>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <svg viewBox="0 0 520 205" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[50, 100, 150, 199].map(y => (
            <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(23,23,23,0.05)" strokeWidth={1} />
          ))}
          <motion.path
            d="M 0,16 L 65,69 L 130,96 L 195,113 L 260,124 L 325,133 L 390,142 L 455,149 L 520,154 L 520,199 L 455,197 L 390,192 L 325,187 L 260,179 L 195,165 L 130,146 L 65,107 L 0,16 Z"
            fill={magenta} fillOpacity="0.12"
            animate={{ opacity: drawn ? 1 : 0 }}
            transition={drawn ? { duration: 0.8, delay: 1.6 } : { duration: 0 }}
          />
          <motion.path
            d="M 0,16 L 65,107 L 130,146 L 195,165 L 260,179 L 325,187 L 390,192 L 455,197 L 520,199"
            fill="none" stroke={orange} strokeWidth={2} strokeDasharray="7,5"
            animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 0.6 : 0 }}
            transition={drawn ? { duration: 2.0, ease: 'easeOut' as const, delay: 0.5 } : { duration: 0 }}
          />
          <motion.path
            d="M 0,16 L 65,69 L 130,96 L 195,113 L 260,124 L 325,133 L 390,142 L 455,149 L 520,154"
            fill="none" stroke={purple} strokeWidth={2.5}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={drawn ? { duration: 2.2, ease: 'easeOut' as const, delay: 0.8 } : { duration: 0 }}
          />
        </svg>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(23,23,23,0.07)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(23,23,23,0.55)', fontSize: '13px', lineHeight: 1 }}>
              <svg width="22" height="8" viewBox="0 0 28 10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke={orange} strokeWidth="2" strokeDasharray="5,3" opacity="0.7" />
              </svg>
              Sin intervención
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(23,23,23,0.55)', fontSize: '13px', lineHeight: 1 }}>
              <svg width="22" height="8" viewBox="0 0 28 10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke={purple} strokeWidth="2.5" />
              </svg>
              Con Kepler
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ backgroundImage: GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontSize: 'clamp(30px, 9vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 4px' }}>
              +3.31<span style={{ fontSize: '0.45em', verticalAlign: 'super', fontWeight: 700 }}>pp</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const PUSH_NOTIF = { text: 'Tu línea de crédito puede subir esta quincena. Actívala antes de que cierre la ventana.', time: 'ahora' }
const EMAIL_NOTIF = { sender: 'Klar', subject: 'Así construyes tu historial con tu primera tarjeta con garantía', time: 'ahora' }

/* ── Panel 2: iPhone (compacto) + Hiper-Personalización ──────────────── */
function Panel2({ sp }: { sp: MotionValue<number> }) {
  const { opacity, scale, filter } = usePanel(sp, 2)
  const [shown, setShown] = useState(false)
  const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const unsub = opacity.on('change', (v: number) => {
      if (v > 0.05) { clearTimeout(timer); setShown(true) }
      else if (v < 0.02) { timer = setTimeout(() => setShown(false), 200) }
    })
    return () => { unsub(); clearTimeout(timer) }
  }, [opacity])

  // iPhone más ancho (300px), anclado al piso real de la sección (flex:1 +
  // alignItems:flex-end) y empujado hacia abajo con translateY para que solo
  // se vea ~60% — el mismo truco de desktop (ahí es translateY(20%)), solo que
  // aquí recortamos más para lograr el efecto "sale 60%" pedido.
  const PHONE_W = 300
  const PHONE_H = Math.round(PHONE_W * 787 / 380) // misma proporción que el iPhone de desktop

  return (
    <motion.div style={{ opacity, scale, filter, position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '140px 22px 0', pointerEvents: 'none', fontFamily: f, overflow: 'hidden' }}>

      <div style={{ flex: '0 0 auto', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 700, color: white, letterSpacing: '-0.02em', lineHeight: 1.28, margin: '0 0 10px' }}>
          Hiper-Personalización Automatizada
        </h2>
        <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          El sistema decide qué gatillo usar por segmento: a un usuario nuevo lo educa sobre cómo construir historial con su primera tarjeta con garantía, a uno con buen pago le anticipa un aumento de línea. Todo desde el stack que ya tienen hoy, sin migración.
        </p>
      </div>

      {/* Piso de la sección: ocupa todo el espacio restante, el celular se ancla abajo.
          Ojo: flexDirection es 'column' aquí, así que el eje vertical lo controla
          justifyContent (no alignItems, que en column es el eje horizontal). */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{
          width: `${PHONE_W}px`,
          height: `${PHONE_H}px`,
          background: '#1c1c1e',
          borderRadius: '46px',
          border: '1px solid rgba(255,255,255,0.09)',
          position: 'relative',
          flexShrink: 0,
          transform: 'translateY(40%)',
        }}>
          <div style={{
            position: 'absolute', inset: '11px',
            background: 'linear-gradient(165deg, #4A0072 0%, #2A1040 45%, #14081f 100%)',
            borderRadius: '37px',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '13px', left: '50%',
              transform: 'translateX(-50%)',
              width: '90px', height: '23px',
              background: '#0a0a0a', borderRadius: '12px', zIndex: 10,
            }} />

            <div style={{ padding: '50px 16px 14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '48px', fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 5px' }}>9:41</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: 0, letterSpacing: '0.01em' }}>Viernes, 27 de junio</p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.55, delay: shown ? 0.5 : 0, ease: 'easeOut' }}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '11px 12px',
                  marginBottom: '9px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                  <div style={{
                    width: '19px', height: '19px', borderRadius: '5px',
                    backgroundImage: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FFFFFF' }}>K</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 600 }}>Klar</span>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '9.5px', marginLeft: 'auto' }}>{PUSH_NOTIF.time}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: '11px', lineHeight: 1.45, margin: 0 }}>{PUSH_NOTIF.text}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.55, delay: shown ? 1.7 : 0, ease: 'easeOut' }}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '11px 12px',
                  marginBottom: '9px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                  <div style={{
                    width: '19px', height: '19px', borderRadius: '5px',
                    background: 'linear-gradient(160deg, #5AC8FA 0%, #0A6CFF 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 600 }}>Mail</span>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '9.5px', marginLeft: 'auto' }}>{EMAIL_NOTIF.time}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '11px', fontWeight: 700, lineHeight: 1.35, margin: '0 0 2px' }}>{EMAIL_NOTIF.sender}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', lineHeight: 1.45, margin: 0 }}>{EMAIL_NOTIF.subject}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  )
}

/* ── Export ──────────────────────────────────────────────────────── */
export default function MobileS2Scroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const bgColor = useTransform(
    sp,
    [0, 0.29, 0.32, 0.63, 0.66, 1],
    ['#2A1040', '#2A1040', '#ffffff', '#ffffff', '#0A0A0A', '#0A0A0A']
  )

  return (
    <div ref={ref} style={{ position: 'relative', height: '300vh' }}>
      <motion.div style={{ position: 'sticky', top: 0, height: '100vh', backgroundColor: bgColor, overflow: 'hidden' }}>
        <Panel0 sp={sp} />
        <Panel1 sp={sp} />
        <Panel2 sp={sp} />
      </motion.div>
    </div>
  )
}
