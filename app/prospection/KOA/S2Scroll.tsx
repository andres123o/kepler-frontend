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
  { text: '$ kepler predict --target cdt_cross_sell --base libranza --semana 2026-W28', type: 'cmd',   d: 55 },
  { text: '',                                                           type: 'blank', d: 32 },
  { text: '  [init]  conectando base libranza · 117.000 registros ... OK', type: 'ok',  d: 26 },
  { text: '  [init]  segmento sin CDT identificado · 108.000 ....... OK', type: 'ok',  d: 24 },
  { text: '  [init]  modelo v3 · 24 features · XGBoost 1.7 .......... OK', type: 'ok',  d: 22 },
  { text: '  [init]  pipeline de features · validando ............... OK', type: 'ok',  d: 20 },
  { text: '  [init]  encoder categórico · 6 columnas ................ OK', type: 'ok',  d: 18 },
  { text: '  [init]  scaler StandardScaler · ajustado ................ OK', type: 'ok',  d: 18 },
  { text: '',                                                           type: 'blank', d: 32 },

  // PERPLEXITY — pausa larga, luego rápido
  { text: '  [fetch] Perplexity sonar-pro · iniciando búsqueda ......  ', type: 'wait', d: 620 },
  { text: '  [fetch] › "tasa BanRep decisión monetaria julio 2026" ....  ', type: 'wait', d: 220 },
  { text: '  [fetch] › "inflación Colombia junio 2026 DANE" ..........  ', type: 'wait', d: 200 },
  { text: '  [fetch] › "quincena Colombia liquidez empleados públicos"   ', type: 'wait', d: 210 },
  { text: '  [fetch] › "CDT tasas fintech Colombia julio 2026" ........  ', type: 'wait', d: 190 },
  { text: '  [fetch] › "COLCAP rendimiento semanal acciones" ..........  ', type: 'wait', d: 180 },
  { text: '  [fetch] Perplexity sonar-pro · 14 fuentes .............. OK', type: 'ok',  d: 50  },
  { text: '',                                                            type: 'blank', d: 32  },

  // CONTEXTO — ritmo medio
  { text: 'CONTEXTO DE MERCADO ─────────────────────────────────────',   type: 'section', d: 60  },
  { text: '  › "BanRep 11.25%, sin recorte; mercado espera Q3 2026"',  type: 'quote',   d: 175 },
  { text: '  › "Spread CDT real sobre inflación: cerca de máximos"',    type: 'quote',   d: 165 },
  { text: '  › "Quincena 15-jul activa, liquidez de nómina alta"',     type: 'quote',   d: 160 },
  { text: '  › "COLCAP +0.98% semanal, apetito de riesgo estable"',     type: 'quote',   d: 155 },
  { text: '  fuentes verificadas: 14  ·  confianza del contexto: 91%', type: 'meta',    d: 60  },
  { text: '',                                                            type: 'blank',   d: 32  },

  // VARIABLES — burst rápido
  { text: 'VARIABLES DE ACTIVACIÓN ──────────────────────────────────',  type: 'section', d: 60 },
  { text: '  banrep_tasa_pct ........... 11.25%          → estable  ', type: 'data', d: 22 },
  { text: '  inflacion_anual_pct ....... 5.80%           → estable  ', type: 'data', d: 21 },
  { text: '  spread_cdt_inflacion_pp ... +6.02 pp        ← ACTIVA  ',  type: 'hi',   d: 145 },
  { text: '  ciclo_quincena_binary ..... activo (15-jul) ← ACTIVA  ',  type: 'hi',   d: 138 },
  { text: '  antiguedad_libranza_meses . 38 promedio     → alta     ', type: 'data', d: 23 },
  { text: '  colcap_retorno_semanal .... +0.98%          ↑ positivo ', type: 'data', d: 21 },
  { text: '  saldo_libranza_activo ..... alto            ← ACTIVA  ',  type: 'hi',   d: 125 },
  { text: '',                                                           type: 'blank', d: 32 },

  // SHAP — ritmo dramático
  { text: 'ANÁLISIS SHAP ── variables más influyentes esta semana ──', type: 'section', d: 60  },
  { text: '  spread_cdt_inflacion    z: +2.02σ  ██████████  CRÍTICO', type: 'sh_hi', d: 135 },
  { text: '  quincena_binary         z: +1.65σ  ████████    IMPULSO', type: 'sh_md', d: 118 },
  { text: '  antiguedad_libranza     z: +1.22σ  ███████     IMPULSO', type: 'sh_md', d: 108 },
  { text: '  colcap_retorno_semanal  z: +0.36σ  ████        estable', type: 'sh_ok', d: 92  },
  { text: '  banrep_tasa_pct         z: +0.28σ  ███         estable', type: 'sh_ok', d: 72  },
  { text: '',                                                          type: 'blank', d: 48  },

  // XGBOOST — pausa, luego barra crece rápido
  { text: '  ejecutando XGBoost · n_estimators=600 · max_depth=5 ...', type: 'run', d: 560 },
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
  { text: '  PREDICCIÓN  →  semana 2026-W28                         ', type: 'res', d: 480 },
  { text: '  clientes_libranza_listos_cdt  →   812  clientes         ', type: 'num', d: 400 },
  { text: '  baseline 12 semanas               620  delta   +31.0%   ', type: 'sub', d: 160 },
  { text: '  confianza del modelo               89%   MAE     ±140   ', type: 'sub', d: 140 },
  { text: '  ratio walk-forward                1.40          VÁLIDO ✓ ', type: 'sub', d: 115 },
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

/* ── Panel 0: Motor Predictivo — fondo #0A0A0A ───────────────────── */
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
          <style>{`#kterm-koa::-webkit-scrollbar{display:none}`}</style>
          <div id="kterm-koa" ref={scrollRef} style={{ padding: '18px 16px 18px 40px', flex: 1, overflowY: 'auto', overflowX: 'hidden', fontFamily: MONO, fontSize: 11.5, lineHeight: 1.75, scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
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
          Nuestro sistema no solo cruza datos, entiende exactamente las tendencias de conversión que hacen que los usuarios depositen o abran un CDT. Al conectar el comportamiento histórico de la base con el contexto macroeconómico, el modelo aísla la causa real que detona la conversión. El resultado es inteligencia de negocio accionable: sabemos con precisión, por ejemplo, que un cliente en plena quincena, con el spread CDT sobre inflación en máximos, tiene 3 veces más probabilidad de depositar esta semana.
        </p>
      </div>

    </motion.div>
  )
}

/* ── Panel 1: Radar Estratégico + gráfico — fondo #FFFEF7 ────────── */
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
          Transformamos números estadísticos fríos en argumentos de venta irrefutables. Cada semana, el algoritmo anticipa las tendencias del mercado y extrae el contexto real detrás de los datos (ej. ¿qué mensaje oculto hay en el último anuncio del Banco de la República?). Esto nos permite adelantarnos a la competencia y hablarle al cliente con un timing perfecto, anclando la comunicación a la realidad financiera que está viviendo en ese instante.
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

/* Los dos canales reales del stack de KOA (WhatsApp de soporte + email vía
   Zoho CRM/ZeptoMail) — no notificaciones push genéricas de una app que
   KOA no tiene. */
type WhatsAppMsg = { type: 'whatsapp'; app: string; sender: string; text: string; time: string }
type EmailMsg    = { type: 'email'; app: string; subject: string; preheader: string; time: string }

/* Notificación de email real: solo asunto (bold) + preheader (preview) —
   sin remitente ni destinatario, así se ve de verdad en el sistema. */
const MESSAGES: Array<WhatsAppMsg | EmailMsg> = [
  { type: 'whatsapp', app: 'WhatsApp', sender: 'KOA', text: 'Tu plata, tú mandas: ya llegó tu quincena. Abre tu CDT Digital en menos de 8 minutos y asegura tu tasa fija.', time: 'ahora' },
  { type: 'email', app: 'Mail', subject: 'Tu tasa fija se cierra pronto', preheader: 'Vence la inflación con tu primer CDT desde $250.000, ábrelo en minutos desde tu celular.', time: 'ahora' },
]

function AppIcon({ type }: { type: 'whatsapp' | 'email' }) {
  if (type === 'whatsapp') {
    return (
      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
    )
  }
  return (
    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #4dabff, #0a66d6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 6 10 7L22 6" />
      </svg>
    </div>
  )
}

/* ── Panel 2: iPhone 14 Pro Max + Hiper-Personalización — fondo #0A0A0A ── */
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
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '15px', margin: 0, letterSpacing: '0.01em' }}>Miércoles, 15 de julio</p>
              </div>

              {/* Mensajes con stagger generoso — WhatsApp + Mail, los canales reales de KOA */}
              {MESSAGES.map((m, i) => (
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
                    <AppIcon type={m.type} />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600 }}>{m.app}</span>
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', marginLeft: 'auto' }}>{m.time}</span>
                  </div>
                  {m.type === 'whatsapp' ? (
                    <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                      <span style={{ fontWeight: 700 }}>{m.sender}: </span>{m.text}
                    </p>
                  ) : (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 700, lineHeight: 1.4, margin: '0 0 2px' }}>
                        {m.subject}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12.5px', lineHeight: 1.45, margin: 0 }}>
                        {m.preheader}
                      </p>
                    </>
                  )}
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
          Convertimos todo ese contexto (mercado + datos + cliente) en un motor de crecimiento que opera en piloto automático. El sistema decide dinámicamente qué gatillo psicológico usar para cada segmento: a un cliente de libranza con alta antigüedad le devuelve control ("tu plata, tú mandas: abre tu CDT en 8 minutos"), mientras que a un cliente nuevo sin CDT lo educa ("vence la inflación con tu primer CDT"). Todo esto se orquesta y ejecuta a escala, y lo mejor: sin implementaciones nuevas ni migración, todo desde su Zoho CRM actual, garantizando el mensaje correcto, al cliente correcto, en el canal exacto.
        </p>
      </div>

    </motion.div>
  )
}

/* ── Export ──────────────────────────────────────────────────────── */
export default function S2Scroll() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: sp } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  /* Motor Predictivo abre con el mismo morado de cierre de "Escalar el CDT
     sin una función de growth" (DiagnosticoScroll) para continuidad,
     luego claro, luego oscuro. */
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
