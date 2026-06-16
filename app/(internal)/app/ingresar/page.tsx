'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

// ─── Campos del modelo v2 ─────────────────────────────────────────────────────

const AUTO_FIELDS = new Set([
  'trm',
  'sp500_cambio_semanal_pct',
  'brent_cambio_semanal_pct',
  'colcap_cambio_semanal_pct',
  'spread_tes_banrep',
  'trends_cdt',
  'trends_acciones',
  'pct_dias_quincena',
])

const GROUPS = [
  {
    id: 'funnel',
    title: 'Funnel KYC',
    description: 'Métricas de conversión internas de Trii',
    fields: [
      { key: 'step_09_full_account',   label: 'Full account (step 9)' },
      { key: 'tasa_basic_a_risk',      label: 'Tasa basic → risk (%)' },
      { key: 'tasa_risk_a_fulldata',   label: 'Tasa risk → full data (%)' },
      { key: 'tasa_fulldata_a_video',  label: 'Tasa full data → video (%)' },
      { key: 'tasa_video_a_review',    label: 'Tasa video → review (%)' },
      { key: 'pct_perfil_conservador', label: '% perfil conservador' },
      { key: 'pct_perfil_arriesgado',  label: '% perfil arriesgado' },
      { key: 'full_users_aprobados',   label: 'Full users aprobados' },
    ],
  },
  {
    id: 'macro-auto',
    title: 'Macro — automático',
    description: 'Se obtienen automáticamente con el botón de abajo según la fecha de la semana',
    autoFetch: true,
    fields: [
      { key: 'trm',                       label: 'TRM (COP/USD)' },
      { key: 'colcap_cambio_semanal_pct', label: 'COLCAP variación semanal (%)' },
      { key: 'sp500_cambio_semanal_pct',  label: 'S&P 500 variación semanal (%)' },
      { key: 'brent_cambio_semanal_pct',  label: 'Brent variación semanal (%)' },
      { key: 'spread_tes_banrep',         label: 'Spread TES 10Y − BanRep (%)' },
      { key: 'trends_cdt',                label: 'Google Trends — CDT' },
      { key: 'trends_acciones',           label: 'Google Trends — bolsa de valores' },
      { key: 'pct_dias_quincena',         label: '% días quincena' },
    ],
  },
  {
    id: 'resultado',
    title: 'Resultado real',
    description: 'Completar cuando se conozca el valor real de esta semana',
    fields: [
      { key: 'usuarios_primer_cashin', label: 'Primer cash-in real' },
    ],
  },
  {
    id: 'metadata',
    title: 'Metadata',
    description: 'Para semanas atípicas o con intervención externa',
    fields: [
      { key: 'es_exogeno', label: 'Semana exógena (0 = normal · 1 = excluir del modelo)' },
    ],
  },
]

type FormValues = Record<string, string>
type AutoStatus = Record<string, 'ok' | 'error' | 'pending' | 'idle'>
type PageState = 'loading' | 'has_data' | 'empty'

export default function IngresarPage() {
  const router = useRouter()
  const [pageState, setPageState]   = useState<PageState>('loading')
  const [semanaActual, setSemanaActual] = useState('')
  const [semana, setSemana]         = useState('')
  const [form, setForm]             = useState<FormValues>({})
  const [archiving, setArchiving]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [autoFetching, setAutoFetching] = useState(false)
  const [autoStatus, setAutoStatus] = useState<AutoStatus>({})
  const [autoErrors, setAutoErrors] = useState<string[]>([])
  const [banrepTasa, setBanrepTasa] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    api.getUltimaSemana()
      .then(data => {
        const s = (data.semana as string) ?? ''
        if (s) {
          setSemanaActual(s)
          setSemana(s)
          const vals: FormValues = {}
          for (const [k, v] of Object.entries(data)) {
            if (k !== 'semana' && k !== 'id') vals[k] = v != null ? String(v) : ''
          }
          setForm(vals)
          setPageState('has_data')
        } else {
          setPageState('empty')
        }
      })
      .catch(() => setPageState('empty'))
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleNuevaProyeccion() {
    const ok = confirm(
      `¿Archivar la semana ${semanaActual} en master_consolidado_final y abrir la semana nueva?`
    )
    if (!ok) return
    setArchiving(true)
    setMsg(null)
    try {
      const res = await api.nuevaProyeccion()
      localStorage.setItem('kepler-projection-reset', '1')
      setSemanaActual('')
      setSemana('')
      setForm({})
      setAutoStatus({})
      setBanrepTasa('')
      setPageState('empty')
      setMsg({ type: 'ok', text: `Semana ${res.semana_archivada} archivada. Ingresá los datos de la semana nueva.` })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error al archivar' })
    } finally {
      setArchiving(false)
    }
  }

  async function handleAutoFetch() {
    if (!semana.trim()) {
      setMsg({ type: 'err', text: 'Ingresá la semana primero (DD/MM/YYYY)' })
      return
    }
    setAutoFetching(true)
    setAutoStatus({})
    setAutoErrors([])
    setMsg({ type: 'ok', text: 'Obteniendo datos macro... los Google Trends pueden tardar hasta 60 s.' })
    try {
      const banrep = banrepTasa.trim() ? parseFloat(banrepTasa.trim()) : null
      const result = await api.fetchAutoVariables(semana.trim(), banrep)

      // Pre-llenar campos con valores obtenidos
      setForm(prev => {
        const next = { ...prev }
        for (const [field, value] of Object.entries(result.values)) {
          if (value !== null && value !== undefined) {
            next[field] = String(value)
          }
        }
        return next
      })

      setAutoStatus(result.status as AutoStatus)
      setAutoErrors(result.errors)

      const nOk  = Object.values(result.status).filter(s => s === 'ok').length
      const nErr = Object.values(result.status).filter(s => s === 'error').length

      if (nErr === 0) {
        setMsg({ type: 'ok', text: `${nOk} variables obtenidas correctamente.` })
      } else {
        setMsg({
          type: 'err',
          text: `${nOk} ok · ${nErr} no disponibles (podés ingresarlas manualmente).`,
        })
      }
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error al obtener datos automáticos' })
    } finally {
      setAutoFetching(false)
    }
  }

  async function buildPayload() {
    if (!semana.trim()) {
      setMsg({ type: 'err', text: 'La semana es obligatoria (DD/MM/YYYY)' })
      return null
    }
    const payload: Record<string, unknown> = { semana: semana.trim() }
    for (const [k, v] of Object.entries(form)) {
      if (v !== '') payload[k] = Number(v)
    }
    return payload
  }

  async function handleSave() {
    const payload = await buildPayload()
    if (!payload) return
    setSaving(true)
    setMsg(null)
    try {
      await api.saveUltimaSemana(payload)
      setMsg({ type: 'ok', text: 'Datos guardados correctamente.' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndPredict() {
    const payload = await buildPayload()
    if (!payload) return
    setPredicting(true)
    setMsg(null)
    try {
      await api.saveUltimaSemana(payload)
      await api.predict()
      router.push('/app/predecir')
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error al proyectar' })
      setPredicting(false)
    }
  }

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-neutral-500 animate-pulse">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Datos de la semana</h1>
          <p className="text-neutral-400 text-sm mt-1">
            {pageState === 'has_data'
              ? `Semana actual en sistema: ${semanaActual}`
              : 'No hay datos para la semana actual — ingresá los datos nuevos'}
          </p>
        </div>

        {pageState === 'has_data' && (
          <button
            onClick={handleNuevaProyeccion}
            disabled={archiving}
            className="shrink-0 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
          >
            {archiving ? (
              <span className="animate-pulse">Archivando...</span>
            ) : (
              <>
                <span>↗</span>
                Nueva proyección
              </>
            )}
          </button>
        )}
      </div>

      {pageState === 'has_data' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-300 text-sm">
            <strong>¿Es domingo?</strong> Hacé click en &quot;Nueva proyección&quot; para archivar la semana{' '}
            <strong>{semanaActual}</strong> e ingresar los datos de la semana nueva.
          </p>
        </div>
      )}

      {/* Semana */}
      <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Semana
        </label>
        <input
          value={semana}
          onChange={e => setSemana(e.target.value)}
          placeholder="04/05/2026"
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm w-52 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-neutral-500 text-xs mt-2">Formato DD/MM/YYYY — fecha de inicio (lunes) de la semana</p>
      </div>

      {/* Field groups */}
      <div className="space-y-5">
        {GROUPS.map(group => (
          <section key={group.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {group.title}
              </h2>

              {/* Input BanRep + botón auto-fetch solo en el grupo macro-auto */}
              {group.autoFetch && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] text-neutral-500 leading-none">
                      Tasa BanRep (%) <span className="text-amber-500/70">para spread</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ej. 10.25"
                      value={banrepTasa}
                      onChange={e => setBanrepTasa(e.target.value)}
                      className="w-24 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    onClick={handleAutoFetch}
                    disabled={autoFetching || !semana.trim()}
                    className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/30 text-amber-300 font-medium rounded-lg px-3 py-1.5 text-xs transition-colors self-end"
                  >
                    {autoFetching ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        Obteniendo...
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        Obtener datos automáticos
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {group.description && (
              <p className="text-neutral-500 text-xs mb-3">{group.description}</p>
            )}

            {autoFetching && group.autoFetch && (
              <p className="text-amber-400/70 text-xs mb-3 animate-pulse">
                Fetching yfinance + Google Trends... puede tardar hasta 60 s (pausa anti-rate-limit incluida)
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">
              {group.fields.map(f => {
                const fieldStatus = autoStatus[f.key]
                const isAuto = AUTO_FIELDS.has(f.key)
                const wasAutoFilled = isAuto && fieldStatus === 'ok'
                const hadError = isAuto && fieldStatus === 'error'

                return (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                      {f.label}
                      {wasAutoFilled && (
                        <span className="text-emerald-400 text-[10px] font-medium">⚡ auto</span>
                      )}
                      {hadError && (
                        <span className="text-red-400 text-[10px] font-medium">✗ manual</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                      className={[
                        'w-full bg-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 transition-colors',
                        wasAutoFilled
                          ? 'border border-emerald-500/40 focus:ring-emerald-500'
                          : hadError
                            ? 'border border-red-500/40 focus:ring-red-500'
                            : 'border border-neutral-700 focus:ring-amber-500',
                      ].join(' ')}
                    />
                  </div>
                )
              })}
            </div>

            {/* Errores de auto-fetch en el grupo macro-auto */}
            {group.autoFetch && autoErrors.length > 0 && !autoFetching && (
              <ul className="mt-3 space-y-1">
                {autoErrors.map((e, i) => (
                  <li key={i} className="text-red-400/70 text-xs">
                    ✗ {e}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSaveAndPredict}
          disabled={saving || predicting}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
        >
          {predicting ? 'Guardando y proyectando...' : 'Guardar y proyectar →'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || predicting}
          className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
        >
          {saving ? 'Guardando...' : 'Solo guardar'}
        </button>
        {msg && (
          <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {msg.text}
          </p>
        )}
      </div>

      {predicting && (
        <p className="text-neutral-500 text-xs mt-3 animate-pulse">
          Corriendo pipeline ML + SHAP... puede tardar ~30 segundos
        </p>
      )}
    </div>
  )
}
