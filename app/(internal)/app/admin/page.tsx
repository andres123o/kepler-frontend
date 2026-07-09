'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface AgentStatus {
  user_name: string
  campaign_name: string
  nodes_updated: number
  nodes_total: number | null
  nodes_pending: number | null
  semana_label: string | null
  last_update: string | null
  sent_by: string | null
  status: 'done' | 'partial' | 'pending'
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'ahora mismo'
  if (mins < 60)  return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

function ProgressBar({ sent, total }: { sent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0
  const color = pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-neutral-700'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-neutral-400 shrink-0 w-10 text-right">
        {sent}/{total}
      </span>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [data, setData]         = useState<AgentStatus[]>([])
  const [isAdmin, setIsAdmin]   = useState<boolean | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [orgLabel, setOrgLabel] = useState<string | null>(null)
  const [funnelLabel, setFunnelLabel] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(u => {
        if (u?.role !== 'admin') {
          router.replace('/app/estrategia')
          return
        }
        setOrgLabel(u.org_name ?? u.org_slug ?? null)
        setFunnelLabel(u.funnel_name ?? u.funnel_slug ?? null)
        setIsAdmin(true)
      })
      .catch(() => router.replace('/app/estrategia'))
  }, [router])

  function loadData() {
    setLoading(true)
    setError(null)
    api.getAdminStatus()
      .then(d => { setData(d); setLastRefresh(new Date()) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  if (isAdmin === null) return null

  const done    = data.filter(d => d.status === 'done').length
  const partial = data.filter(d => d.status === 'partial').length
  const pending = data.filter(d => d.status === 'pending').length
  const total   = data.length

  // Nodos totales pendientes en todo el equipo
  const teamPending = data.reduce((acc, d) => acc + (d.nodes_pending ?? 0), 0)
  const teamTotal   = data.reduce((acc, d) => acc + (d.nodes_total ?? 0), 0)
  const teamSent    = data.reduce((acc, d) => acc + d.nodes_updated, 0)

  const semana = data[0]?.semana_label ?? null

  return (
    <div className="py-10 px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl font-bold">Panel de Equipo</h1>
            {funnelLabel && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Viendo: {orgLabel ? `${orgLabel} — ` : ''}{funnelLabel}
              </span>
            )}
          </div>
          <p className="text-neutral-500 text-sm mt-1">
            {semana ? `Semana ${semana}` : 'Estado de actualizaciones por agente — semana actual'}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-40"
        >
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {/* Resumen equipo */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white tabular-nums">{total}</p>
          <p className="text-neutral-500 text-xs mt-1">Agentes</p>
        </div>
        <div className="bg-neutral-900 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400 tabular-nums">{done}</p>
          <p className="text-neutral-500 text-xs mt-1">Completaron</p>
        </div>
        <div className="bg-neutral-900 border border-amber-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400 tabular-nums">{partial}</p>
          <p className="text-neutral-500 text-xs mt-1">En progreso</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-neutral-400 tabular-nums">{pending}</p>
          <p className="text-neutral-500 text-xs mt-1">Sin iniciar</p>
        </div>
      </div>

      {/* Progreso global del equipo */}
      {teamTotal > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-400 text-sm font-medium">Progreso del equipo</span>
            <span className="text-neutral-300 text-sm tabular-nums font-semibold">
              {teamSent} <span className="text-neutral-600 font-normal">/ {teamTotal} nodos</span>
              {teamPending > 0 && (
                <span className="text-amber-400 ml-2">· {teamPending} pendientes</span>
              )}
            </span>
          </div>
          <ProgressBar sent={teamSent} total={teamTotal} />
        </div>
      )}

      {/* Tabla */}
      {error ? (
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : loading && data.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Agente</th>
                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Campaña</th>
                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider w-48">Progreso</th>
                <th className="text-center px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Pendientes</th>
                <th className="text-left px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Última actividad</th>
                <th className="text-center px-5 py-3 text-neutral-500 font-medium text-xs uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {data.map(agent => (
                <tr key={agent.user_name} className="hover:bg-neutral-800/40 transition-colors">

                  {/* Agente */}
                  <td className="px-5 py-4">
                    <span className="text-white font-medium capitalize">{agent.user_name}</span>
                  </td>

                  {/* Campaña */}
                  <td className="px-5 py-4">
                    <span className="text-neutral-300 text-xs">{agent.campaign_name}</span>
                  </td>

                  {/* Progreso con barra */}
                  <td className="px-5 py-4 w-48">
                    {agent.nodes_total !== null ? (
                      <ProgressBar sent={agent.nodes_updated} total={agent.nodes_total} />
                    ) : agent.nodes_updated > 0 ? (
                      <span className="text-emerald-400 text-xs tabular-nums font-semibold">
                        {agent.nodes_updated} enviados
                      </span>
                    ) : (
                      <span className="text-neutral-600 text-xs">Sin estrategia cargada</span>
                    )}
                  </td>

                  {/* Pendientes */}
                  <td className="px-5 py-4 text-center">
                    {agent.nodes_pending !== null ? (
                      agent.nodes_pending === 0 ? (
                        <span className="text-emerald-400 text-xs font-semibold">0</span>
                      ) : (
                        <span className="text-amber-400 text-sm font-bold tabular-nums">{agent.nodes_pending}</span>
                      )
                    ) : (
                      <span className="text-neutral-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Última actividad */}
                  <td className="px-5 py-4">
                    <span className="text-neutral-500 text-xs">{timeAgo(agent.last_update)}</span>
                    {agent.sent_by && agent.sent_by.toLowerCase() !== agent.user_name.toLowerCase() && (
                      <span className="ml-1.5 text-[10px] text-amber-400/70">por {agent.sent_by}</span>
                    )}
                  </td>

                  {/* Estado badge */}
                  <td className="px-5 py-4 text-center">
                    {agent.status === 'done' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Listo
                      </span>
                    ) : agent.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        En progreso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-500 border border-neutral-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-neutral-700 text-xs text-right">
        Actualizado {lastRefresh.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
