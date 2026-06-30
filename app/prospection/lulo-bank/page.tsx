// Lulo Bank — Estimación de Gap de Activación
import { Outfit } from 'next/font/google'
import DiagnosticoScroll from './DiagnosticoScroll'
import MobileShareButton from './MobileShareButton'
import IntervencionScroll from './IntervencionScroll'
import S2Scroll from './S2Scroll'
const gilroy = Outfit({ weight: ['400', '800'], subsets: ['latin'] })

const C = {
  lime:  '#E8FF00',
  navy:  '#121622',
  white: '#FFFFFF',
  light: '#F2F2F0',
  black: '#000000',
  muted: '#667A99',
  amber: '#FF8C00',
  dd:    'rgba(255,255,255,0.09)',
  dl:    'rgba(0,0,0,0.09)',
}

const f = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif`


export default function LuloBankPage() {
  return (
    <div style={{ fontFamily: f, lineHeight: '1.6' }}>
      <style>{`
        html { scroll-snap-type: y proximity; scroll-behavior: smooth; }
        @media (max-width: 768px) {
          .kepler-mobile-block { display: flex !important; }
          .kepler-main-content { display: none !important; }
          .kepler-cta-dark button {
            background: #1b2132 !important;
            color: #f4f4f4 !important;
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

          {/* Col izquierda — claro: Kepler */}
          <div style={{
            flex: 1,
            background: '#f4f4f4',
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
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1b2132', fontFamily: '"Georgia", serif' }}>
              Kepler
            </span>
          </div>

          {/* Col derecha — oscuro: Lulo */}
          <div style={{
            flex: 1,
            background: '#1b2132',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="https://www.lulobank.com/images/logo-footer.svg"
              alt="Lulo Bank"
              style={{ height: '40px', width: 'auto', maxWidth: '120px', objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }}
            />
          </div>

        </div>

        {/* ── HERO: amarillo — texto ── */}
        <div style={{
          background: '#e8ff00',
          flex: '0 0 36vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '28px 28px',
        }}>
          <h1 style={{
            fontFamily: gilroy.style.fontFamily,
            color: '#1b2132',
            fontSize: 'clamp(36px, 10vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            margin: '0 0 14px',
          }}>
            Esta experiencia fue diseñada para pantalla completa.
          </h1>
          <p style={{
            fontFamily: gilroy.style.fontFamily,
            color: '#1b2132',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: 1.6,
            margin: 0,
            opacity: 0.65,
          }}>
            Ábrela en tu computador para ver el diagnóstico completo.
          </p>
        </div>

        {/* ── CTA: claro — botón oscuro ── */}
        <div style={{
          background: '#f4f4f4',
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
            color: 'rgba(27,33,50,0.52)',
            fontSize: '13px',
            letterSpacing: '0em',
            margin: '8px 0 0',
            textAlign: 'left',
            lineHeight: 1.5,
          }}>
            Diagnóstico de activación · Kepler para Lulo Bank
          </p>
        </div>

      </div>

      {/* ── CONTENIDO PRINCIPAL (oculto en mobile) ── */}
      <div className="kepler-main-content">

      {/* ── HEADER ── */}
      <header style={{
        background: C.white,
        borderBottom: `1px solid ${C.dl}`,
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
            color: C.black,
            fontFamily: '"Playfair Display", "Georgia", serif',
          }}>Kepler</span>
        </div>
        <span style={{ background: '#1b2132', color: '#ffffff', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', padding: '0 44px', display: 'flex', alignItems: 'center', borderRadius: 0 }}>
          Lulo Bank
        </span>
      </header>

      {/* ══ S1 — HERO ══ LIME */}
      <section style={{ background: C.lime, padding: '72px 60px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: gilroy.style.fontFamily,
            fontSize: 'clamp(44px, 4.2vw, 62px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#121622',
            lineHeight: '1.08',
            marginBottom: '20px',
          }}>
            Sus CDTs tienen alcance.<br />La activación, todavía no.
          </h1>
          <p style={{
            fontFamily: gilroy.style.fontFamily,
            fontSize: '22px',
            fontWeight: 400,
            lineHeight: '1.6',
            color: '#121622',
            opacity: 0.65,
            maxWidth: '780px',
            margin: '0 auto 44px',
          }}>
            La tasa al 13% terminó. Kepler activa los 594.000 usuarios restantes, analiza las tendencias, calibra el argumento y ejecuta en SendGrid.
          </p>
          <a href="#diagnostico" style={{
            display: 'inline-block',
            background: '#1b2132',
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

      {/* ══ S1b — CONTEXTO ══ split screen */}
      <section id="diagnostico" style={{ display: 'flex', flexWrap: 'wrap' }}>

        <div style={{
          flex: '1 1 50%',
          background: C.light,
          padding: '80px 72px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}>
          <p style={{
            fontSize: 'clamp(26px, 3vw, 42px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: C.navy,
            lineHeight: 1.3,
            margin: '0 0 16px',
          }}>
            La campaña superó la meta 6.4x con solo el 1% de base.
          </p>
        </div>

        <div style={{
          flex: '1 1 50%',
          background: '#1b2132',
          padding: '72px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          <div style={{ borderLeft: '2px solid rgba(255,255,255,0.12)', paddingLeft: '24px', marginBottom: '36px' }}>
            <p style={{ fontSize: '17px', lineHeight: '1.85', color: 'rgba(255,255,255,0.5)', fontWeight: 400, margin: 0 }}>
              Lulo lanzó su CDT el 9 de junio. En 15 días captó{' '}
              <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>$129.000M COP y 6.000 clientes.</span>{' '}
              La campaña al 13% terminó el 23 de junio.
            </p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '36px' }} />
          <div style={{ borderLeft: '2px solid rgba(232,255,0,0.5)', paddingLeft: '24px' }}>
            <p style={{ fontSize: '17px', lineHeight: '1.85', color: '#ffffff', fontWeight: 400, margin: 0 }}>
              Quedan <span style={{ fontWeight: 700 }}>594.000 usuarios elegibles.</span>{' '}
              Sin Kepler, no hay estímulo que lea el momento de mercado ni el del usuario. La curva de activación cae.
            </p>
          </div>
        </div>

      </section>

      {/* ══ S1c — DIAGNÓSTICO EXTERNO ══ scrollytelling */}
      <DiagnosticoScroll />

      {/* ══ S_INT — INTERVENCIÓN ══ sticky scroll 2 columnas */}
      <IntervencionScroll />

      {/* ══ S2 — PARA LULO ESTA SEMANA ══ scrollytelling */}
      <S2Scroll />

      {/* ══ S6 — EL CIERRE ══ LIME */}
      <section style={{ background: C.lime, padding: '100px 60px 104px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.black, lineHeight: 1.3, marginBottom: '24px' }}>
            Esto tiene sentido para nosotros y para Lulo.
          </p>
          <p style={{ color: C.black, fontSize: '18px', lineHeight: 1.85, marginBottom: '48px', opacity: 0.62 }}>
            Todo desde fuentes abiertas, sin acceder a un solo dato interno de Lulo. Con sus datos, pasamos de diagnóstico a ejecución y activamos los 594.000 restantes.
          </p>
          <a
            href="https://wa.me/573015081517"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: C.navy, color: C.white, padding: '16px 52px', borderRadius: '60px', fontWeight: 800, fontSize: '16px', textDecoration: 'none', letterSpacing: '-0.01em' }}
          >
            Hablamos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div style={{ background: C.white, borderTop: `1px solid ${C.dl}`, padding: '16px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

        {/* Izquierda: solo logo Kepler */}
        <img
          src="https://res.cloudinary.com/dmyq0gr14/image/upload/v1765342242/unnamed-removebg-preview_xa4cji.png"
          alt="Kepler"
          width={48}
          height={48}
          style={{ objectFit: 'contain', opacity: 0.5 }}
        />

        {/* Derecha: íconos LinkedIn + WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="https://www.linkedin.com/in/andres-felipe-cristancho-olaya-3aa762179/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: C.navy, color: C.white, textDecoration: 'none', flexShrink: 0 }}
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', background: C.navy, color: C.white, textDecoration: 'none', flexShrink: 0 }}
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
