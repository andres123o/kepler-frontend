'use client'

import { useEffect, useRef, useState } from 'react'
import { api, type KnowledgeBaseEntry, type TrackedCampaign } from '@/lib/api'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-white font-semibold text-lg">{title}</h2>
      <p className="text-neutral-500 text-sm mt-0.5">{description}</p>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs text-neutral-500 font-medium uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  )
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-3 py-3 text-xs border-t border-neutral-800/60 align-top ${mono ? 'font-mono text-neutral-300' : 'text-neutral-400'}`}>
      {children}
    </td>
  )
}

function ErrorBanner({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
      <span className="flex-1">{msg}</span>
      <button onClick={onDismiss} className="text-red-400/60 hover:text-red-400 transition-colors shrink-0">✕</button>
    </div>
  )
}

function SuccessBanner({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-400">
      <span className="flex-1">✓ {msg}</span>
      <button onClick={onDismiss} className="text-emerald-400/60 hover:text-emerald-400 transition-colors shrink-0">✕</button>
    </div>
  )
}

// ─── Campañas monitoreadas ────────────────────────────────────────────────────

function CampaignRow({
  c,
  onDelete,
}: {
  c: TrackedCampaign
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await api.deleteTrackedCampaign(c.cio_campaign_id)
      onDelete(c.cio_campaign_id)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const synced = c.last_synced_at !== null && c.total_sent > 0
  const crCls = c.conversion_rate >= 0.07 ? 'text-emerald-400' : c.conversion_rate >= 0.02 ? 'text-amber-400' : c.total_sent > 50 ? 'text-red-400' : 'text-neutral-600'
  const lastSync = c.last_synced_at
    ? new Date(c.last_synced_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <tr className="hover:bg-neutral-800/30 transition-colors group">
      <Td mono>{c.cio_campaign_id}</Td>
      <Td>
        <span className="max-w-[200px] truncate block" title={c.name}>
          {c.name === 'Pendiente de sync'
            ? <span className="text-neutral-600 italic">{c.name}</span>
            : c.name}
        </span>
      </Td>
      <Td>
        {c.status ? (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            c.status === 'running' ? 'bg-emerald-500/12 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
          }`}>
            {c.status}
          </span>
        ) : <span className="text-neutral-700">—</span>}
      </Td>
      <Td mono>
        {c.funnel_step_mapped
          ? c.funnel_step_mapped
          : c.unmapped_warning
          ? <span className="text-amber-400 flex items-center gap-1">⚠ Sin mapear</span>
          : <span className="text-neutral-700">—</span>}
      </Td>
      <Td mono>{c.trigger_event ?? <span className="text-neutral-700">—</span>}</Td>
      <Td>
        {synced
          ? <span className={`tabular-nums font-medium ${crCls}`}>{(c.conversion_rate * 100).toFixed(1)}%</span>
          : <span className="text-neutral-700">—</span>}
      </Td>
      <Td>
        {lastSync
          ? <span className="text-neutral-600 tabular-nums">{lastSync}</span>
          : <span className="text-neutral-700">Nunca</span>}
      </Td>
      <Td>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            confirming
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100'
          } disabled:opacity-40`}
        >
          {deleting ? '…' : confirming ? '¿Confirmar?' : 'Eliminar'}
        </button>
        {confirming && !deleting && (
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-neutral-600 hover:text-neutral-400 ml-2 transition-colors"
          >
            Cancelar
          </button>
        )}
      </Td>
    </tr>
  )
}

function CampaignsSection() {
  const [campaigns, setCampaigns] = useState<TrackedCampaign[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newId, setNewId] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getTrackedCampaigns()
      .then(setCampaigns)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  async function handleAdd() {
    const id = newId.trim()
    if (!id) return
    setAddLoading(true)
    setError(null)
    try {
      const row = await api.addTrackedCampaign(id)
      setCampaigns(prev => {
        const existing = prev?.find(c => c.cio_campaign_id === (row as TrackedCampaign).cio_campaign_id)
        if (existing) return prev
        return [...(prev ?? []), row as TrackedCampaign]
      })
      setNewId('')
      setAdding(false)
      setSuccess(`Campaña ${id} agregada. Sincroniza para obtener sus datos.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar campaña')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      const r = await api.syncCampaigns()
      const updated = await api.getTrackedCampaigns()
      setCampaigns(updated)
      setSuccess(`Sync completado: ${r.total_synced} campañas · ${r.mapped_to_funnel} mapeadas${r.spike_alerts.length > 0 ? ` · ⚠ ${r.spike_alerts.length} spike(s)` : ''}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  function handleDeleted(id: string) {
    setCampaigns(prev => prev?.filter(c => c.cio_campaign_id !== id) ?? [])
    setSuccess(`Campaña ${id} eliminada del monitoreo.`)
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-4">
        <SectionHeader
          title="Campañas Monitoreadas"
          description="Campañas de Customer.io que Kepler sincroniza y usa para el diagnóstico del funnel."
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 rounded-lg transition-colors disabled:opacity-40"
          >
            {syncing
              ? <><span className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin" /> Sincronizando…</>
              : '↻ Sincronizar todas'}
          </button>
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg transition-colors"
          >
            + Agregar campaña
          </button>
        </div>
      </div>

      {error && <div className="mb-3"><ErrorBanner msg={error} onDismiss={() => setError(null)} /></div>}
      {success && <div className="mb-3"><SuccessBanner msg={success} onDismiss={() => setSuccess(null)} /></div>}

      {/* Add form */}
      {adding && (
        <div className="mb-4 bg-neutral-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-white text-sm font-medium mb-3">Agregar campaña de Customer.io</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-xs">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                placeholder="ID numérico (ej. 4400)"
                value={newId}
                onChange={e => setNewId(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewId('') } }}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-lg text-white text-sm placeholder-neutral-600 outline-none transition-colors font-mono"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newId || addLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm rounded-lg transition-colors disabled:opacity-40"
            >
              {addLoading ? '…' : 'Agregar'}
            </button>
            <button
              onClick={() => { setAdding(false); setNewId('') }}
              className="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-neutral-600 text-xs mt-2">
            El ID lo encuentras en la URL de la campaña en Customer.io. Después de agregar, usa "Sincronizar todas" para obtener datos reales.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500 text-sm">Cargando campañas…</div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-400 mb-1">No hay campañas configuradas</p>
            <p className="text-neutral-600 text-sm">Agrega el ID de una campaña de Customer.io para empezar a monitorearla.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-800/40">
                <tr>
                  <Th>ID</Th>
                  <Th>Nombre</Th>
                  <Th>Estado</Th>
                  <Th>Paso del funnel</Th>
                  <Th>Trigger</Th>
                  <Th>CR</Th>
                  <Th>Último sync</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <CampaignRow key={c.cio_campaign_id} c={c} onDelete={handleDeleted} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-neutral-800 px-4 py-2 bg-neutral-900/50">
          <span className="text-[10px] text-neutral-600">
            {campaigns?.length ?? 0} campaña(s) monitoreada(s) · Kepler sincroniza estas con Customer.io para el diagnóstico del funnel
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

function KBRow({
  entry,
  onChange,
  onDelete,
}: {
  entry: KnowledgeBaseEntry
  onChange: (updated: KnowledgeBaseEntry) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ titulo: entry.titulo, contenido: entry.contenido })
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    try {
      const updated = await api.updateKnowledgeBaseEntry(entry.id!, { activo: !entry.activo })
      onChange(updated as KnowledgeBaseEntry)
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await api.deleteKnowledgeBaseEntry(entry.id!)
      onDelete(entry.id!)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await api.updateKnowledgeBaseEntry(entry.id!, {
        titulo: draft.titulo,
        contenido: draft.contenido,
      })
      onChange(updated as KnowledgeBaseEntry)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft({ titulo: entry.titulo, contenido: entry.contenido })
    setEditing(false)
  }

  return (
    <>
      <tr className={`hover:bg-neutral-800/20 transition-colors group ${!entry.activo ? 'opacity-50' : ''}`}>
        <Td>
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-medium uppercase tracking-wide">
            {entry.tipo}
          </span>
        </Td>
        <Td>
          <span className="text-neutral-200 font-medium">{entry.titulo}</span>
        </Td>
        <Td>
          <span className="text-neutral-500 line-clamp-2 max-w-sm leading-relaxed">
            {entry.contenido.length > 100 ? entry.contenido.slice(0, 100) + '…' : entry.contenido}
          </span>
        </Td>
        <Td>
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={entry.activo ? 'Desactivar' : 'Activar'}
            className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-40"
          >
            <span className={`w-7 h-4 rounded-full transition-colors relative ${entry.activo ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${entry.activo ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            <span className={entry.activo ? 'text-emerald-400' : 'text-neutral-500'}>
              {entry.activo ? 'Activo' : 'Inactivo'}
            </span>
          </button>
        </Td>
        <Td>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(e => !e)}
              className="text-xs text-neutral-600 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              {editing ? 'Cerrar' : 'Editar'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-xs transition-colors disabled:opacity-40 ${
                confirming
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100'
              }`}
            >
              {deleting ? '…' : confirming ? '¿Confirmar?' : 'Eliminar'}
            </button>
            {confirming && !deleting && (
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </Td>
      </tr>

      {editing && (
        <tr>
          <td colSpan={5} className="px-4 py-4 border-t border-neutral-800/60 bg-neutral-800/20">
            <div className="space-y-3 max-w-2xl">
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Título</label>
                <input
                  type="text"
                  value={draft.titulo}
                  onChange={e => setDraft(d => ({ ...d, titulo: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-lg text-white text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Contenido</label>
                <textarea
                  value={draft.contenido}
                  onChange={e => setDraft(d => ({ ...d, contenido: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-lg text-white text-sm outline-none transition-colors resize-y font-mono leading-relaxed"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-40"
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function KnowledgeBaseSection() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [draft, setDraft] = useState({ tipo: '', titulo: '', contenido: '' })

  useEffect(() => {
    api.getConfigKnowledgeBase()
      .then(setEntries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(updated: KnowledgeBaseEntry) {
    setEntries(prev => prev?.map(e => e.id === updated.id ? updated : e) ?? [])
  }

  function handleDeleted(id: string) {
    setEntries(prev => prev?.filter(e => e.id !== id) ?? [])
    setSuccess('Entrada eliminada de la Knowledge Base.')
  }

  async function handleAdd() {
    if (!draft.tipo || !draft.titulo || !draft.contenido) return
    setAddLoading(true)
    setError(null)
    try {
      const created = await api.addKnowledgeBaseEntry({
        tipo: draft.tipo.trim().toUpperCase(),
        titulo: draft.titulo.trim(),
        contenido: draft.contenido.trim(),
      })
      setEntries(prev => [...(prev ?? []), created as KnowledgeBaseEntry])
      setDraft({ tipo: '', titulo: '', contenido: '' })
      setAdding(false)
      setSuccess(`Entrada "${(created as KnowledgeBaseEntry).titulo}" agregada.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar entrada')
    } finally {
      setAddLoading(false)
    }
  }

  const byTipo = (entries ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] ?? 0) + 1
    return acc
  }, {})
  const activeCount = (entries ?? []).filter(e => e.activo).length

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-4">
        <SectionHeader
          title="Knowledge Base"
          description="Información sobre Trii que Claude recibe al generar estrategias. Solo las entradas activas se incluyen."
        />
        <div className="flex items-center gap-2 shrink-0">
          {entries && (
            <div className="text-right text-xs text-neutral-600 mt-1 mr-2">
              <p>{activeCount} activas de {entries.length}</p>
              <p className="mt-0.5">{Object.keys(byTipo).join(' · ')}</p>
            </div>
          )}
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg transition-colors"
          >
            + Agregar entrada
          </button>
        </div>
      </div>

      {error && <div className="mb-3"><ErrorBanner msg={error} onDismiss={() => setError(null)} /></div>}
      {success && <div className="mb-3"><SuccessBanner msg={success} onDismiss={() => setSuccess(null)} /></div>}

      {adding && (
        <div className="mb-4 bg-neutral-900 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <p className="text-white text-sm font-medium">Nueva entrada en Knowledge Base</p>
          <div className="flex gap-2">
            <div className="w-32">
              <label className="text-xs text-neutral-500 font-medium mb-1 block">Tipo</label>
              <input
                type="text"
                placeholder="CAMPANAS"
                value={draft.tipo}
                onChange={e => setDraft(d => ({ ...d, tipo: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-lg text-white text-sm placeholder-neutral-600 outline-none transition-colors uppercase"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-500 font-medium mb-1 block">Título</label>
              <input
                type="text"
                placeholder="Nombre descriptivo"
                value={draft.titulo}
                onChange={e => setDraft(d => ({ ...d, titulo: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-lg text-white text-sm placeholder-neutral-600 outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-500 font-medium mb-1 block">Contenido</label>
            <textarea
              placeholder="Contenido que Claude recibirá como contexto..."
              value={draft.contenido}
              onChange={e => setDraft(d => ({ ...d, contenido: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:border-amber-500/50 rounded-lg text-white text-sm placeholder-neutral-600 outline-none transition-colors resize-y font-mono leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={addLoading || !draft.tipo || !draft.titulo || !draft.contenido}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-40"
            >
              {addLoading ? 'Guardando…' : 'Guardar entrada'}
            </button>
            <button
              onClick={() => { setAdding(false); setDraft({ tipo: '', titulo: '', contenido: '' }) }}
              className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500 text-sm">Cargando knowledge base…</div>
        ) : !entries || entries.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">No hay entradas en el knowledge base</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-800/40">
                <tr>
                  <Th>Tipo</Th>
                  <Th>Título</Th>
                  <Th>Contenido</Th>
                  <Th>Estado</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <KBRow key={e.id} entry={e} onChange={handleChange} onDelete={handleDeleted} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-neutral-800 px-4 py-2 bg-neutral-900/50">
          <span className="text-[10px] text-neutral-600">
            Solo las entradas activas se incluyen en el contexto de Claude · Edita el contenido para actualizar lo que Claude sabe sobre Trii
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── System Prompts (compuesto por agente, secciones desplegables) ────────────

const AGENT_LABELS: Record<string, string> = {
  premium: 'Premium',
  basic: 'Básico',
}

const PROMPT_TYPE_LABELS: Record<string, string> = {
  system: 'Instrucciones generales',
  kb_preamble: 'Cómo usar la Knowledge Base',
  user_template: 'Template de datos semanales',
  perplexity_system: 'Instrucciones de búsqueda de mercado',
  perplexity_query: 'Qué le preguntamos al buscador',
}

interface PromptSection {
  type: string
  title: string
  body: string
}

// Separa el composite (marcadores <!--@prompt:tipo-->) en secciones — espejo
// exacto de _parse_prompt_composite en supabase_client.py (backend es la fuente
// de verdad al guardar; esto es solo para mostrar/editar por sección en la UI).
function parseComposite(composite: string): PromptSection[] {
  const markerRe = /<!--@prompt:(\w+)-->[ \t]*\n/g
  const matches: { type: string; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = markerRe.exec(composite))) {
    matches.push({ type: m[1], start: m.index, end: markerRe.lastIndex })
  }
  return matches.map((match, i) => {
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].start : composite.length
    let body = composite.slice(match.end, bodyEnd)
    const titleMatch = body.match(/^###[^\n]*\n/)
    const title = titleMatch
      ? titleMatch[0].replace(/^###\s*/, '').trim()
      : PROMPT_TYPE_LABELS[match.type] ?? match.type
    if (titleMatch) body = body.slice(titleMatch[0].length)
    return { type: match.type, title, body: body.trim() }
  })
}

function rebuildComposite(sections: PromptSection[]): string {
  return sections
    .map(s => `<!--@prompt:${s.type}-->\n### ${s.title}\n${s.body}`.replace(/\s+$/, ''))
    .join('\n\n\n') + '\n'
}

function PromptSectionRow({
  section,
  originalBody,
  expanded,
  editing,
  onToggleExpand,
  onToggleEdit,
  onChangeBody,
}: {
  section: PromptSection
  originalBody: string
  expanded: boolean
  editing: boolean
  onToggleExpand: () => void
  onToggleEdit: () => void
  onChangeBody: (body: string) => void
}) {
  const dirty = section.body !== originalBody

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/40">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-neutral-800/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
          <span className={`text-neutral-600 transition-transform inline-block ${expanded ? 'rotate-90' : ''}`}>▸</span>
          {PROMPT_TYPE_LABELS[section.type] ?? section.title}
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Cambios sin guardar" />}
        </span>
        <span className="text-[10px] text-neutral-600 shrink-0">{section.body.length.toLocaleString('es-CO')} caracteres</span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-800/60 px-3 py-3">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={onToggleEdit}
              className="text-[11px] text-neutral-600 hover:text-amber-400 transition-colors"
            >
              {editing ? 'Ver solo lectura' : 'Editar esta sección'}
            </button>
          </div>
          {editing ? (
            <textarea
              value={section.body}
              onChange={e => onChangeBody(e.target.value)}
              rows={16}
              spellCheck={false}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-300 font-mono resize-y focus:outline-none focus:border-amber-500/40 leading-relaxed"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-xs text-neutral-400 font-mono leading-relaxed max-h-96 overflow-y-auto">
              {section.body}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function AgentPromptCard({ agentType }: { agentType: 'premium' | 'basic' }) {
  const [composite, setComposite] = useState<string | null>(null)
  const [original, setOriginal] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingTypes, setEditingTypes] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.getPromptComposite(agentType)
      .then(r => {
        setComposite(r.composite)
        setOriginal(r.composite)
        setUpdatedAt(r.updated_at)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Error al cargar el prompt'))
      .finally(() => setLoading(false))
  }, [agentType])

  const sections = composite !== null ? parseComposite(composite) : []
  const originalByType = new Map(parseComposite(original).map(s => [s.type, s.body]))

  function toggleExpand(type: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function toggleEdit(type: string) {
    setEditingTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
    setExpanded(prev => new Set(prev).add(type))
  }

  function handleChangeBody(type: string, newBody: string) {
    const updated = sections.map(s => (s.type === type ? { ...s, body: newBody } : s))
    setComposite(rebuildComposite(updated))
  }

  function handleCancelAll() {
    setComposite(original)
    setEditingTypes(new Set())
    setError(null)
  }

  async function handleSave() {
    if (composite === null) return
    setSaving(true)
    setError(null)
    try {
      const r = await api.updatePromptComposite(agentType, composite)
      setComposite(r.composite)
      setOriginal(r.composite)
      setUpdatedAt(r.updated_at)
      setEditingTypes(new Set())
      setSuccess(
        r.updated.length > 0
          ? `Se actualizó: ${r.updated.map(pt => PROMPT_TYPE_LABELS[pt] ?? pt).join(', ')}.`
          : 'No hubo cambios que guardar.'
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el prompt')
    } finally {
      setSaving(false)
    }
  }

  const dirty = composite !== null && composite !== original
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm">Agente {AGENT_LABELS[agentType]}</h3>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            {loading ? 'Cargando…' : `${(composite ?? '').length.toLocaleString('es-CO')} caracteres totales`}
            {updatedLabel ? ` · última edición ${updatedLabel}` : ''}
          </p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-amber-400/70">Cambios sin guardar</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-40"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={handleCancelAll}
              disabled={saving}
              className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {error && <div className="px-5 pb-3"><ErrorBanner msg={error} onDismiss={() => setError(null)} /></div>}
      {success && <div className="px-5 pb-3"><SuccessBanner msg={success} onDismiss={() => setSuccess(null)} /></div>}

      {!loading && (
        <>
          <div className="mx-5 border-t border-neutral-800/60" />
          <div className="px-5 py-4 space-y-2">
            {sections.map(section => (
              <PromptSectionRow
                key={section.type}
                section={section}
                originalBody={originalByType.get(section.type) ?? ''}
                expanded={expanded.has(section.type)}
                editing={editingTypes.has(section.type)}
                onToggleExpand={() => toggleExpand(section.type)}
                onToggleEdit={() => toggleEdit(section.type)}
                onChangeBody={body => handleChangeBody(section.type, body)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PromptsSection() {
  return (
    <section>
      <SectionHeader
        title="System Prompts"
        description="Las instrucciones completas de cada agente, como un solo bloque. Al guardar, el sistema identifica solo qué parte cambió."
      />
      <div className="space-y-4">
        <AgentPromptCard agentType="premium" />
        <AgentPromptCard agentType="basic" />
      </div>
    </section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  return (
    <div className="flex-1 overflow-auto bg-neutral-950">
      <div className="px-6 py-8 space-y-10">

        <CampaignsSection />
        <KnowledgeBaseSection />
        <PromptsSection />

      </div>
    </div>
  )
}
