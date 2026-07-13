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

const SIN  = "0,16 65,107 130,146 195,165 260,179 325,187 390,192 455,197 520,199"
const CON  = "0,16 65,69  130,96  195,113 260,124 325,133 390,142 455,149 520,154"
const AREA = "0,16 65,69 130,96 195,113 260,124 325,133 390,142 455,149 520,154 520,199 455,197 390,192 325,187 260,179 195,165 130,146 65,107 0,16"

const MONO = `'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace`

const LINES: Array<{ text: string; type: string; d: number }> = [
  // INIT — burst rápido
  { text: '$ kepler predict --klar --target activacion_tarjeta --demo', type: 'cmd',   d: 55 },
  { text: '',                                                              type: 'blank', d: 32 },
  { text: '  [init]  conectando reviews + calendario MX .............. OK', type: 'ok',  d: 26 },
  { text: '  [init]  modelo de activación · features base ............ OK', type: 'ok',  d: 24 },
  { text: '  [init]  encoder categórico · 6 columnas .................. OK', type: 'ok',  d: 22 },
  { text: '  [init]  scaler StandardScaler · ajustado ................. OK', type: 'ok',  d: 20 },
  { text: '',                                                              type: 'blank', d: 32 },

  // BANXICO — pausa larga, luego rápido
  { text: '  [fetch] Banxico SIE API · iniciando consulta ..........  ', type: 'wait', d: 560 },
  { text: '  [fetch] › TIIE 28 días .....................................  ', type: 'wait', d: 200 },
  { text: '  [fetch] › CETES 28 días ....................................  ', type: 'wait', d: 190 },
  { text: '  [fetch] › INPC / inflación anual ...........................  ', type: 'wait', d: 200 },
  { text: '  [fetch] › calendario quincena + Buen Fin 2026 .............  ', type: 'wait', d: 190 },
  { text: '  [fetch] Banxico SIE API · series oficiales ............. OK', type: 'ok',  d: 50  },
  { text: '',                                                            type: 'blank', d: 32  },

  // CONTEXTO — ritmo medio
  { text: 'CONTEXTO DE MERCADO MEXICANO ──────────────────────────────', type: 'section', d: 60  },
  { text: '  › "TIIE 28d bajó de 7.56% a ~6.75% entre feb y jul 2026"',   type: 'quote',   d: 175 },
  { text: '  › "Quincena activa hoy, liquidez de nómina alta"',          type: 'quote',   d: 165 },
  { text: '  › "Buen Fin 2026 se acerca, ventana de alta demanda"',      type: 'quote',   d: 160 },
  { text: '  fuente: Banxico SIE (oficial) · sin estimaciones propias', type: 'meta',    d: 60  },
  { text: '',                                                            type: 'blank',   d: 32  },

  // VARIABLES — burst rápido
  { text: 'VARIABLES QUE EL MOTOR CRUZARÍA ───────────────────────────', type: 'section', d: 60 },
  { text: '  tiie_28d ..................... tendencia a la baja (real)', type: 'data', d: 24 },
  { text: '  cetes_28d .................... mismo periodo, real       ', type: 'data', d: 22 },
  { text: '  inflacion_anual_pct .......... INPC, fuente Banxico       ', type: 'data', d: 21 },
  { text: '  quincena_binaria ............. 1/15 y quincena gobierno  ', type: 'hi',   d: 145 },
  { text: '  buen_fin_binaria ............. ventana anual de demanda  ', type: 'hi',   d: 138 },
  { text: '',                                                            type: 'blank', d: 32 },

  // ACTIVACIÓN — pausa, luego barra crece rápido
  { text: '  cruzando activación de tarjeta contra el contexto .....', type: 'run', d: 560 },
  { text: '  ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  12%              ',  type: 'bar', d: 72  },
  { text: '  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░  25%              ',   type: 'bar', d: 62  },
  { text: '  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░  37%              ',    type: 'bar', d: 54  },
  { text: '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  50%              ',     type: 'bar', d: 47  },
  { text: '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  62%              ',      type: 'bar', d: 41  },
  { text: '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  75%              ',       type: 'bar', d: 36  },
  { text: '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  87%              ',       type: 'bar', d: 31  },
  { text: '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✓ done    ',       type: 'bar', d: 28  },
  { text: '',                                                           type: 'blank', d: 52  },

  // RESULTADO — pausa dramática, luego rápido
  { text: '─────────────────────────────────────────────────────────', type: 'div', d: 26  },
  { text: '  EJEMPLO ILUSTRATIVO  →  activación de tarjeta           ', type: 'res', d: 480 },
  { text: '  sube cuando la TIIE baja y coincide con quincena         ', type: 'sub', d: 160 },
  { text: '  o con el Buen Fin                                        ', type: 'sub', d: 140 },
  { text: '─────────────────────────────────────────────────────────', type: 'div', d: 26  },
]

function lc(type: string) {
  const m: Record<string, string> = {
    cmd:     orange,
    ok:      green,
    wait:    'rgba(255,255,255,0.35)',
    info:    'rgba(255,255,255,0.42)',
    section: 'rgba(255,255,255,0.65)',
    data:    'rgba(255,255,255,0.48)',
    quote:   'rgba(255,255,255,0.6)',
    meta:    'rgba(255,255,255,0.36)',
    hi:      magenta,
    warn:    '#fbbf24',
    sh_hi:   '#f87171',
    sh_md:   green,
    sh_lo:   '#fbbf24',
    sh_ok:   'rgba(255,255,255,0.33)',
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

/* ── Panel 0: Motor Predictivo — fondo #1b2132 ───────────────────── */
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visible])

  return (
    <motion.div style={{ opacity, scale, filter, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none', fontFamily: f, overflow: 'hidden' }}>

      {/* LEFT — terminal card hugs left wall, dark bg around it is panel bg */}
      <div style={{ flex: '0 0 50%', display: 'flex', alignItems: 'center', padding: '48px 28px 48px 0' }}>
        <div style={{
          width: '100%',
          height: '78vh',
          background: '#0d1117',
          borderRadius: '0 16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Title bar */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0, background: '#161b22' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
            <span style={{ marginLeft: 14, color: 'rgba(255,255,255,0.2)', fontSize: 11.5, fontFamily: MONO, letterSpacing: '0.02em' }}>
              kepler@model  —  bash
            </span>
          </div>

          {/* Output lines */}
          <style>{`#kterm::-webkit-scrollbar{display:none}`}</style>
          <div id="kterm" ref={scrollRef} style={{ padding: '18px 16px 18px 40px', flex: 1, overflowY: 'auto', overflowX: 'hidden', fontFamily: MONO, fontSize: 11.5, lineHeight: 1.75, scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
            {LINES.slice(0, visible).map((line, i) => (
              <div key={i} style={{ color: lc(line.type), whiteSpace: 'pre', letterSpacing: '0.01em' }}>
                {line.text || ' '}
              </div>
            ))}
            {visible < LINES.length && (
              <motion.span
                style={{ display: 'inline-block', width: 6, height: 13, background: orange, verticalAlign: 'text-bottom' }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' as const }}
              />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — texto claro sobre fondo oscuro */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px 80px 52px' }}>
        <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, color: white, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 28px' }}>
          Motor Predictivo de Conversión
        </h2>
        <p style={{ fontSize: '18px', lineHeight: 1.85, color: 'rgba(255,255,255,0.62)', margin: 0 }}>
          Nuestro sistema no solo cruza datos, entiende exactamente por qué y cuándo un usuario decide activar su tarjeta de crédito con garantía. Al conectar el historial de comportamiento de la base con el contexto macro real de México (TIIE, CETES, inflación INPC, calendario de quincena y Buen Fin vía Banxico), el motor aísla la causa real detrás de cada activación. El resultado es inteligencia de negocio accionable: por ejemplo, anticipar que la demanda de crédito repunta cuando la TIIE baja y coincide con quincena o con el Buen Fin.
        </p>
      </div>

    </motion.div>
  )
}

/* ── Panel 1: Radar Estratégico + gráfico — fondo #ffffff ────────── */
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
    <motion.div style={{ opacity, scale, filter, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '72px 100px', gap: '72px', pointerEvents: 'none', fontFamily: f }}>

      {/* LEFT — texto, mismas dimensiones que Panel 0 */}
      <div style={{ flex: '0 0 40%' }}>
        <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, color: ink, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 28px' }}>
          Radar Estratégico de Mercado
        </h2>
        <p style={{ fontSize: '18px', lineHeight: 1.85, color: 'rgba(23,23,23,0.62)', margin: 0 }}>
          Transformamos números estadísticos fríos en argumentos de venta irrefutables. Cada semana, el algoritmo anticipa las tendencias del mercado mexicano y extrae el contexto real detrás de los datos (por ejemplo, qué significa para tus usuarios la última decisión de Banxico sobre la TIIE). Esto nos permite adelantarnos a la competencia y hablarle al usuario con un timing perfecto, anclando la comunicación a la realidad financiera que está viviendo en ese instante.
        </p>
      </div>

      {/* RIGHT — gráfico como héroe, stat anclado abajo */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Gráfico animado — hero */}
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

        {/* Fila inferior: leyenda izquierda · stat derecha */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(23,23,23,0.07)' }}>

          {/* Leyenda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(23,23,23,0.55)', fontSize: '17px', lineHeight: 1 }}>
              <svg width="28" height="10" viewBox="0 0 28 10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke={orange} strokeWidth="2" strokeDasharray="5,3" opacity="0.7" />
              </svg>
              Sin intervención
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(23,23,23,0.55)', fontSize: '17px', lineHeight: 1 }}>
              <svg width="28" height="10" viewBox="0 0 28 10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke={purple} strokeWidth="2.5" />
              </svg>
              Con Kepler
            </span>
          </div>

          {/* Stat — caption editorial */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ backgroundImage: GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontSize: 'clamp(38px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 6px' }}>
              +3.31<span style={{ fontSize: '0.45em', verticalAlign: 'super', fontWeight: 700 }}>pp</span>
            </p>
            <p style={{ color: 'rgba(23,23,23,0.5)', fontSize: '17px', margin: 0 }}>
              más conversiones semanales en primera implementación
            </p>
          </div>

        </div>

      </div>

    </motion.div>
  )
}

const PUSH_NOTIF = { text: 'Tu línea de crédito puede subir esta quincena. Actívala antes de que cierre la ventana.', time: 'ahora' }
const EMAIL_NOTIF = { sender: 'Klar', subject: 'Así construyes tu historial con tu primera tarjeta con garantía', time: 'ahora' }

/* ── Panel 2: iPhone 14 Pro Max + Hiper-Personalización — fondo #2b3550 ── */
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

  return (
    /* padding-bottom: 0 para que el teléfono pueda emerger del borde inferior */
    <motion.div style={{ opacity, scale, filter, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '80px 100px 0', gap: '56px', pointerEvents: 'none', fontFamily: f }}>

      {/* Left: iPhone 14 Pro Max emergiendo del borde inferior */}
      <div style={{
        flex: 1,
        alignSelf: 'stretch',       /* columna full-height, bottom = 100vh */
        display: 'flex',
        alignItems: 'flex-end',     /* teléfono pegado al fondo */
        justifyContent: 'center',
      }}>
        {/* iPhone 14 Pro Max: 380 × 787px (ratio 2.071:1). translateY(20%) = 157px bajo el fold */}
        <div style={{
          width: '380px',
          height: '787px',
          background: '#1c1c1e',
          borderRadius: '58px',
          border: '1px solid rgba(255,255,255,0.09)',
          position: 'relative',
          flexShrink: 0,
          transform: 'translateY(20%)',
        }}>

          {/* Botón silencio izquierda */}
          <div style={{ position: 'absolute', left: '-4px', top: '175px', width: '4px', height: '33px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px 0 0 2px' }} />
          {/* Volumen + izquierda */}
          <div style={{ position: 'absolute', left: '-4px', top: '226px', width: '4px', height: '46px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px 0 0 2px' }} />
          {/* Volumen - izquierda */}
          <div style={{ position: 'absolute', left: '-4px', top: '287px', width: '4px', height: '46px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px 0 0 2px' }} />
          {/* Power derecha */}
          <div style={{ position: 'absolute', right: '-4px', top: '252px', width: '4px', height: '72px', background: 'rgba(255,255,255,0.18)', borderRadius: '0 2px 2px 0' }} />

          {/* Pantalla */}
          <div style={{
            position: 'absolute',
            inset: '13px',
            background: 'linear-gradient(165deg, #4A0072 0%, #2A1040 45%, #14081f 100%)',
            borderRadius: '46px',
            overflow: 'hidden',
          }}>
            {/* Dynamic Island */}
            <div style={{
              position: 'absolute', top: '16px', left: '50%',
              transform: 'translateX(-50%)',
              width: '114px', height: '30px',
              background: '#0a0a0a', borderRadius: '15px', zIndex: 10,
            }} />

            {/* Contenido lock screen */}
            <div style={{ padding: '66px 18px 22px' }}>

              {/* Hora */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '66px', fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 6px' }}>9:41</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '15px', margin: 0, letterSpacing: '0.01em' }}>Viernes, 27 de junio</p>
              </div>

              {/* Notificaciones — 1 push (app Klar) + 1 correo (estilo Mail de iOS), con stagger */}
              <motion.div
                initial={{ opacity: 0, y: -18 }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
                transition={{ duration: 0.55, delay: shown ? 0.6 : 0, ease: 'easeOut' }}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: '18px',
                  padding: '13px 15px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    backgroundImage: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#FFFFFF' }}>K</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600 }}>Klar</span>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', marginLeft: 'auto' }}>{PUSH_NOTIF.time}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{PUSH_NOTIF.text}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -18 }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
                transition={{ duration: 0.55, delay: shown ? 2.0 : 0, ease: 'easeOut' }}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: '18px',
                  padding: '13px 15px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: 'linear-gradient(160deg, #5AC8FA 0%, #0A6CFF 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600 }}>Mail</span>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', marginLeft: 'auto' }}>{EMAIL_NOTIF.time}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '13px', fontWeight: 700, lineHeight: 1.4, margin: '0 0 2px' }}>{EMAIL_NOTIF.sender}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{EMAIL_NOTIF.subject}</p>
              </motion.div>
            </div>
          </div>

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '12px', left: '50%',
            transform: 'translateX(-50%)',
            width: '126px', height: '5px',
            background: 'rgba(255,255,255,0.22)', borderRadius: '3px',
          }} />
        </div>
      </div>

      {/* Right: Hiper-Personalización text — con padding-bottom compensado */}
      <div style={{ flex: 1, paddingBottom: '80px' }}>
        <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, color: white, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 28px' }}>
          Hiper-Personalización Automatizada
        </h2>
        <p style={{ fontSize: '17px', lineHeight: 1.85, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          Convertimos todo ese contexto (mercado + datos + usuario) en un motor de crecimiento que opera en piloto automático. El sistema decide dinámicamente qué gatillo psicológico usar para cada segmento: a un usuario nuevo lo educa sobre cómo construir historial crediticio con su primera tarjeta con garantía, mientras que a uno con buen comportamiento de pago le anticipa un aumento de línea antes de que lo pida. Todo esto se orquesta y ejecuta a escala, y lo mejor: sin implementaciones nuevas ni migración, todo desde el stack que ya tienen hoy.
        </p>
      </div>

    </motion.div>
  )
}

/* ── Export ──────────────────────────────────────────────────────── */
export default function S2Scroll() {
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
