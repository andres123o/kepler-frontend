// KOA — Estimación de Gap de Activación
import ContextoScroll from './ContextoScroll'
import DiagnosticoScroll from './DiagnosticoScroll'
import MobileShareButton from './MobileShareButton'
import IntervencionScroll from './IntervencionScroll'
import S2Scroll from './S2Scroll'

// Paleta real de Kepler (extraída de app/(marketing)/ — Hero.tsx, HowItWorks.tsx, Benefits.tsx)
const C = {
  cream:   '#FFFEF7',   // bg principal de la marca
  black:   '#0A0A0A',   // tarjetas/secciones oscuras
  ink:     '#171717',   // texto principal (neutral-900)
  muted:   '#525252',   // texto secundario (neutral-600)
  mutedLt: 'rgba(255,255,255,0.6)',
  border:  'rgba(0,0,0,0.08)',
  purple:  '#4A0072',
  magenta: '#C2185B',
  orange:  '#FF8C00',
  green:   '#22C55E',
  white:   '#FFFFFF',
}

const GRADIENT = `linear-gradient(115deg, ${C.purple} 0%, ${C.magenta} 50%, ${C.orange} 100%)`

const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`

const KOA_LOGO = 'https://koa.co/wp-content/uploads/2026/01/group-koa.png'

export default function KOAPage() {
  return (
    <div style={{ fontFamily: f, lineHeight: '1.6' }}>
      <style>{`
        html { scroll-snap-type: y proximity; scroll-behavior: smooth; }
        @media (max-width: 768px) {
          .kepler-mobile-block { display: flex !important; }
          .kepler-main-content { display: none !important; }
          .kepler-cta-dark button {
            background: #0A0A0A !important;
            color: #FFFEF7 !important;
          }
        }
      `}</style>

      {/* ── MOBILE BLOCK ── */}
      <div className="kepler-mobile-block" style={{
        display: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── HEADER: dos columnas ── */}
        <div style={{ display: 'flex', flexShrink: 0, height: '20vh' }}>

          {/* Col izquierda — Kepler */}
          <div style={{
            flex: 1,
            background: C.cream,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}>
            <img
              src="https://res.cloudinary.com/dmyq0gr14/image/upload/v1765342242/unnamed-removebg-preview_xa4cji.png"
              alt="Kepler"
              style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block' }}
            />
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: C.ink, fontFamily: f }}>
              Kepler
            </span>
          </div>

          {/* Col derecha — KOA */}
          <div style={{
            flex: 1,
            background: '#F5F5F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}>
            <img
              src={KOA_LOGO}
              alt="KOA"
              style={{ height: '34px', width: 'auto', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
            />
          </div>

        </div>

        {/* ── HERO: negro Kepler — texto ── */}
        <div style={{
          background: C.black,
          flex: '0 0 36vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '28px 28px',
        }}>
          <h1 style={{
            fontFamily: f,
            color: C.white,
            fontSize: 'clamp(36px, 10vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            margin: '0 0 14px',
          }}>
            Esta experiencia fue diseñada para pantalla completa.
          </h1>
          <p style={{
            fontFamily: f,
            color: 'rgba(255,255,255,0.62)',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: 1.6,
            margin: 0,
          }}>
            Ábrela en tu computador para ver el diagnóstico completo.
          </p>
        </div>

        {/* ── CTA: claro — botón oscuro ── */}
        <div style={{
          background: C.cream,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '52px 28px 28px',
          gap: '18px',
        }}>
          <div className="kepler-cta-dark" style={{ width: '100%' }}>
            <MobileShareButton />
          </div>
          <p style={{
            color: 'rgba(23,23,23,0.52)',
            fontSize: '13px',
            letterSpacing: '0em',
            margin: '8px 0 0',
            textAlign: 'left',
            lineHeight: 1.5,
          }}>
            Diagnóstico de activación · Kepler para KOA
          </p>
        </div>

      </div>

      {/* ── CONTENIDO PRINCIPAL (oculto en mobile) ── */}
      <div className="kepler-main-content">

      {/* ── HEADER ── */}
      <header style={{
        background: C.cream,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 0 0 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0' }}>
          <img
            src="https://res.cloudinary.com/dmyq0gr14/image/upload/v1765342242/unnamed-removebg-preview_xa4cji.png"
            alt="Kepler"
            width={40}
            height={40}
            style={{ objectFit: 'contain', flexShrink: 0 }}
          />
          <span style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: C.ink,
            fontFamily: f,
          }}>Kepler</span>
        </div>
        <span style={{ backgroundImage: GRADIENT, color: '#ffffff', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', padding: '0 44px', display: 'flex', alignItems: 'center', borderRadius: 0 }}>
          KOA
        </span>
      </header>

      {/* ══ S1 — HERO ══ crema Kepler — 74vh para que asome más la tarjeta oscura de la sección siguiente */}
      <section style={{
        background: C.cream,
        padding: '0 60px',
        textAlign: 'center',
        minHeight: '74vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '1060px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: f,
            fontSize: 'clamp(44px, 4.2vw, 62px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: C.ink,
            lineHeight: '1.08',
            marginBottom: '20px',
          }}>
            Van a cerrar el año con 17.925 CDTs.
            <br />La meta pública son 30.000.
          </h1>
          <p style={{
            fontFamily: f,
            fontSize: '22px',
            fontWeight: 400,
            lineHeight: '1.6',
            color: C.muted,
            maxWidth: '780px',
            margin: '0 auto 44px',
          }}>
            Con el mismo ritmo y el mismo stack, KOA no llega. Kepler activa los 108.000 clientes de libranza que nunca abrieron un CDT, optimiza comunicaciones, personaliza y ejecuta en Zoho CRM.
          </p>
          <a href="#diagnostico" style={{
            display: 'inline-block',
            background: C.black,
            color: C.white,
            padding: '15px 44px',
            borderRadius: '60px',
            fontWeight: 700,
            fontSize: '16px',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}>
            Ver el diagnóstico
          </a>
        </div>
      </section>

      {/* ══ S1b — CONTEXTO ══ panel que crece hasta 100vh en scroll */}
      <ContextoScroll />

      {/* ══ S1c — DIAGNÓSTICO EXTERNO ══ scrollytelling */}
      <DiagnosticoScroll />

      {/* ══ S_INT — INTERVENCIÓN ══ sticky scroll 2 columnas */}
      <IntervencionScroll />

      {/* ══ S2 — PARA KOA ESTA SEMANA ══ scrollytelling */}
      <S2Scroll />

      {/* ══ S6 — EL CIERRE ══ crema Kepler */}
      <section style={{ background: C.cream, padding: '100px 60px 104px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1.3, marginBottom: '24px' }}>
            Esto tiene sentido para nosotros y para KOA.
          </p>
          <p style={{ color: C.muted, fontSize: '18px', lineHeight: 1.85, marginBottom: '48px' }}>
            Con sus datos, pasamos de diagnóstico a ejecución y activamos los 108.000 clientes de libranza que nunca abrieron un CDT.
          </p>
          <a
            href="https://wa.me/573015081517"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: C.black, color: C.white, padding: '16px 52px', borderRadius: '60px', fontWeight: 800, fontSize: '16px', textDecoration: 'none', letterSpacing: '-0.01em' }}
          >
            Hablamos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ── negro, para dar cierre real a la página */}
      <div style={{ background: C.black, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* Izquierda: logo Kepler, igual que en el header (sin filtro) */}
        <img
          src="https://res.cloudinary.com/dmyq0gr14/image/upload/v1765342242/unnamed-removebg-preview_xa4cji.png"
          alt="Kepler"
          width={48}
          height={48}
          style={{ objectFit: 'contain' }}
        />

        {/* Derecha: íconos LinkedIn + WhatsApp, con el gradiente insignia para dar un toque de color sobre el negro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="https://www.linkedin.com/in/andres-felipe-cristancho-olaya-3aa762179/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundImage: GRADIENT, color: C.white, textDecoration: 'none', flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
          <a
            href="https://wa.me/573015081517"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundImage: GRADIENT, color: C.white, textDecoration: 'none', flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        </div>

      </div>

      </div>{/* fin kepler-main-content */}

    </div>
  )
}
