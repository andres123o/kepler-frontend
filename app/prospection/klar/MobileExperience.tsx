// Experiencia mobile — Klar. Archivo independiente: no importa ni reutiliza
// código de page.tsx/*.Scroll.tsx para no crear ningún acoplamiento con desktop.
// Las secciones de scrollytelling (Contexto/Diagnóstico/Intervención/S2) usan
// exactamente la misma mecánica de animación que sus pares de desktop (sticky +
// scroll progress), solo con el layout interno reflujado a una columna.
'use client'
import { motion } from 'framer-motion'
import MobileContextoScroll from './MobileContextoScroll'
import MobileDiagnosticoScroll from './MobileDiagnosticoScroll'
import MobileIntervencionScroll from './MobileIntervencionScroll'
import MobileS2Scroll from './MobileS2Scroll'

const C = {
  cream:   '#FFFEF7',
  black:   '#0A0A0A',
  ink:     '#171717',
  muted:   '#525252',
  purple:  '#4A0072',
  magenta: '#C2185B',
  orange:  '#FF8C00',
  white:   '#FFFFFF',
}

const GRADIENT = `linear-gradient(115deg, ${C.purple} 0%, ${C.magenta} 50%, ${C.orange} 100%)`
const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

/* ── Reveal: fade+slide al entrar en viewport (para secciones estáticas, sin scroll-jacking) ── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

export default function MobileExperience() {
  return (
    <div style={{ fontFamily: f, lineHeight: 1.6, background: C.cream }}>

      {/* ── HEADER estático (igual que desktop: solo se ve al principio, no sticky) ── */}
      <header style={{
        background: C.cream, borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 0 0 20px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
          <img src="https://res.cloudinary.com/dmyq0gr14/image/upload/v1765342242/unnamed-removebg-preview_xa4cji.png" alt="Kepler" width={28} height={28} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: C.ink }}>Kepler</span>
        </div>
        <span style={{ backgroundImage: GRADIENT, color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
          Klar
        </span>
      </header>

      {/* ── HERO — título/texto más grandes, más alto para que Contexto asome menos (mismo efecto que desktop) ── */}
      <section style={{ background: C.cream, padding: '0 24px', textAlign: 'center', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Reveal>
          <h1 style={{ fontSize: 'clamp(36px, 10.5vw, 46px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1.12, margin: '0 0 18px' }}>
            Señales reales que frenan la experiencia de sus usuarios.
          </h1>
          <p style={{ fontSize: '18px', lineHeight: 1.65, color: C.muted, margin: '0 0 28px' }}>
            Cruzamos reviews públicas, contexto de mercado y benchmark competitivo para encontrar patrones reales sobre dónde parece perderse valor y qué oportunidades valen la pena priorizar.
          </p>
          <a href="#diagnostico-m" style={{ display: 'inline-block', background: C.black, color: C.white, padding: '14px 36px', borderRadius: '60px', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
            Ver el diagnóstico
          </a>
        </Reveal>
      </section>

      {/* ══ CONTEXTO — misma mecánica sticky de desktop ══ */}
      <MobileContextoScroll />

      {/* ══ DIAGNÓSTICO — mismo crossfade pinned de desktop ══ */}
      <MobileDiagnosticoScroll />

      {/* ══ INTERVENCIÓN — mismo scroll-driven panel switch de desktop ══ */}
      <MobileIntervencionScroll />

      {/* ══ S2 — terminal + radar + hiper-personalización, mismas animaciones de desktop ══ */}
      <MobileS2Scroll />

      {/* ── CIERRE — estático en desktop, se mantiene igual aquí ── */}
      <section style={{ background: C.cream, padding: '56px 24px', textAlign: 'center' }}>
        <Reveal>
          <p style={{ fontSize: 'clamp(22px, 6vw, 26px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1.3, margin: '0 0 18px' }}>
            Esto tiene sentido para nosotros y para Klar.
          </p>
          <p style={{ color: C.muted, fontSize: '15px', lineHeight: 1.8, margin: '0 0 32px' }}>
            Todo desde fuentes abiertas, sin acceder a un solo dato interno de Klar. Con sus datos, pasamos de diagnóstico a ejecución directa en Customer.io.
          </p>
          <a
            href="https://wa.me/573015081517"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: C.black, color: C.white, padding: '15px 40px', borderRadius: '60px', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}
          >
            Hablamos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </Reveal>
      </section>

      {/* ── FOOTER — igual que desktop: logo a la izquierda, iconos a la derecha ── */}
      <div style={{ background: C.black, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <img src="https://res.cloudinary.com/dmyq0gr14/image/upload/v1765342242/unnamed-removebg-preview_xa4cji.png" alt="Kepler" width={36} height={36} style={{ objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="https://www.linkedin.com/in/andres-felipe-cristancho-olaya-3aa762179/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundImage: GRADIENT, color: C.white, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a href="https://wa.me/573015081517" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundImage: GRADIENT, color: C.white, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>

    </div>
  )
}
