'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, FunnelStep, CampaignSummary, CampaignNode, MetricsWeeklyJson } from '@/lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

type SeriesKey = keyof MetricsWeeklyJson['series']

function pct(val: number, digits = 1) {
  return `${(val * 100).toFixed(digits)}%`
}

function num(val: number) {
  return val.toLocaleString('es-CO')
}

function getWeeklySeries(json: MetricsWeeklyJson | null | undefined, key: SeriesKey): number[] {
  if (!json?.series) return []
  const raw = (json.series[key] as number[]) ?? []
  let last = raw.length - 1
  while (last > 0 && raw[last] === 0) last--
  return raw.slice(0, last + 1)
}

function sumSeries(json: MetricsWeeklyJson | null | undefined, key: SeriesKey): number {
  return getWeeklySeries(json, key).reduce((a, b) => a + b, 0)
}

function calcWoW(json: MetricsWeeklyJson | null | undefined, key: SeriesKey): number | null {
  const series = getWeeklySeries(json, key)
  if (series.length < 2) return null
  const current = series[series.length - 1]
  const prev = series[series.length - 2]
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function calcCTOR(json: MetricsWeeklyJson | null | undefined): number | null {
  const clicked = sumSeries(json, 'clicked')
  const opened = sumSeries(json, 'human_opened')
  if (opened === 0) return null
  return (clicked / opened) * 100
}

function calcUndeliverableRate(undeliverable: number, totalSent: number): number {
  if (totalSent === 0) return 0
  return undeliverable / totalSent
}

type TrendDir = 'up' | 'down' | 'flat'

function detectTrend(json: MetricsWeeklyJson | null | undefined, key: SeriesKey = 'human_opened'): TrendDir {
  const series = getWeeklySeries(json, key)
  if (series.length < 3) return 'flat'
  const last3 = series.slice(-3)
  if (last3[1] >= last3[0] && last3[2] >= last3[1]) return 'up'
  if (last3[1] <= last3[0] && last3[2] <= last3[1]) return 'down'
  return 'flat'
}

interface Alert { level: 'warning' | 'critical'; text: string }

function detectAlerts(c: CampaignSummary): Alert[] {
  const alerts: Alert[] = []
  const undelivRate = calcUndeliverableRate(c.undeliverable, c.total_sent)
  const ctor = calcCTOR(c.metrics_weekly_json)
  const trend = detectTrend(c.metrics_weekly_json)
  const wow = calcWoW(c.metrics_weekly_json, 'delivered')

  if (c.spike_alert)
    alerts.push({ level: 'critical', text: 'Spike de tráfico — volumen inusualmente alto' })
  if (c.total_sent > 100 && c.delivery_rate < 0.70)
    alerts.push({ level: 'critical', text: `Delivery ${pct(c.delivery_rate)} — lista con problemas graves` })
  else if (c.total_sent > 100 && c.delivery_rate < 0.82)
    alerts.push({ level: 'warning', text: `Delivery ${pct(c.delivery_rate)} — bajo el benchmark 82%` })
  if (undelivRate > 0.20)
    alerts.push({ level: 'critical', text: `${pct(undelivRate)} no entregados — limpiar lista urgente` })
  else if (undelivRate > 0.12)
    alerts.push({ level: 'warning', text: `${pct(undelivRate)} no entregados` })
  if (c.delivered > 50 && c.open_rate < 0.15)
    alerts.push({ level: 'critical', text: 'Apertura muy baja — subject o sender con problemas' })
  else if (c.delivered > 50 && c.open_rate < 0.25)
    alerts.push({ level: 'warning', text: 'Apertura por debajo del benchmark 25%' })
  if (ctor !== null && ctor < 10 && c.human_opened > 30)
    alerts.push({ level: 'warning', text: `CTOR ${ctor.toFixed(1)}% — copy o CTA con bajo engagement` })
  if (trend === 'down')
    alerts.push({ level: 'warning', text: 'Tendencia a la baja 3 semanas seguidas — posible fatiga' })
  if (wow !== null && wow < -20)
    alerts.push({ level: 'critical', text: `Caída ${Math.abs(wow).toFixed(0)}% en entregas esta semana` })
  if (c.status === 'paused' || c.status === 'stopped')
    alerts.push({ level: 'warning', text: `Campaña en estado "${c.status}"` })

  return alerts
}

function timeAgo(isoStr: string | null | undefined): string {
  if (!isoStr) return 'nunca'
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

// ── SparkLine ─────────────────────────────────────────────────────────────────

function SparkLine({ json, metricKey = 'human_opened' }: {
  json: MetricsWeeklyJson | null | undefined
  metricKey?: SeriesKey
}) {
  const series = getWeeklySeries(json, metricKey)
  const trend = detectTrend(json, metricKey)
  const lineColor = trend === 'up' ? '#4ade80' : trend === 'down' ? '#f87171' : '#737373'

  if (series.length < 2) {
    return <div className="w-20 h-8 flex items-center text-neutral-700 text-[10px]">sin datos</div>
  }

  const W = 80, H = 32, PAD = 3
  const max = Math.max(...series, 1)
  const min = Math.min(...series)
  const range = max - min || 1

  const points = series.map((v, i) => {
    const x = PAD + (i / (series.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg width={W} height={H}>
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {series.map((v, i) => {
        const x = PAD + (i / (series.length - 1)) * (W - PAD * 2)
        const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={2} fill={lineColor} />
      })}
    </svg>
  )
}

// ── Node list ─────────────────────────────────────────────────────────────────

function NodeList({ nodes }: { nodes?: CampaignNode[] }) {
  if (!nodes || nodes.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {nodes.map((n, i) => {
        const isEmail = n.type === 'email_action'
        return (
          <span
            key={n.id ?? i}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
              isEmail
                ? 'bg-sky-500/8 border-sky-500/20 text-sky-400'
                : 'bg-purple-500/8 border-purple-500/20 text-purple-400'
            }`}
          >
            <span>{isEmail ? '✉' : '⚡'}</span>
            <span className="max-w-[120px] truncate">{n.name || (isEmail ? 'Email' : 'Push')}</span>
          </span>
        )
      })}
    </div>
  )
}

// ── Metric cell ───────────────────────────────────────────────────────────────

function Metric({ label, value, sub, color = 'neutral' }: {
  label: string; value: string; sub?: string
  color?: 'neutral' | 'green' | 'yellow' | 'red'
}) {
  const c = { neutral: 'text-white', green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400' }[color]
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-neutral-500 uppercase tracking-wide mb-0.5">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${c}`}>{value}</span>
      {sub && <span className="text-[10px] text-neutral-600 leading-tight mt-0.5">{sub}</span>}
    </div>
  )
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ c }: { c: CampaignSummary }) {
  const alerts = detectAlerts(c)
  const ctor = calcCTOR(c.metrics_weekly_json)
  const undelivRate = calcUndeliverableRate(c.undeliverable, c.total_sent)
  const wow = calcWoW(c.metrics_weekly_json, 'delivered')
  const wowOpen = calcWoW(c.metrics_weekly_json, 'human_opened')
  const trend = detectTrend(c.metrics_weekly_json)

  const hasCritical = alerts.some(a => a.level === 'critical')
  const hasWarning  = alerts.some(a => a.level === 'warning')
  const borderColor = hasCritical ? 'border-red-500/30' : hasWarning ? 'border-yellow-500/20' : 'border-neutral-800'

  const statusColor = c.status === 'running'
    ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : c.status === 'paused'
    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : 'bg-neutral-700/30 text-neutral-500 border-neutral-700'

  return (
    <div className={`bg-neutral-900 rounded-xl border ${borderColor} p-5 flex flex-col gap-4`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-semibold leading-snug">{c.name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusColor}`}>
              {c.status ?? 'desconocido'}
            </span>
            {c.funnel_step_name && (
              <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-500/8 border-amber-500/20 text-amber-400">
                {c.funnel_step_name}
              </span>
            )}
            {c.goal_event && (
              <span className="text-[10px] text-neutral-600 truncate">goal: {c.goal_event}</span>
            )}
          </div>
        </div>
        {c.spike_alert && (
          <span className="text-[10px] px-2 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/20 shrink-0">
            SPIKE
          </span>
        )}
      </div>

      {/* Nodos del journey */}
      {c.node_list && c.node_list.length > 0 && (
        <div>
          <p className="text-[10px] text-neutral-600 uppercase tracking-wide mb-1.5">Mensajes del journey</p>
          <NodeList nodes={c.node_list} />
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-5 gap-3">
        <Metric
          label="Delivery"
          value={pct(c.delivery_rate)}
          color={c.delivery_rate >= 0.82 ? 'green' : c.delivery_rate >= 0.70 ? 'yellow' : 'red'}
          sub={`${num(c.delivered)} entregados`}
        />
        <Metric
          label="Apertura"
          value={pct(c.open_rate)}
          color={c.open_rate >= 0.25 ? 'green' : c.open_rate >= 0.15 ? 'yellow' : 'red'}
          sub="humana (sin bots)"
        />
        <Metric
          label="CTOR"
          value={ctor !== null ? `${ctor.toFixed(1)}%` : '—'}
          color={ctor === null ? 'neutral' : ctor >= 15 ? 'green' : ctor >= 8 ? 'yellow' : 'red'}
          sub="clicks / abiertos"
        />
        <Metric
          label="Conversión"
          value={pct(c.conversion_rate)}
          color={c.conversion_rate >= 0.05 ? 'green' : c.conversion_rate >= 0.02 ? 'yellow' : 'red'}
          sub={`${num(c.converted)} conv.`}
        />
        <Metric
          label="No entregados"
          value={pct(undelivRate)}
          color={undelivRate <= 0.08 ? 'green' : undelivRate <= 0.15 ? 'yellow' : 'red'}
          sub={`${num(c.undeliverable)} rebotes`}
        />
      </div>

      {/* Tendencia + sparkline */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            {wow !== null && (
              <span className={`text-xs font-medium ${wow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {wow >= 0 ? '↑' : '↓'} {Math.abs(wow).toFixed(1)}% entregas
              </span>
            )}
            {wowOpen !== null && (
              <span className={`text-xs ${wowOpen >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                {wowOpen >= 0 ? '↑' : '↓'} {Math.abs(wowOpen).toFixed(1)}% aperturas
              </span>
            )}
            {trend === 'down' && <span className="text-xs text-orange-400">tendencia ↘</span>}
            {trend === 'up'   && <span className="text-xs text-green-400/70">tendencia ↗</span>}
          </div>
          <p className="text-[10px] text-neutral-600">
            {num(c.total_sent)} enviados · {num(c.human_opened)} aperturas humanas · {num(c.clicked)} clicks
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-neutral-600">aperturas 4 semanas</span>
          <SparkLine json={c.metrics_weekly_json} metricKey="human_opened" />
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-3 border-t border-neutral-800">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
              a.level === 'critical'
                ? 'bg-red-500/8 border border-red-500/20 text-red-300'
                : 'bg-yellow-500/8 border border-yellow-500/20 text-yellow-300'
            }`}>
              <span className="shrink-0 mt-px">{a.level === 'critical' ? '●' : '○'}</span>
              {a.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [syncing, setSyncing]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [lastSync, setLastSync]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const steps: FunnelStep[] = await api.getFunnelHealth()
      // Flatten all campaigns across all steps — no step grouping
      const all = steps.flatMap(s => s.campaigns)
      setCampaigns(all)
      const times = all.map(c => c.last_synced_at).filter(Boolean)
      if (times.length > 0) setLastSync(times[0] ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar campañas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      await api.syncCampaigns()
      setLoading(true)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar con CIO')
    } finally {
      setSyncing(false)
    }
  }

  const totalAlerts = campaigns.reduce(
    (acc, c) => {
      const a = detectAlerts(c)
      return {
        critical: acc.critical + a.filter(x => x.level === 'critical').length,
        warning:  acc.warning  + a.filter(x => x.level === 'warning').length,
      }
    },
    { critical: 0, warning: 0 }
  )

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Campañas</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {lastSync ? `Sincronizado ${timeAgo(lastSync)}` : 'Diagnóstico de campañas Customer.io'}
            {totalAlerts.critical > 0 && (
              <span className="ml-2 text-red-400">
                · {totalAlerts.critical} alerta{totalAlerts.critical !== 1 ? 's' : ''} crítica{totalAlerts.critical !== 1 ? 's' : ''}
              </span>
            )}
            {totalAlerts.warning > 0 && (
              <span className="ml-1 text-yellow-400">
                · {totalAlerts.warning} aviso{totalAlerts.warning !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 rounded-lg transition-colors disabled:opacity-40 shrink-0"
        >
          {syncing ? (
            <>
              <span className="w-3.5 h-3.5 border border-neutral-400 border-t-transparent rounded-full animate-spin" />
              Sincronizando…
            </>
          ) : '↻ Sincronizar CIO'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Benchmarks */}
      {!loading && campaigns.length > 0 && (
        <div className="flex items-center gap-5 text-[11px] text-neutral-600 border border-neutral-800 rounded-lg px-4 py-2.5 bg-neutral-900/50">
          <span className="text-neutral-700 font-medium shrink-0">Benchmarks:</span>
          <span><span className="text-green-400">●</span> Delivery ≥82%</span>
          <span><span className="text-green-400">●</span> Apertura ≥25%</span>
          <span><span className="text-green-400">●</span> CTOR ≥15%</span>
          <span><span className="text-green-400">●</span> Conversión ≥5%</span>
          <span><span className="text-green-400">●</span> No entregados ≤8%</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 text-sm">
          Sin campañas. Sincroniza primero con CIO para cargar los datos.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {campaigns.map(c => <CampaignCard key={c.cio_campaign_id} c={c} />)}
        </div>
      )}
    </div>
  )
}
