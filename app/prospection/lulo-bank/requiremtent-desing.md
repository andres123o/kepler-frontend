# Kepler Prospection — Psicología y Persuasión
## Lineamientos para convertir datos en decisiones
**Aplicado a: Landing `/kepler-prospection/lulo`**
**Versión 1.0 — Stateless Labs — Junio 2026**

---

## El principio rector

> El decisor no lee. Escanea. Y toma decisiones antes de terminar de leer.

Kahneman lo llama **Sistema 1**: el cerebro procesa en modo rápido, emocional, heurístico. El Sistema 2 (lento, lógico) se activa solo cuando el Sistema 1 ya fue enganchado. La landing tiene que hablarle primero al Sistema 1 — con datos que golpeen — y solo después darle al Sistema 2 la lógica para justificar la decisión que el Sistema 1 ya tomó.

**Implicación directa:** Los números van primero. El contexto va después. La metodología va al final. Nunca al revés.

---

## LOS 7 PRINCIPIOS PSICOLÓGICOS APLICADOS A LA LANDING

---

### PRINCIPIO 1 — LOSS AVERSION (Aversión a la pérdida)
**Base científica:** Kahneman & Tversky, 1979. Las pérdidas se sienten 2x más intensamente que ganancias equivalentes.

**Regla de aplicación:**
No framear como "puedes ganar X". Framear como "estás perdiendo X cada día que pasa sin actuar."

**Aplicación en landing Lulo:**

❌ Versión gain framing (débil):
> "Con intervención predictiva puedes captar $422B adicionales."

✅ Versión loss framing (2x más fuerte):
> "Cada día sin intervención, ~660 usuarios elegibles salen de la ventana de activación óptima.
> La campaña al 13% terminó el 23 de junio.
> La curva de activación está cayendo ahora mismo."

**Dónde va:** Hero section. Primera pantalla. Antes de cualquier explicación del sistema.

**Mecanismo:** El CEO de Lulo está en el año de break-even. Framing de pérdida activa el dolor directamente sobre su presión real. No es abstracto — es su objetivo de 2026 en riesgo.

---

### PRINCIPIO 2 — ANCHORING (Efecto de anclaje)
**Base científica:** Tversky & Kahneman, 1974. El primer número que ve una persona ancla todas las estimaciones posteriores.

**Regla de aplicación:**
El número más grande va primero. Siempre. El número pequeño después se ve razonable comparado con el ancla.

**Aplicación en landing Lulo:**

Secuencia correcta de números en la página:

```
1er número visible:   $638.000M COP     ← ancla alta (escenario optimista)
2do número visible:   $422.000M COP     ← rango conservador (ya se ve "razonable")
3er número visible:   19.661 CDTs        ← volumen (da tangibilidad al dinero)
4to número visible:   594.000 usuarios   ← magnitud del problema
5to número visible:   +3.31pp            ← el uplift (parece pequeño pero moves billions)
```

**Por qué funciona:** Cuando el CEO ve $638B primero, el $422B conservador se siente alcanzable. Si vieras $422B primero sin ancla, se siente ambicioso. El orden de los números cambia la percepción del riesgo.

**Dónde va:** La sección del número grande tiene que ser la segunda pantalla — después del hook pero antes de cualquier explicación.

---

### PRINCIPIO 3 — PROGRESSIVE DISCLOSURE (Divulgación progresiva)
**Base científica:** UX cognitive load theory. El cerebro abandona cuando se siente abrumado.

**Regla de aplicación:**
Cada sección responde UNA pregunta. La respuesta genera la siguiente pregunta. El usuario avanza porque quiere la respuesta, no porque se la estamos dando.

**Secuencia de preguntas que la landing hace implícitamente:**

```
Sección 1 → ¿Qué está pasando en Lulo ahora mismo?
            (datos del CDT, fin de campaña, usuarios elegibles)

Sección 2 → ¿Qué tan grande es el problema?
            (gap de activación cuantificado)

Sección 3 → ¿Cómo lo saben?
            (3 hallazgos del diagnóstico externo — señal de credibilidad)

Sección 4 → ¿Qué hace el sistema exactamente?
            (4 pasos: predice → diagnostica → prescribe → mide)

Sección 5 → ¿Funciona en la realidad?
            (resultado de Trii — prueba en producción)

Sección 6 → ¿Qué hago ahora?
            (contacto directo — sin formulario)
```

Cada sección es una pantalla. El scroll es la acción. El usuario que llega a la Sección 6 ya tomó la decisión — solo necesita el canal para actuar.

---

### PRINCIPIO 4 — SPECIFICITY EFFECT (Efecto de especificidad)
**Base científica:** Estudios de credibilidad cognitiva. Los números específicos son más creíbles que los redondos. "19.661 CDTs" es más creíble que "~20.000 CDTs".

**Regla de aplicación:**
Nunca redondear los números del diagnóstico. La especificidad comunica que el análisis fue real, no estimado a ojo.

**Aplicación en landing Lulo:**

❌ Número redondo (baja credibilidad):
> "Estimamos ~20.000 CDTs adicionales"

✅ Número específico (alta credibilidad):
> "19.661 CDTs adicionales en el escenario conservador"
> "29.700 CDTs en el escenario con uplift de +5pp"

**Otros números específicos que van sin redondear:**
- `+3.31pp` (no "más de 3 puntos")
- `594.000 usuarios` (no "casi 600K")
- `$422.690M COP` (no "$422B")
- `p < 0.01` (no "estadísticamente significativo")
- `60% de releases` (no "la mayoría de releases")

**Dónde va:** En todos los números del diagnóstico. Sin excepción.

---

### PRINCIPIO 5 — SOCIAL PROOF + AUTHORITY (Prueba social y autoridad)
**Base científica:** Cialdini, 2021. Las personas siguen el comportamiento de quienes perciben como similares o superiores.

**Regla de aplicación:**
Para un CEO de fintech, la prueba social más poderosa no es "1000 clientes felices" — es una fintech comparable que ya lo implementó y tiene resultados medibles con metodología verificable.

**Aplicación en landing Lulo:**

El caso de Trii es la prueba social. Pero hay que framearlo correctamente:

❌ Framing débil:
> "Probamos el sistema en otra fintech y funcionó."

✅ Framing de autoridad técnica:
> "Producción desde abril 2026. Fintech colombiana de inversión.
> Metodología: holdout group en BigQuery — causalidad, no correlación.
> Semana 1: +3.31pp. p < 0.01.
> 7 semanas acumuladas: 1.514 depósitos adicionales atribuidos."

El `p < 0.01` y el "holdout group en BigQuery" son señales de autoridad técnica. Un CEO con perfil de analítica avanzada (Giraldo) reconoce esa metodología y le da más peso que cualquier testimonial.

**Dónde va:** Sección 5. Después de explicar el sistema, antes del cierre.

---

### PRINCIPIO 6 — RECIPROCITY (Reciprocidad)
**Base científica:** Cialdini. Cuando recibes algo de valor sin pedirlo, sientes obligación de devolver.

**Regla de aplicación:**
La landing en sí misma es el regalo. Llegaron con trabajo ya hecho — análisis que Lulo no tiene internamente. Eso activa reciprocidad antes de que haya conversación.

**Aplicación en landing Lulo:**

El diagnóstico externo completo (3 capas, 10 hallazgos, estimación cuantitativa) es el regalo. No cobrado. No condicionado. Entregado de primero.

Por eso la landing no empieza con "quiénes somos" ni con un formulario de captura. Empieza entregando valor. El CTA al final no pide — propone continuar una conversación que ellos ya quieren tener.

**Copy del cierre que activa reciprocidad:**
> "Construimos este diagnóstico sin acceso a tus datos internos.
> Con acceso, podemos ser exactos.
> ¿Hablamos?"

---

### PRINCIPIO 7 — SCARCITY + TIMING (Escasez y timing)
**Base científica:** La escasez percibida aumenta el valor percibido y acelera la decisión.

**Regla de aplicación:**
No crear escasez artificial ("¡oferta por tiempo limitado!"). Usar la escasez real — que existe y es verificable.

**La escasez real en el caso de Lulo:**

```
ESCASEZ DE TIEMPO:
La quincena de fin de junio (28-29) llega en 4 días.
El primer mes post-campaña es el de mayor abandono.
Cada semana sin intervención, la curva de activación decae.

ESCASEZ DE VENTANA:
El contexto macro (BanRep 11.25%) no va a durar.
Los analistas anticipan recortes en H2 2026.
El argumento "asegura la tasa fija antes del recorte" tiene una vida útil de semanas.

ESCASEZ DE ATENCIÓN:
Este análisis existe para Lulo Bank hoy.
No es un pitch genérico enviado a 50 fintechs.
```

**Dónde va:** En el hero section, como contexto temporal. No como urgencia artificial sino como realidad del mercado.

---

## REGLAS DE DISEÑO DE DATOS — Cómo presentar números para máximo impacto

---

### REGLA D1 — Un número por pantalla
El número más importante de cada sección ocupa el 40-60% del espacio visual. El resto es contexto. El ojo va al número primero — siempre.

**Jerarquía visual:**
```
TAMAÑO MÁXIMO:    $638.000M COP         ← el número ancla
TAMAÑO GRANDE:    594.000 usuarios      ← la magnitud del problema
TAMAÑO MEDIANO:   +3.31pp confirmado    ← el proof point
TAMAÑO NORMAL:    p < 0.01, semana 1    ← el contexto técnico
```

---

### REGLA D2 — Contraste cromático para los números negativos vs positivos
Los números que representan pérdida o problema van en color de alerta (rojo o ámbar).
Los números que representan oportunidad o resultado van en color de acción (verde o blanco brillante).

```
ROJO/ÁMBAR → 594.000 usuarios sin CDT activo
             60% de releases con fricción
             Campaña terminó: 0 estímulos activos hoy

VERDE/BLANCO → +3.31pp uplift
              $422B-$638B captación adicional
              p < 0.01 semana 1
```

El contraste visual comunica el problema antes de que el cerebro lea el texto.

---

### REGLA D3 — Fuente de cada dato visible
Cada número tiene su fuente en texto pequeño debajo. No para que la lean — para que sepan que existe.

```
$129.000M en CDTs durante campaña
[Fuente: La República, 22 jun 2026]

60% de releases tocaron fricción de funnel
[Fuente: Changelog iOS App Store, abr-jun 2026]

+3.31pp uplift en tasa de primer depósito
[Fuente: Holdout group BigQuery, Trii CO, sem. 1 abr 2026, p<0.01]
```

El CEO que desconfía puede verificar. El CEO que confía se siente respaldado. En ambos casos, la fuente aumenta credibilidad.

---

### REGLA D4 — El dato más incómodo va en el centro
El hallazgo que más los incomoda — que usan SendGrid raw sin orquestación inteligente — va en posición central de la sección de diagnóstico. No al final (donde se ignora) ni al principio (donde se defienden antes de ver el resto).

El momento de incomodidad productiva tiene que ocurrir cuando ya absorbieron el contexto del problema. Si lo ven antes de entender el problema, se ponen defensivos. Si lo ven en el centro, después de ver el gap, la incomodidad se convierte en reconocimiento.

---

### REGLA D5 — El número del gap va con unidad de negocio, no solo con unidad técnica
Los 19.661 CDTs adicionales son un número técnico. Lo que lo hace accionable es traducirlo a la unidad de negocio del CEO.

```
NO SOLO:   19.661 CDTs adicionales

SINO:      19.661 CDTs adicionales
           = $422.000M COP en captación incremental
           = ~42% del saldo total actual de Lulo
           = lo equivalente a 2 meses de crecimiento orgánico
             comprimidos en 30 días de intervención
```

Cada número técnico tiene su traducción al lenguaje de negocio. Ambos visibles. El técnico primero, la traducción debajo.

---

### REGLA D6 — Visualización de la curva post-campaña
El concepto más importante no es un número — es la forma de la curva de activación post-campaña.

```
Visualización sugerida: gráfico de línea simple

Eje Y: tasa de activación semanal (%)
Eje X: semanas desde lanzamiento CDT

Curva A (sin intervención):  pico semana 1-2 → caída pronunciada → meseta baja
Curva B (con intervención):  pico semana 1-2 → sostenimiento → segunda ola quincena

Área entre curvas = el gap económico
```

Esta visualización no necesita datos reales de Lulo. Se construye con el benchmark de Trii como referencia. La forma de la curva comunica el problema mejor que cualquier texto.

---

## ARQUITECTURA DE COPY — Fórmulas por sección

---

### SECCIÓN 1 — HERO: Fórmula "Contexto + Problema + Tiempo"
```
[Hecho reciente que ellos conocen]
[Consecuencia que aún no visualizaron]
[El tiempo que ya está corriendo]
```

Copy aplicado:
```
Lulo lanzó su CDT el 9 de junio.
En 15 días captó $129.000M y 6.000 clientes.
La campaña al 13% terminó el 23 de junio.

Quedan 594.000 usuarios elegibles.
Sin estímulo activo desde ayer.
La curva de activación ya está cayendo.

¿Cuánto vale recuperarla?
```

---

### SECCIÓN 2 — EL NÚMERO: Fórmula "Ancla + Rango + Traducción"
```
[Número ancla grande]
[Rango conservador-optimista]
[Traducción a unidad de negocio del CEO]
```

---

### SECCIÓN 3 — DIAGNÓSTICO: Fórmula "Hallazgo + Fuente + Implicación"
```
[Dato específico del diagnóstico externo]
[Fuente pública verificable]
[Lo que significa para el funnel de activación]
```

Tres cards. Cada una con esta estructura. Máximo 3 líneas por card.

---

### SECCIÓN 4 — SISTEMA: Fórmula "Verbo + Objeto + Resultado"
```
PREDICE → qué usuarios van a activar esta semana
DIAGNOSTICA → qué variable de mercado domina hoy
PRESCRIBE → qué decirles exactamente y cuándo
MIDE → holdout group, causalidad real
```

---

### SECCIÓN 5 — PRUEBA: Fórmula "Número + Metodología + Verificabilidad"
```
+3.31pp en tasa de primer depósito
Holdout group en BigQuery — causalidad, no correlación
p < 0.01 — Semana 1 — Fintech colombiana de inversión en producción
```

---

### SECCIÓN 6 — CIERRE: Fórmula "Pregunta + Reconocimiento + Canal"
```
[La pregunta que el diagnóstico deja abierta]
[Reconocimiento de que la respuesta requiere datos internos]
[Contacto directo — persona, no formulario]
```

Copy aplicado:
```
¿Este número es verdadero para Lulo?

Construimos este diagnóstico sin acceso a sus datos internos.
Con acceso, podemos ser exactos.

→ Andrés Felipe Olaya · [email] · [LinkedIn]
```

---

## LO QUE NUNCA VA EN LA LANDING

| ❌ Qué evitar | Por qué |
|---|---|
| "Somos expertos en..." | Activa escepticismo. El trabajo habla, no la declaración. |
| "Nuestra misión es..." | Irrelevante para el CEO en el año de break-even. |
| Formulario de captura | Friction. El CEO no llena formularios. Contacto directo. |
| "Agenda una demo" | Convierte en pipeline frío. Queremos conversación caliente. |
| Precio visible | Ancla la conversación en costo antes de establecer valor. |
| Más de 1 CTA | Dispersa la atención. Un solo próximo paso visible. |
| Navbar con múltiples opciones | Las páginas de conversión no tienen navbar. Solo scroll. |
| Párrafos de más de 3 líneas | El CEO escanea. Párrafos largos = abandono. |
| Números redondeados | Baja credibilidad. Siempre específicos. |
| "Creemos que..." / "Estimamos que..." | Lenguaje de duda. Los datos hablan con certeza acotada. |

---

## CHECKLIST FINAL ANTES DE PUBLICAR

**Psicología:**
- [ ] ¿El primer número visible activa loss aversion?
- [ ] ¿El número ancla es el más grande y va primero?
- [ ] ¿Cada sección responde exactamente una pregunta?
- [ ] ¿El dato más incómodo está en posición central?
- [ ] ¿La escasez de timing está presente sin ser artificial?

**Datos:**
- [ ] ¿Todos los números son específicos (sin redondear)?
- [ ] ¿Cada número tiene fuente visible?
- [ ] ¿Los números negativos van en color de alerta?
- [ ] ¿Los números positivos van en color de oportunidad?
- [ ] ¿El gap está traducido a unidad de negocio del CEO?

**Copy:**
- [ ] ¿El hero tiene menos de 60 palabras?
- [ ] ¿No hay párrafos de más de 3 líneas?
- [ ] ¿El CTA es contacto directo (no formulario)?
- [ ] ¿La palabra "nosotros" aparece menos de 3 veces en toda la página?
- [ ] ¿La página puede leerse completa en menos de 90 segundos?

**Diseño:**
- [ ] ¿Un solo número dominante por sección?
- [ ] ¿Hay visualización de la curva post-campaña?
- [ ] ¿No hay navbar?
- [ ] ¿Mobile-first? (54% del tráfico B2B es mobile en 2026)
- [ ] ¿Carga en menos de 2 segundos?

---

*Kepler Prospection v1.0 — Psicología y Persuasión*
*Stateless Labs — Junio 2026 — Confidencial*