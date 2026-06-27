# Kepler Prospection — Lulo Bank · Estado al 26 jun 2026

## Archivos del proyecto
```
kepler-frontend/app/prospection/
  layout.tsx                    ← passthrough, sin nav
  lulo-bank/
    page.tsx                    ← página principal (Server Component)
    DiagnosticoScroll.tsx       ← scrollytelling (Client Component)
  Resultado prospection-lulo bank.md  ← datos de investigación fuente
  lulo-bank-brand               ← guía de marca
  lulo-images1.png / lulo-images2.png
  requiremtent-desing.md
```

---

## Lo que está construido (en orden narrativo)

### Header
- Logo: img Cloudinary 40px + "Kepler" Playfair Display 800
- Badge derecha: `CONFIDENCIAL · LULO BANK · 26 JUN 2026` fondo `#1b2132`, sin border-radius, pegado a la pared, misma altura que el header (alignItems stretch)

### S1 — Hero (fondo lime #E8FF00)
- Fuente: **Outfit ExtraBold 800** via `next/font/google` (sustituto Gilroy Bold de Lulo)
- Título `clamp(44px, 4.2vw, 62px)` weight 800: *"Sus CDTs tienen alcance. La activación, todavía no."*
- Subtítulo Outfit 400 22px maxWidth 780px: *"Predecimos quién va a depositar esta semana, cuándo y qué decirle. Kepler lo ejecuta automáticamente."*
- CTA pill "Ver el diagnóstico" fondo `#1b2132`

### S1b — Split screen (2 columnas sin gap)
- **Izq** `#F2F2F0`: título centrado V+H `clamp(26px,3vw,42px)` weight 700 — "La campaña superó su meta 6.4× con solo el 1% de la base"
- **Der** `#1b2132`: dos bloques con borderLeft lime
  - LANZAMIENTO: Lulo lanzó CDT 9 jun, $129.000M, 6.000 clientes, terminó 23 jun
  - AHORA: 594.000 usuarios elegibles, sin estímulo 2 días, curva cayendo

### S1c — DiagnosticoScroll (scrollytelling)
- Archivo: `DiagnosticoScroll.tsx`
- 300vh wrapper, sticky 100vh, fondo `#2b3550`
- Barra progreso lime top, counter "01/03" animado
- **3 paneles** (DATOS FIJOS — NO CAMBIAR):
  - Panel 01: v2.78.0 · 7 jun / 67% de releases / 2 patches misma semana / 5 causas PSE
  - Panel 02: 33% reviews / −1.30 estrellas / 0 reviews CDT / 4.6 iOS = 4.6 Android
  - Panel 03: 2 vacantes simultáneas / CEO La República / $99.795M · $77.377M (millones COP) / Sin sistema de activación

---

## LO QUE FALTA — Próxima sesión

### SECCIÓN PENDIENTE: "La Intervención"
**Posición:** Entre S1c (DiagnosticoScroll) y la siguiente sección de cifras  
**Propósito:** Puente de "diagnosticamos el problema" → "así lo convertimos en captación esta semana"

**Fondo:** Blanco o `#F2F2F0` — alivio visual después de las secciones oscuras

**Estructura: 3 columnas horizontales con divisores**

**Columna 1 — La ventana (timing es ahora)**
- Quincena: 28-29 jun
- BanRep 11.25%, inflación 5.84%, spread real CDT al 12%: +6.16pp
- "Este argumento no existe en ninguna comunicación activa de Lulo hoy"
- Sin intervención: liquidez de quincena se va a gastos

**Columna 2 — El mecanismo (qué hace Kepler)**
- Identifica qué usuarios de los 594K van a depositar esta semana
- Genera copy calibrado al contexto macro exacto: tasa, quincena, BanRep
- Lo ejecuta en Customer.io con grupo holdout para causalidad real

**Columna 3 — La cifra (resultado esperado)**
- +3.31pp uplift (Trii, semana 1, atribución causal — no correlación)
- 19.661 CDTs adicionales (conservador — NO redondear a 20K)
- $422.690M COP en captación incremental en 30 días (NO redondear)
- = 1-2 meses de captación orgánica comprimidos en una intervención

**Números ancla de credibilidad**: +3.31pp prominente, fuente = cliente real

---

## Decisiones de diseño establecidas
- Sin em-dashes (—) en texto visible — removidos todos
- Sin cards ni sombras — estética editorial
- Sin border-radius en elementos de contenido
- Números específicos sin redondear: 19.661 (no ~20K), $422.690M (no $423M)
- Colores: lime `#E8FF00`, navy `#121622`, light `#F2F2F0`, dark `#1b2132`, diag `#2b3550`
- Fuente principal: Outfit 800 (Gilroy Bold sustituto)

## Constantes de color en page.tsx
```ts
const C = {
  lime: '#E8FF00',
  navy: '#121622',
  white: '#FFFFFF',
  light: '#F2F2F0',
  black: '#000000',
  muted: '#667A99',
  amber: '#FF8C00',
  dd: 'rgba(255,255,255,0.09)',
  dl: 'rgba(0,0,0,0.09)'
}
```
