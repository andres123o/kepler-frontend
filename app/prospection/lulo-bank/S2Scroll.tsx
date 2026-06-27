'use client'
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const lime  = '#E8FF00'
const navy  = '#121622'
const white = '#FFFFFF'
const amber = '#FF8C00'

const SIN  = "0,16 65,107 130,146 195,165 260,179 325,187 390,192 455,197 520,199"
const CON  = "0,16 65,69  130,96  195,113 260,124 325,133 390,142 455,149 520,154"
const AREA = "0,16 65,69 130,96 195,113 260,124 325,133 390,142 455,149 520,154 520,199 455,197 390,192 325,187 260,179 195,165 130,146 65,107 0,16"

const MONO = `'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace`

const LINES: Array<{ text: string; type: string; d: number }> = [
  // INIT — burst rápido
  { text: '$ kepler predict --target primer_cashin --semana 2026-W26', type: 'cmd',   d: 55 },
  { text: '',                                                           type: 'blank', d: 32 },
  { text: '  [init]  conectando Supabase · tabla ultima_semana .... OK', type: 'ok',  d: 26 },
  { text: '  [init]  última fila: semana 16 al 22 de junio 2026 .. OK', type: 'ok',  d: 24 },
  { text: '  [init]  modelo v6 · 30 features · XGBoost 1.7 ....... OK', type: 'ok',  d: 22 },
  { text: '  [init]  pipeline de features · validando ............. OK', type: 'ok',  d: 20 },
  { text: '  [init]  encoder categórico · 8 columnas .............. OK', type: 'ok',  d: 18 },
  { text: '  [init]  scaler StandardScaler · ajustado ............. OK', type: 'ok',  d: 18 },
  { text: '',                                                           type: 'blank', d: 32 },

  // PERPLEXITY — pausa larga, luego rápido
  { text: '  [fetch] Perplexity sonar-pro · iniciando búsqueda ......  ', type: 'wait', d: 620 },
  { text: '  [fetch] › "tasa CDT Colombia junio 2026" ................  ', type: 'wait', d: 220 },
  { text: '  [fetch] › "BanRep decisión monetaria julio 2026" ........  ', type: 'wait', d: 200 },
  { text: '  [fetch] › "inflación Colombia mayo 2026 DANE" ...........  ', type: 'wait', d: 210 },
  { text: '  [fetch] › "quincena Colombia liquidez inversión junio" ...  ', type: 'wait', d: 190 },
  { text: '  [fetch] › "COLCAP rendimiento semanal acciones" ..........  ', type: 'wait', d: 180 },
  { text: '  [fetch] Perplexity sonar-pro · 15 fuentes .............. OK', type: 'ok',  d: 50  },
  { text: '',                                                            type: 'blank', d: 32  },

  // CONTEXTO — ritmo medio
  { text: 'CONTEXTO DE MERCADO ─────────────────────────────────────',   type: 'section', d: 60  },
  { text: '  › "BanRep 11.25% — sin recorte; mercado espera Q3 2026"',  type: 'quote',   d: 175 },
  { text: '  › "Spread CDT real sobre inflación: máximos desde 2019"',  type: 'quote',   d: 165 },
  { text: '  › "Quincena 28-jun activa — liquidez corporativa alta"',   type: 'quote',   d: 160 },
  { text: '  › "COLCAP +1.24% semanal, apetito de riesgo positivo"',   type: 'quote',   d: 155 },
  { text: '  › "Brent +0.4% semanal, sin presión importada al TRM"',   type: 'quote',   d: 150 },
  { text: '  › "S&P500 +0.87% en 7d, clima de riesgo global estable"', type: 'quote',   d: 145 },
  { text: '  fuentes verificadas: 15  ·  confianza del contexto: 94%', type: 'meta',    d: 60  },
  { text: '',                                                            type: 'blank',   d: 32  },

  // VARIABLES — burst rápido
  { text: 'VARIABLES MACROECONÓMICAS ───────────────────────────────',  type: 'section', d: 60 },
  { text: '  TRM_promedio_7d ........... COP 4,312.50    ↑ +0.14%  ', type: 'data', d: 24 },
  { text: '  banrep_tasa_pct ........... 11.25%          → estable  ', type: 'data', d: 22 },
  { text: '  inflacion_anual_pct ....... 5.84%           → estable  ', type: 'data', d: 21 },
  { text: '  spread_cdt_inflacion_pp ... +6.16 pp        ← ACTIVA  ',  type: 'hi',   d: 145 },
  { text: '  ciclo_quincena_binary ..... activo (28-jun) ← ACTIVA  ',  type: 'hi',   d: 138 },
  { text: '  colcap_retorno_semanal .... +1.24%          ↑ positivo ', type: 'data', d: 23 },
  { text: '  sp500_retorno_7d .......... +0.87%          ↑ positivo ', type: 'data', d: 21 },
  { text: '  brent_cambio_semanal_pct .. +0.41%          → neutro   ', type: 'data', d: 20 },
  { text: '  momentum_depositos_z ...... -0.31           ← VIGILAR  ', type: 'warn', d: 125 },
  { text: '',                                                           type: 'blank', d: 32 },

  // SHAP — ritmo dramático
  { text: 'ANÁLISIS SHAP ── variables más influyentes esta semana ──', type: 'section', d: 60  },
  { text: '  spread_cdt_inflacion    z: +2.14σ  ██████████  CRÍTICO', type: 'sh_hi', d: 135 },
  { text: '  quincena_binary         z: +1.78σ  ████████    IMPULSO', type: 'sh_md', d: 118 },
  { text: '  colcap_retorno_semanal  z: +1.31σ  ███████     IMPULSO', type: 'sh_md', d: 108 },
  { text: '  trm_promedio_7d         z: -0.82σ  █████       VIGILAR', type: 'sh_lo', d: 92  },
  { text: '  momentum_depositos_z    z: -1.05σ  █████       VIGILAR', type: 'sh_lo', d: 90  },
  { text: '  banrep_tasa_pct         z: +0.41σ  ███         estable', type: 'sh_ok', d: 72  },
  { text: '  sp500_retorno_7d        z: +0.28σ  ██          estable', type: 'sh_ok', d: 66  },
  { text: '  brent_cambio_semanal    z: +0.19σ  █           estable', type: 'sh_ok', d: 60  },
  { text: '',                                                          type: 'blank', d: 48  },

  // XGBOOST — pausa, luego barra crece rápido
  { text: '  ejecutando XGBoost · n_estimators=800 · max_depth=6 ...', type: 'run', d: 560 },
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
  { text: '  PREDICCIÓN  →  semana 2026-W26                         ', type: 'res', d: 480 },
  { text: '  usuarios_primer_cashin    →    1,247  usuarios         ', type: 'num', d: 400 },
  { text: '  baseline 12 semanas            1,089  delta   +14.5%   ', type: 'sub', d: 160 },
  { text: '  confianza del modelo            92%   MAE     ±199     ', type: 'sub', d: 140 },
  { text: '  ratio walk-forward              1.51          VÁLIDO ✓ ', type: 'sub', d: 115 },
  { text: '─────────────────────────────────────────────────────────', type: 'div', d: 26  },
]

function lc(type: string) {
  const m: Record<string, string> = {
    cmd:     '#E8FF00',
    ok:      '#4ade80',
    wait:    'rgba(255,255,255,0.35)',
    info:    'rgba(255,255,255,0.42)',
    section: 'rgba(255,255,255,0.65)',
    data:    'rgba(255,255,255,0.48)',
    quote:   'rgba(255,255,255,0.6)',
    meta:    'rgba(255,255,255,0.36)',
    hi:      '#22d3ee',
    warn:    '#fbbf24',
    sh_hi:   '#f87171',
    sh_md:   '#4ade80',
    sh_lo:   '#fbbf24',
    sh_ok:   'rgba(255,255,255,0.33)',
    run:     'rgba(255,255,255,0.48)',
    bar:     '#E8FF00',
    div:     'rgba(255,255,255,0.16)',
    res:     '#ffffff',
    num:     '#E8FF00',
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
  const f = `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

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
                style={{ display: 'inline-block', width: 6, height: 13, background: '#E8FF00', verticalAlign: 'text-bottom' }}
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
          Nuestro sistema no solo cruza datos, entiende exactamente por qué y cuándo un usuario decide invertir. Al conectar el historial de comportamiento de la base con el contexto macroeconómico, el modelo aísla la causa real que detona una apertura. El resultado es inteligencia de negocio accionable: sabemos con precisión, por ejemplo, que "si la tasa del CDT supera la inflación en semana de quincena, el 12% de los usuarios con alta liquidez va a convertir de inmediato".
        </p>
      </div>

    </motion.div>
  )
}

/* ── Panel 1: Radar Estratégico + gráfico — fondo #ffffff ────────── */
function Panel1({ sp }: { sp: MotionValue<number> }) {
  const { opacity, scale, filter } = usePanel(sp, 1)
  const [drawn, setDrawn] = useState(false)
  const f = `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

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
        <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, color: navy, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 28px' }}>
          Radar Estratégico de Mercado
        </h2>
        <p style={{ fontSize: '18px', lineHeight: 1.85, color: 'rgba(18,22,34,0.62)', margin: 0 }}>
          Transformamos números estadísticos fríos en argumentos de venta irrefutables. Cada semana, el algoritmo anticipa las tendencias del mercado y extrae el contexto real detrás de los datos (ej. ¿qué mensaje oculto hay en el último anuncio del Banco de la República?). Esto nos permite adelantarnos a la competencia y hablarle al usuario con un timing perfecto, anclando la comunicación a la realidad financiera que está viviendo en ese instante.
        </p>
      </div>

      {/* RIGHT — gráfico como héroe, stat anclado abajo */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Gráfico animado — hero */}
        <svg viewBox="0 0 520 205" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[50, 100, 150, 199].map(y => (
            <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(18,22,34,0.05)" strokeWidth={1} />
          ))}
          <motion.path
            d="M 0,16 L 65,69 L 130,96 L 195,113 L 260,124 L 325,133 L 390,142 L 455,149 L 520,154 L 520,199 L 455,197 L 390,192 L 325,187 L 260,179 L 195,165 L 130,146 L 65,107 L 0,16 Z"
            fill={lime} fillOpacity="0.14"
            animate={{ opacity: drawn ? 1 : 0 }}
            transition={drawn ? { duration: 0.8, delay: 1.6 } : { duration: 0 }}
          />
          <motion.path
            d="M 0,16 L 65,107 L 130,146 L 195,165 L 260,179 L 325,187 L 390,192 L 455,197 L 520,199"
            fill="none" stroke={amber} strokeWidth={2} strokeDasharray="7,5"
            animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 0.55 : 0 }}
            transition={drawn ? { duration: 2.0, ease: 'easeOut' as const, delay: 0.5 } : { duration: 0 }}
          />
          <motion.path
            d="M 0,16 L 65,69 L 130,96 L 195,113 L 260,124 L 325,133 L 390,142 L 455,149 L 520,154"
            fill="none" stroke={navy} strokeWidth={2.5}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={drawn ? { duration: 2.2, ease: 'easeOut' as const, delay: 0.8 } : { duration: 0 }}
          />
        </svg>

        {/* Fila inferior: leyenda izquierda · stat derecha */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(18,22,34,0.07)' }}>

          {/* Leyenda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(18,22,34,0.55)', fontSize: '17px', lineHeight: 1 }}>
              <svg width="28" height="10" viewBox="0 0 28 10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke={amber} strokeWidth="2" strokeDasharray="5,3" opacity="0.7" />
              </svg>
              Sin intervención
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(18,22,34,0.55)', fontSize: '17px', lineHeight: 1 }}>
              <svg width="28" height="10" viewBox="0 0 28 10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke={navy} strokeWidth="2.5" />
              </svg>
              Con Kepler
            </span>
          </div>

          {/* Stat — caption editorial */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: navy, fontSize: 'clamp(38px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 6px' }}>
              +3.31<span style={{ fontSize: '0.45em', verticalAlign: 'super', fontWeight: 700 }}>pp</span>
            </p>
            <p style={{ color: 'rgba(18,22,34,0.5)', fontSize: '17px', margin: 0 }}>
              más conversiones semanales en primera implementación
            </p>
          </div>

        </div>

      </div>

    </motion.div>
  )
}

const NOTIFS = [
  { text: 'Asegura tu tasa fija. BanRep recortaría en Q3 — la ventana se cierra esta semana.', time: 'ahora' },
  { text: 'Llegó la quincena. Haz rendir lo que te llegó hoy con tu CDT desde $100.000.',       time: 'ahora' },
  { text: 'Tu primer CDT. Empieza a vencer la inflación — 6pp por encima del IPC.',             time: 'ahora' },
]

/* ── Panel 2: iPhone 14 Pro Max + Hiper-Personalización — fondo #2b3550 ── */
function Panel2({ sp }: { sp: MotionValue<number> }) {
  const { opacity, scale, filter } = usePanel(sp, 2)
  const [shown, setShown] = useState(false)
  const f = `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

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
            background: 'linear-gradient(165deg, #0d1a35 0%, #090e1f 100%)',
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

              {/* Notificaciones con stagger generoso */}
              {NOTIFS.map((n, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -18 }}
                  animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.55, delay: shown ? 0.6 + i * 1.4 : 0, ease: 'easeOut' }}
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
                      background: lime, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#0a0a0a' }}>L</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600 }}>Lulo Bank</span>
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', marginLeft: 'auto' }}>{n.time}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{n.text}</p>
                </motion.div>
              ))}
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
          Convertimos todo ese contexto (mercado + datos + usuario) en un motor de crecimiento que opera en piloto automático. El sistema decide dinámicamente qué gatillo psicológico usar para cada segmento: a un cliente de alto valor le inyecta urgencia ("asegura esta tasa fija antes de que el mercado baje"), mientras que a un usuario nuevo lo educa ("vence la inflación con tu primer CDT"). Todo esto se orquesta y ejecuta a escala, garantizando el mensaje correcto, al usuario correcto, en el canal exacto.
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
    ['#1b2132', '#1b2132', '#ffffff', '#ffffff', '#2b3550', '#2b3550']
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
