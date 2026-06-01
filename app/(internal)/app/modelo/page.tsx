'use client'
import { useEffect, useState } from 'react'
import { api, TrainingStatus } from '@/lib/api'

export default function ModeloPage() {
  const [status, setStatus]   = useState<TrainingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [trainMsg, setTrainMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    api.trainingStatus()
      .then(setStatus)
      .catch(() => setError('No se pudo cargar el estado del modelo'))
      .finally(() => setLoading(false))
  }, [])

  async function handleTrain() {
    const ok = confirm(
      'El entrenamiento descarga el historial de Supabase y corre 60 trials de Optuna.\n\nPuede tardar 10–15 minutos. ¿Continuar?'
    )
    if (!ok) return
    setTraining(true)
    setTrainMsg(null)
    try {
      const r = await api.train()
      const v   = r.version as number
      const mae = r.mae_walk_forward as number
      setTrainMsg({ type: 'ok', text: `v${v} · MAE walk-forward: ${mae?.toFixed(2)}` })
      const newStatus = await api.trainingStatus()
      setStatus(newStatus)
    } catch (err) {
      setTrainMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error en entrenamiento' })
    } finally {
      setTraining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <p className="text-neutral-500 text-sm">Cargando estado del modelo...</p>
        </div>
      </div>
    )
  }

  const healthy = status?.has_model && status.overfitting_flag === 'ok'
  const warning = status?.has_model && status.overfitting_flag && status.overfitting_flag !== 'ok'

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-white">Estado del modelo</h1>
        <p className="text-neutral-500 text-sm mt-0.5">XGBoost + Optuna · predicción de primeros depósitos</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── Sin modelo ── */}
      {status && !status.has_model && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-5 py-4">
          <p className="text-amber-400 font-medium text-sm mb-1">Sin modelo entrenado</p>
          <p className="text-amber-400/70 text-xs">{status.message ?? 'Ejecuta el primer entrenamiento para activar las predicciones.'}</p>
        </div>
      )}

      {/* ── Hero card ── */}
      {status?.has_model && (
        <div className={`rounded-2xl border p-5 flex items-start justify-between gap-6 ${
          healthy  ? 'bg-emerald-500/5 border-emerald-500/20'
          : warning ? 'bg-amber-500/5 border-amber-500/20'
          : 'bg-neutral-900 border-neutral-800'
        }`}>
          {/* Left: status + MAE hero */}
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
              healthy ? 'bg-emerald-500/15' : warning ? 'bg-amber-500/15' : 'bg-neutral-800'
            }`}>
              {healthy ? '✅' : warning ? '⚠️' : '🤖'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  healthy  ? 'bg-emerald-500/15 text-emerald-400'
                  : warning ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {healthy ? 'Listo' : warning ? 'Revisar' : 'Activo'}
                </span>
                <span className="text-neutral-600 text-xs">versión {status.version}</span>
              </div>
              <p className="text-neutral-300 text-sm">
                {healthy
                  ? 'Modelo en buenas condiciones. Sin señales de overfitting.'
                  : warning
                  ? `Overfitting flag: ${status.overfitting_flag}. Considera reentrenar.`
                  : 'Modelo activo en producción.'}
              </p>
            </div>
          </div>

          {/* Right: MAE OOS hero number */}
          <div className="text-right shrink-0">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">MAE walk-forward</p>
            <p className="text-4xl font-bold tabular-nums text-white">
              {status.mae_walk_forward?.toFixed(2) ?? '—'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">depósitos · error promedio OOS</p>
          </div>
        </div>
      )}

      {/* ── Métricas secundarias ── */}
      {status?.has_model && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="R² entrenamiento"
            value={status.r2_train?.toFixed(4) ?? '—'}
            sub="Ajuste sobre datos de train"
          />
          <MetricCard
            label="MAE entrenamiento"
            value={status.mae_train?.toFixed(2) ?? '—'}
            sub="Error en datos de train"
          />
          <MetricCard
            label="Ratio WF / Train"
            value={status.ratio_wf_train?.toFixed(2) ?? '—'}
            sub="Overfitting check"
            accent={status.overfitting_flag === 'ok' ? 'green' : 'amber'}
            badge={status.overfitting_flag ?? undefined}
          />
          <MetricCard
            label="Dataset"
            value={`${status.n_samples ?? '—'}`}
            sub={`filas · ${status.n_features ?? '—'} features`}
          />
        </div>
      )}

      {/* ── Reentrenar ── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-white font-semibold mb-1">Reentrenar modelo</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Descarga <code className="text-amber-400 text-xs bg-amber-500/10 px-1 py-0.5 rounded">master_consolidado_final</code> de
              Supabase y reentrena XGBoost con 60 trials de Optuna. Correr los domingos cuando haya datos nuevos.
            </p>

            {training && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin shrink-0" />
                <p className="text-amber-400/70 text-xs">Proceso corriendo · no cierres esta ventana · puede tardar 10–15 min</p>
              </div>
            )}

            {trainMsg && (
              <div className={`mt-3 flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                trainMsg.type === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <span>{trainMsg.type === 'ok' ? '✓' : '✗'}</span>
                <span>{trainMsg.text}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <button
              disabled
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-neutral-800 text-neutral-600 cursor-not-allowed"
            >
              Iniciar entrenamiento
            </button>
            <p className="text-[10px] text-neutral-600 mt-1.5">Solo desde entorno local</p>
          </div>
        </div>
      </div>

    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  badge,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'green' | 'amber'
  badge?: string
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-neutral-500 text-[10px] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p className={`text-2xl font-bold tabular-nums leading-none ${
          accent === 'green' ? 'text-emerald-400'
          : accent === 'amber' ? 'text-amber-400'
          : 'text-white'
        }`}>
          {value}
        </p>
        {badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-0.5 ${
            accent === 'green' ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-amber-500/15 text-amber-400'
          }`}>
            {badge}
          </span>
        )}
      </div>
      {sub && <p className="text-neutral-600 text-xs mt-1.5">{sub}</p>}
    </div>
  )
}
