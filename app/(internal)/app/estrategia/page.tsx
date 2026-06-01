'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  api,
  type FunnelStep,
  type CampaignSummary,
  type StrategyResult,
  type StrategyAction,
  type StrategyNode,
  type SafetyStatus,
  type SyncResult,
  type SystemContext,
  type FunnelStepRaw,
  type CampaignCacheRaw,
  type CioEvent,
  type CioAttribute,
  type KnowledgeBaseEntry,
} from '@/lib/api'

// ─── Canvas types ─────────────────────────────────────────────────────────────

interface NodeCopies {
  subject:    string  // Liquid expression
  preheader?: string  // Liquid expression (email only)
  cuerpo:     string  // Liquid expression
}
interface ActionEdit {
  included:  boolean
  nodeEdits: Record<number, NodeCopies>
}

// Normaliza nodo legacy {conservador/moderado/arriesgado} a Liquid string
function toLiquid(v: string | { conservador?: string; moderado?: string; arriesgado?: string } | undefined | null): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  const c = v.conservador ?? ''
  const m = v.moderado ?? v.arriesgado ?? ''
  const a = v.arriesgado ?? ''
  return `{% if customer.Perfil_de_riesgo == '1. Conservador' %}${c}{% elsif customer.Perfil_de_riesgo == '2. Moderado' or customer.Perfil_de_riesgo == '3. Arriesgado' %}${m}{% else %}${a}{% endif %}`
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const raw = data.slice(0, -1)
  const values = raw.slice(-6)
  if (values.length < 2 || values.every(v => v === 0)) {
    return <span className="text-neutral-700 text-xs">—</span>
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const W = 64, H = 22, pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const rising = values[values.length - 1] >= values[values.length - 2]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0 opacity-80">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={rising ? '#34d399' : '#f87171'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.round(value * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500 text-xs w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-neutral-300 text-xs w-9 text-right tabular-nums">{pct}%</span>
    </div>
  )
}

type Health = FunnelStep['health']
const H_STYLES: Record<Health, { dot: string; text: string; ring: string }> = {
  verde:    { dot: 'bg-emerald-400', text: 'text-emerald-400', ring: 'border-emerald-500/25' },
  amarillo: { dot: 'bg-amber-400',   text: 'text-amber-400',   ring: 'border-amber-500/25' },
  rojo:     { dot: 'bg-neutral-600', text: 'text-neutral-500', ring: 'border-neutral-800' },
  spike:    { dot: 'bg-orange-400',  text: 'text-orange-400',  ring: 'border-orange-500/30' },
}

const H_LEGEND: Record<Health, string> = {
  verde:    'Funcionando bien',
  amarillo: 'Atención',
  rojo:     'Sin campaña',
  spike:    'Tráfico inusual',
}

const STATUS_LABELS: Record<string, string> = {
  running:  'activa',
  paused:   'pausada',
  draft:    'borrador',
  stopped:  'detenida',
  archived: 'archivada',
}

const GOAL_LABELS: Record<string, string> = {
  BeCashIn:                              'depositaron',
  Risk_Profile_Completed:                'completaron perfil de riesgo',
  Basic_Data_Completed:                  'completaron datos básicos',
  BeFullUserCreated:                     'completaron cuenta (Full)',
  Data_Validation_Information_Completed: 'completaron validación de datos',
  front_photo_completed:                 'subieron foto frontal',
  back_photo_completed:                  'subieron foto reverso',
  video_recording_completed:             'grabaron video liveness',
  befullusercreated:                     'completaron cuenta (Full)',
}

function goalLabel(goalEvent: string | null | undefined): string {
  if (!goalEvent) return 'convirtieron'
  const key = Object.keys(GOAL_LABELS).find(k => k.toLowerCase() === goalEvent.toLowerCase())
  return key ? GOAL_LABELS[key] : goalEvent.replace(/_/g, ' ').toLowerCase()
}

function HealthDot({ health }: { health: Health }) {
  const s = H_STYLES[health]
  return (
    <span className="relative flex items-center justify-center w-2 h-2 shrink-0 mt-0.5">
      {health === 'verde' && (
        <span className="absolute w-full h-full rounded-full bg-emerald-400 opacity-30 animate-ping" />
      )}
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
    </span>
  )
}

// ─── Campaign-centric diagnostic ─────────────────────────────────────────────

interface CampaignView {
  cid: string
  campaign: CampaignSummary
  step: FunnelStep
  coveredSteps: FunnelStep[]
  stepRangeLabel: string
  health: Health
}

function buildCampaignViews(health: FunnelStep[]): { campaignViews: CampaignView[]; trueGaps: FunnelStep[] } {
  const sortedSteps = [...health].sort((a, b) => a.step_order - b.step_order)

  const eventToOrder = new Map<string, number>()
  for (const s of sortedSteps) {
    if (s.entry_event) eventToOrder.set(s.entry_event.toLowerCase(), s.step_order)
    if (s.exit_event)  eventToOrder.set(s.exit_event.toLowerCase(),  s.step_order)
  }
  eventToOrder.set('photo_validation_completed', 6)

  const seen = new Set<string>()
  const campaignViews: CampaignView[] = []

  for (const step of sortedSteps) {
    for (const c of step.campaigns) {
      if (seen.has(c.cio_campaign_id)) continue
      seen.add(c.cio_campaign_id)

      const startOrder = step.step_order + 1  // +1: la campaña atrapa usuarios DESPUÉS de completar el trigger step
      const goalOrder  = c.goal_event
        ? (eventToOrder.get(c.goal_event.toLowerCase()) ?? startOrder)
        : startOrder

      const lo = Math.min(startOrder, goalOrder)
      const hi = Math.max(startOrder, goalOrder)
      const coveredSteps = sortedSteps.filter(s => s.step_order >= lo && s.step_order <= hi)
      const stepRangeLabel = lo === hi ? `Paso ${lo}` : `Pasos ${lo} → ${hi}`

      campaignViews.push({ cid: c.cio_campaign_id, campaign: c, step, coveredSteps, stepRangeLabel, health: step.health })
    }
  }

  const coveredOrders = new Set(campaignViews.flatMap(v => v.coveredSteps.map(s => s.step_order)))
  const trueGaps = sortedSteps.filter(s => s.health === 'rojo' && !coveredOrders.has(s.step_order))

  return { campaignViews, trueGaps }
}

// ─── Funnel Step Card ─────────────────────────────────────────────────────────

function CampaignBlock({ c }: { c: CampaignSummary }) {
  const [warningHover, setWarningHover] = useState(false)
  const cr = c.conversion_rate
  const crPct = (cr * 100).toFixed(1)
  const sparkData = c.metrics_weekly_json?.series?.converted ?? []

  const crColor =
    cr >= 0.07 ? 'text-emerald-400' :
    cr >= 0.03 ? 'text-amber-400'   :
                 'text-red-400'

  const isActive    = c.status === 'running'
  const statusLabel = c.status ? (STATUS_LABELS[c.status] ?? c.status) : '—'
  const nToques     = c.n_nodos ?? null
  const hasActivity = c.delivered > 0 || c.total_sent > 0
  const hasWarnings = !!(c.warnings && c.warnings.length > 0)

  return (
    <div className="relative px-4 py-3.5">

      {/* Warning — top-right corner */}
      {hasWarnings && (
        <div
          className="absolute top-3.5 right-3.5 z-10"
          onMouseEnter={() => setWarningHover(true)}
          onMouseLeave={() => setWarningHover(false)}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center cursor-default">
            <span className="text-[8px] text-amber-400/80 leading-none">⚠</span>
          </div>
          {warningHover && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-neutral-800 border border-amber-500/20 rounded-xl px-3 py-2.5 shadow-2xl">
              <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1.5">
                {c.warnings!.length} alerta{c.warnings!.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1.5">
                {c.warnings!.map((w, i) => (
                  <p key={i} className="text-[11px] text-neutral-300 leading-relaxed">{w}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Name */}
      <div className="flex items-center gap-2 pr-7 mb-2.5">
        <p className="text-[12px] font-medium text-neutral-300 leading-snug flex-1 min-w-0 truncate" title={c.name}>{c.name}</p>
        {nToques !== null && nToques > 0 && (
          <span className="text-[10px] text-neutral-600 shrink-0 tabular-nums">×{nToques}</span>
        )}
        {!isActive && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 border bg-neutral-800 text-neutral-500 border-neutral-700">
            {statusLabel}
          </span>
        )}
      </div>

      {/* CR + sparkline */}
      <div className="flex items-end justify-between mb-2">
        <span className={`text-2xl font-bold tabular-nums leading-none ${crColor}`}>{crPct}%</span>
        {sparkData.length > 3 && <Sparkline data={sparkData} />}
      </div>

      {/* Metrics — plain text, no chips */}
      {hasActivity && (
        <p className="text-[10px] text-neutral-600 tabular-nums leading-relaxed">
          {c.total_sent > c.delivered && <>{c.total_sent.toLocaleString('es-CO')} → </>}
          {c.delivered.toLocaleString('es-CO')} llegaron
          {' · '}
          {c.converted.toLocaleString('es-CO')} {goalLabel(c.goal_event)}
          {' · '}
          <span className="text-neutral-700">últ. 4 sem.</span>
        </p>
      )}
    </div>
  )
}

function FunnelStepCard({ step }: { step: FunnelStep }) {
  const s = H_STYLES[step.health]
  const isGap = step.health === 'rojo'

  const healthBadgeCls =
    step.health === 'verde'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
    step.health === 'amarillo' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'       :
    step.health === 'spike'    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'    :
                                 'bg-neutral-800 text-neutral-500 border-neutral-700'

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden ${s.ring} ${isGap ? 'opacity-60' : ''}`}>

      {/* ── Header ── */}
      <div className={`px-4 py-3 flex items-center justify-between gap-3 ${!isGap ? 'border-b border-neutral-800/70' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          <HealthDot health={step.health} />
          <p className="text-white text-sm font-semibold leading-tight truncate">
            <span className={`${s.text} font-mono mr-1`}>{step.step_order}.</span>
            {step.step_name}
          </p>
        </div>
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium shrink-0 ${healthBadgeCls}`}>
          {H_LEGEND[step.health]}
        </span>
      </div>

      {/* ── Body ── */}
      {isGap ? (
        <div className="px-4 py-4 space-y-2.5">
          <p className="text-neutral-400 text-sm">
            Los usuarios que pasan por aquí no reciben ningún mensaje.
          </p>
          {step.entry_event && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Trigger disponible</span>
              <span className="text-neutral-500 text-[10px] font-mono bg-neutral-800 px-2 py-0.5 rounded">
                {step.entry_event}
              </span>
            </div>
          )}
        </div>
      ) : step.campaigns.length > 0 ? (
        <div className="divide-y divide-neutral-800/50">
          {step.campaigns.map(c => <CampaignBlock key={c.cio_campaign_id} c={c} />)}
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="text-neutral-600 text-xs">Corré el diagnóstico para ver las métricas de esta semana</p>
        </div>
      )}

    </div>
  )
}

// ─── Campaign Diagnostic Card ─────────────────────────────────────────────────

function CampaignDiagnosticCard({ view }: { view: CampaignView }) {
  const [stepsHover, setStepsHover]     = useState(false)
  const [warningHover, setWarningHover] = useState(false)
  const { campaign: c, coveredSteps, stepRangeLabel, health } = view
  const s = H_STYLES[health]

  const cr = c.conversion_rate
  const crPct = (cr * 100).toFixed(1)
  const sparkData = c.metrics_weekly_json?.series?.converted ?? []

  const crColor =
    cr >= 0.07 ? 'text-emerald-400' :
    cr >= 0.03 ? 'text-amber-400'   :
                 'text-red-400'

  const crLabel =
    cr >= 0.07 ? 'Convirtiendo bien' :
    cr >= 0.03 ? 'Puede mejorar'     :
                 'Bajo rendimiento'

  const isActive    = c.status === 'running'
  const statusLabel = c.status ? (STATUS_LABELS[c.status] ?? c.status) : '—'
  const hasActivity = c.delivered > 0 || c.total_sent > 0
  const hasWarnings = !!(c.warnings && c.warnings.length > 0)

  return (
    <div className={`relative bg-neutral-900 border rounded-xl ${s.ring}`}>

      {/* Sparkline — absolute bottom-right */}
      {sparkData.length > 3 && (
        <div className="absolute bottom-3 right-3 z-10">
          <Sparkline data={sparkData} />
        </div>
      )}

      {/* Alerta — top-right, parpadea 3s cada 2 min */}
      {hasWarnings && (
        <div
          className="absolute top-3 right-3 z-10"
          onMouseEnter={() => setWarningHover(true)}
          onMouseLeave={() => setWarningHover(false)}
        >
          <div
            className="w-4 h-4 rounded-full bg-amber-500/15 border border-amber-400/45 flex items-center justify-center cursor-default"
            style={{ animation: 'warning-soft-pulse 120s ease-in-out infinite' }}
          >
            <span className="text-[9px] font-bold text-amber-400 leading-none select-none">!</span>
          </div>
          {warningHover && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-neutral-800 border border-amber-500/20 rounded-xl px-3.5 py-3 shadow-2xl" style={{ width: '260px' }}>
              <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-2">
                {c.warnings!.length} alerta{c.warnings!.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {c.warnings!.map((w, i) => (
                  <p key={i} className="text-[11px] text-neutral-300 leading-relaxed">{w}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-[120px]">

        {/* Columna izquierda — CR + label, ocupa toda la altura */}
        <div className="shrink-0 flex flex-col items-center justify-center px-5 border-r border-neutral-800/60 gap-1.5">
          <span className={`text-3xl font-bold tabular-nums leading-none ${crColor}`}>{crPct}%</span>
          <p className={`text-[10px] font-medium leading-none ${crColor} opacity-60`}>{crLabel}</p>
        </div>

        {/* Columna derecha — título + métricas centrados verticalmente + sparkline */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-4 pr-3 gap-1.5">

          {/* Nombre (hover: pasos) + status */}
          <div
            className="relative"
            onMouseEnter={() => setStepsHover(true)}
            onMouseLeave={() => setStepsHover(false)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-snug truncate cursor-default flex-1 min-w-0">{c.name}</p>
              {!isActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-neutral-800 text-neutral-500 border-neutral-700 shrink-0">
                  {statusLabel}
                </span>
              )}
            </div>
            {stepsHover && coveredSteps.length > 0 && (
              <div className="absolute left-0 top-full mt-2 z-50 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 shadow-2xl min-w-[180px]">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">Pasos que cubre</p>
                <div className="space-y-1">
                  {coveredSteps.map(cs => (
                    <div key={cs.step_code} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-600 shrink-0">{cs.step_order}.</span>
                      <span className="text-xs text-neutral-300">{cs.step_name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-600 font-mono border-t border-neutral-700/60 mt-1.5 pt-1.5">{stepRangeLabel}</p>
              </div>
            )}
          </div>

          {/* Métricas */}
          {hasActivity && (
            <div className="min-w-0 pr-16">
              <p className="text-[11px] text-neutral-500 tabular-nums leading-relaxed">
                {c.total_sent > 0 && <>{c.total_sent.toLocaleString('es-CO')} <span className="text-neutral-600">enviados</span> → </>}
                {c.delivered.toLocaleString('es-CO')} <span className="text-neutral-600">llegaron</span>
                {' · '}
                {c.converted.toLocaleString('es-CO')} <span className="text-neutral-600">completaron</span>{' '}
                {goalLabel(c.goal_event)}
              </p>
              <p className="text-[10px] text-neutral-700 tabular-nums mt-0.5">últ. 4 sem.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Canvas components ────────────────────────────────────────────────────────

const TIPO_CFG: Record<string, { label: string; cls: string }> = {
  optimizar:  { label: 'OPTIMIZAR', cls: 'bg-amber-500/12 text-amber-400 border-amber-500/25' },
  reforzar:   { label: 'REFORZAR',  cls: 'bg-purple-500/12 text-purple-400 border-purple-500/25' },
  alerta_gap: { label: 'GAP',       cls: 'bg-neutral-500/12 text-neutral-400 border-neutral-600/40' },
  crear:      { label: 'CREAR',     cls: 'bg-sky-500/12 text-sky-400 border-sky-500/25' },
}

// ─── Liquid display helpers ───────────────────────────────────────────────────

// Renderiza texto con Liquid: las expresiones {% %} y {{ }} en color ámbar,
// el resto en texto normal. Sin parsing complejo, sin tarjetas.
function renderLiquidText(text: string): React.ReactNode[] {
  const parts = text.split(/(\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\})/g)
  return parts.map((part, i) => {
    if (!/^\{[%{]/.test(part)) return <span key={i}>{part}</span>
    const invalid = part.startsWith('{%-') || part.endsWith('-%}')
    return (
      <span key={i} className={`font-mono ${invalid ? 'text-red-400' : 'text-amber-400/80'}`}>
        {part}
      </span>
    )
  })
}

function SegmentedLiquidField({
  label,
  hint,
  value,
  rows,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  rows: number
  onChange: (v: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const hasLiquid = value.includes('{%') || value.includes('{{')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-strip obligatorio: si detecta {%- o -%} los elimina inmediatamente
  React.useEffect(() => {
    if (value.includes('{%-') || value.includes('-%}')) {
      onChange(value.replace(/\{%-/g, '{%').replace(/-%\}/g, '%}'))
    }
  }, [value])

  function handleDivClick() {
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">{label}</span>
        {hint && <span className="text-[10px] text-neutral-700">{hint}</span>}
      </div>
      {hasLiquid && !editing ? (
        <div
          onClick={handleDivClick}
          title="Clic para editar"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 font-mono leading-relaxed whitespace-pre-wrap cursor-text hover:border-neutral-500 transition-colors"
        >
          {renderLiquidText(value)}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => hasLiquid && setEditing(false)}
          rows={rows}
          spellCheck={false}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-neutral-500/30 leading-relaxed"
        />
      )}
    </div>
  )
}

function LiquidField({
  label,
  hint,
  value,
  rows,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  rows: number
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">{label}</span>
        {hint && <span className="text-[10px] text-neutral-700">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-neutral-500/30 hover:border-neutral-600 transition-colors leading-relaxed"
      />
    </div>
  )
}

function NodeLiquidEditor({
  nodo,
  copies,
  onChange,
}: {
  nodo: StrategyNode
  copies: NodeCopies
  onChange: (c: NodeCopies) => void
}) {
  const isPush = nodo.tipo === 'push'
  return (
    <div className="space-y-3">
      <SegmentedLiquidField
        label={isPush ? 'Título (subject)' : 'Asunto (subject)'}
        hint={isPush ? '≤60 chars por rama' : '≤50 chars por rama'}
        value={copies.subject}
        rows={4}
        onChange={v => onChange({ ...copies, subject: v })}
      />
      {!isPush && (
        <SegmentedLiquidField
          label="Preheader"
          hint="≤85 chars por rama"
          value={copies.preheader ?? ''}
          rows={4}
          onChange={v => onChange({ ...copies, preheader: v })}
        />
      )}
      <SegmentedLiquidField
        label={isPush ? 'Cuerpo (body)' : 'Cuerpo email'}
        hint={isPush ? '≤180 chars por rama' : '≤500 chars por rama'}
        value={copies.cuerpo}
        rows={isPush ? 6 : 8}
        onChange={v => onChange({ ...copies, cuerpo: v })}
      />
    </div>
  )
}

// ─── Campaign Flow Canvas ─────────────────────────────────────────────────────

function fmtDelay(hours: number, isFirst: boolean): string {
  if (isFirst) return 'Al entrar'
  if (hours === 0) return 'Inmediato'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 24) return `${hours}h`
  if (hours === 24) return '1 día'
  if (hours % 24 === 0) return `${hours / 24} días`
  return `${hours}h`
}

function isLiquidExpr(s: unknown): boolean {
  return typeof s === 'string' && s.includes('{%')
}

function subjectPreview(subject: unknown): string {
  const s = typeof subject === 'string' ? subject : ''
  if (!s) return ''
  if (isLiquidExpr(s)) {
    const m = s.match(/\{%-?\s*if[^%]*%\}([\s\S]*?)\{%-?\s*elsif/)
    const preview = m ? m[1].trim() : ''
    return preview.slice(0, 50) + (preview.length > 50 ? '…' : '') || 'Personalizado por perfil'
  }
  return s.slice(0, 50) + (s.length > 50 ? '…' : '')
}

function FlowConnector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center" style={{ width: 280 }}>
      <div className="w-px h-5 bg-neutral-700/60" />
      {label && (
        <span className="text-[10px] text-neutral-600 font-medium px-2.5 py-0.5 bg-[#0a0a0a] rounded-full border border-neutral-800 z-10 -my-0.5">
          {label}
        </span>
      )}
      <div className="w-px h-5 bg-neutral-700/60" />
    </div>
  )
}

function FlowTriggerNode({ label }: { label: string }) {
  return (
    <div style={{ width: 280 }}>
      <div className="w-full px-4 py-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
        <div className="text-[9px] text-emerald-500/50 font-semibold uppercase tracking-widest mb-1">Entra cuando</div>
        <div className="text-emerald-300 text-xs font-medium truncate">{label}</div>
      </div>
    </div>
  )
}

function FlowGoalNode({ label }: { label: string }) {
  return (
    <div style={{ width: 280 }}>
      <div className="w-full px-4 py-3 bg-sky-500/8 border border-sky-500/20 rounded-xl">
        <div className="text-[9px] text-sky-500/50 font-semibold uppercase tracking-widest mb-1">Convierte en</div>
        <div className="text-sky-300 text-xs font-medium truncate">{label}</div>
      </div>
    </div>
  )
}

type NodeUpdateStatus = 'idle' | 'loading' | 'success' | 'error'

function FlowMessageNode({
  nodo,
  isSelected,
  onClick,
  updateStatus = 'idle',
}: {
  nodo: StrategyNode
  isSelected: boolean
  onClick: () => void
  updateStatus?: NodeUpdateStatus
}) {
  const isPush      = nodo.tipo === 'push'
  const hasPerfiles = isLiquidExpr(nodo.subject) || isLiquidExpr(nodo.cuerpo)
  const preview     = subjectPreview(nodo.subject)
  const modificado  = nodo.modificado !== false
  const sinCambios  = nodo.modificado === false

  const badge = updateStatus === 'success'
    ? <span className="ml-auto text-[9px] text-emerald-400 font-semibold tracking-wide">✓ Listo</span>
    : (modificado && !sinCambios)
      ? <span className="ml-auto text-[9px] text-amber-400 font-semibold tracking-wide">● Cambios</span>
      : null

  return (
    <motion.div
      onClick={sinCambios ? undefined : onClick}
      animate={{
        boxShadow: isSelected
          ? '0 0 0 2px rgba(251,191,36,0.45), 0 4px 20px rgba(251,191,36,0.10)'
          : '0 0 0 0px transparent',
      }}
      transition={{ duration: 0.15 }}
      style={{ width: 280 }}
      className={`rounded-xl overflow-hidden border transition-colors duration-150 ${
        sinCambios
          ? 'border-neutral-800 bg-neutral-900/50 opacity-40 cursor-default'
          : isSelected
            ? 'border-amber-400/50 bg-neutral-900 cursor-pointer'
            : isPush
              ? 'border-sky-500/20 bg-neutral-900 hover:border-sky-500/40 cursor-pointer'
              : 'border-violet-500/20 bg-neutral-900 hover:border-violet-500/40 cursor-pointer'
      }`}
    >
      <div className={`px-3 py-1.5 flex items-center gap-2 ${
        sinCambios ? 'bg-neutral-800/30' : isPush ? 'bg-sky-500/8' : 'bg-violet-500/8'
      }`}>
        <span className="text-sm leading-none">{isPush ? '📱' : '✉️'}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
          sinCambios ? 'text-neutral-600' : isPush ? 'text-sky-400' : 'text-violet-400'
        }`}>
          {isPush ? 'Push' : 'Email'}
        </span>
        {badge}
        {!modificado && hasPerfiles && (
          <span className="ml-auto text-[9px] text-amber-400/55 font-medium">Por perfil</span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <div className={`text-xs font-semibold leading-tight truncate ${sinCambios ? 'text-neutral-600' : 'text-white'}`}>
          {nodo.nombre ?? `${isPush ? 'Push' : 'Email'} ${nodo.orden}`}
        </div>
        {sinCambios
          ? <div className="text-neutral-700 text-[10px] mt-0.5 italic">Sin cambio</div>
          : preview
            ? <div className="text-neutral-500 text-[11px] leading-tight truncate mt-0.5">{preview}</div>
            : null
        }
      </div>
    </motion.div>
  )
}

// ─── Strategy Loader ─────────────────────────────────────────────────────────



const LOADER_STEPS_PHASE1 = [
  'Leyendo la predicción del modelo y señales SHAP...',
  'Consultando el estado de tus campañas en Customer.io...',
  'Procesando noticias, contexto de mercado y la semana...',
  'Cruzando señales del modelo con el diagnóstico del funnel...',
  'Claude está escribiendo la estrategia...',
]

const LOADER_STEPS_PHASE2 = [
  'Cargando estructura y copies reales de cada campaña...',
  'Revisando cadencia, delays y cantidad de nodos...',
  'Comparando con el contexto de mercado de esta semana...',
  'Detectando oportunidades que el modelo no priorizó...',
  'Claude está construyendo las recomendaciones...',
]

function StrategyLoader({ awaitingMcp }: { awaitingMcp: boolean }) {
  const steps = awaitingMcp ? LOADER_STEPS_PHASE2 : LOADER_STEPS_PHASE1
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => Math.min(s + 1, steps.length - 1)), 5500)
    return () => clearInterval(id)
  }, [steps.length])

  // circumferences: r28 → 175.9 · r19 → 119.4 · r10 → 62.8
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-8 py-7 flex items-center gap-8">

      {/* Anillos concéntricos — estilo Apple/SpaceX */}
      <div className="shrink-0 relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
        {/* Tracks — guías casi invisibles */}
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="absolute inset-0">
          <circle cx="36" cy="36" r="28" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
          <circle cx="36" cy="36" r="19" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
          <circle cx="36" cy="36" r="10" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
        </svg>

        {/* Arco exterior — lento, CW */}
        <motion.svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="absolute inset-0"
          animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '36px 36px' }}>
          <circle cx="36" cy="36" r="28"
            stroke="rgba(251,191,36,0.55)" strokeWidth="1.1" strokeLinecap="round"
            strokeDasharray="66 110" />
        </motion.svg>

        {/* Arco medio — medio, CCW */}
        <motion.svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="absolute inset-0"
          animate={{ rotate: -360 }} transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '36px 36px' }}>
          <circle cx="36" cy="36" r="19"
            stroke="rgba(251,191,36,0.75)" strokeWidth="1.3" strokeLinecap="round"
            strokeDasharray="50 70" />
        </motion.svg>

        {/* Arco interior — rápido, CW */}
        <motion.svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="absolute inset-0"
          animate={{ rotate: 360 }} transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '36px 36px' }}>
          <circle cx="36" cy="36" r="10"
            stroke="rgba(251,191,36,1)" strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray="22 41" />
        </motion.svg>

        {/* Punto central */}
        <motion.div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      {/* Texto — al lado derecho */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeStep}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-neutral-400 text-sm font-medium leading-snug"
          >
            {steps[activeStep]}
          </motion.p>
        </AnimatePresence>
        <p className="text-neutral-700 text-xs mt-1">
          {awaitingMcp ? 'Revisando cada campaña de forma independiente' : 'Integrando modelo, campañas, mercado y productos'}
        </p>
      </div>

    </div>
  )
}

function CampaignFlowCanvas({
  nodos,
  nodosPropuesta,
  trigger,
  goal,
  edits,
  onNodeEdit,
  selectedOrden,
  onSelect,
  nodeUpdateStatus = {},
  onUpdateNode,
}: {
  nodos: StrategyNode[]
  nodosPropuesta: StrategyNode[]
  trigger: string
  goal: string
  edits: ActionEdit
  onNodeEdit: (nodeOrden: number, copies: NodeCopies) => void
  selectedOrden: number | null
  onSelect: (orden: number | null) => void
  nodeUpdateStatus?: Record<number, NodeUpdateStatus>
  onUpdateNode?: (nodo: StrategyNode, copies: NodeCopies) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.88)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef({ active: false, hasDragged: false, startX: 0, startY: 0, panX: 0, panY: 0 })

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-no-drag]') || target.tagName === 'TEXTAREA') return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      setZoom(z => Math.min(1.8, Math.max(0.28, z * factor)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Para el delay label y para el botón: buscar en todos los nodos (tiene id_nodo_cio, template_id)
  const selectedDisplayNodo = nodos.find(n => n.orden === selectedOrden) ?? null
  // Para el panel de edición: match por id_nodo_cio o nombre — el "orden" del propuesta no coincide
  // necesariamente con el orden de traversal del journey (msg_count en _build_nodos_completos)
  const selectedEditNodo = selectedDisplayNodo
    ? (nodosPropuesta.find(n =>
        selectedDisplayNodo.id_nodo_cio != null && n.id_nodo_cio === selectedDisplayNodo.id_nodo_cio
      ) ?? nodosPropuesta.find(n =>
        !!n.nombre && n.nombre === selectedDisplayNodo.nombre
      ) ?? null)
    : null

  // Copies resueltos para el botón de actualizar (edits del usuario si editó, sino el propuesto)
  const panelCopies: NodeCopies | null = selectedEditNodo
    ? (edits.nodeEdits[selectedEditNodo.orden] ?? {
        subject:   toLiquid(selectedEditNodo.subject   as Parameters<typeof toLiquid>[0]),
        preheader: selectedEditNodo.preheader
          ? toLiquid(selectedEditNodo.preheader as Parameters<typeof toLiquid>[0])
          : undefined,
        cuerpo:    toLiquid(selectedEditNodo.cuerpo    as Parameters<typeof toLiquid>[0]),
      })
    : null

  const panelCanUpdate = selectedDisplayNodo != null
    && selectedDisplayNodo.modificado !== false
    && selectedDisplayNodo.id_nodo_cio != null
    && selectedDisplayNodo.template_id != null

  const panelUpdateStatus: NodeUpdateStatus = selectedDisplayNodo
    ? (nodeUpdateStatus[selectedDisplayNodo.orden] ?? 'idle')
    : 'idle'

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    dragState.current = { active: true, hasDragged: false, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current.active) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.hasDragged = true
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy })
  }

  function onPointerUp() {
    dragState.current.active = false
    setDragging(false)
  }

  const delayLabel = selectedDisplayNodo
    ? selectedDisplayNodo.orden === 1
      ? 'Al entrar al journey'
      : selectedDisplayNodo.delay_desde_anterior_horas < 24
        ? `+${selectedDisplayNodo.delay_desde_anterior_horas}h desde el anterior`
        : `+${Math.round(selectedDisplayNodo.delay_desde_anterior_horas / 24)} día${Math.round(selectedDisplayNodo.delay_desde_anterior_horas / 24) !== 1 ? 's' : ''} desde el anterior`
    : ''

  return (
    <div
      ref={canvasRef}
      className="relative rounded-xl overflow-hidden border border-neutral-800 select-none"
      style={{
        background: '#0a0a0a',
        height: 'clamp(520px, 60vh, 660px)',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1f1f1f 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Pannable + zoomable canvas */}
      <div
        className="absolute inset-0 flex items-start justify-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y + 28}px) scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="flex flex-col items-center pb-10">
          <FlowTriggerNode label={trigger} />
          {nodos.map((nodo, i) => {
            // Resuelve el copy a enviar: edits del usuario si editó, sino el propuesto por Claude
            // Match por id_nodo_cio o nombre — el orden del propuesta puede diferir del journey
            const editNodo = nodosPropuesta.find(n =>
              nodo.id_nodo_cio != null && n.id_nodo_cio === nodo.id_nodo_cio
            ) ?? nodosPropuesta.find(n => !!n.nombre && n.nombre === nodo.nombre)
            const resolvedCopies: NodeCopies = editNodo
              ? (edits.nodeEdits[editNodo.orden] ?? {
                  subject:   toLiquid(editNodo.subject   as Parameters<typeof toLiquid>[0]),
                  preheader: editNodo.preheader
                    ? toLiquid(editNodo.preheader as Parameters<typeof toLiquid>[0])
                    : undefined,
                  cuerpo:    toLiquid(editNodo.cuerpo    as Parameters<typeof toLiquid>[0]),
                })
              : { subject: nodo.subject || '', cuerpo: nodo.cuerpo || '' }

            return (
              <div key={nodo.nombre ?? nodo.orden} className="flex flex-col items-center">
                <FlowConnector label={fmtDelay(nodo.delay_desde_anterior_horas, i === 0)} />
                <FlowMessageNode
                  nodo={nodo}
                  isSelected={nodo.orden === selectedOrden}
                  onClick={() => {
                    if (!dragState.current.hasDragged && nodo.modificado !== false)
                      onSelect(nodo.orden === selectedOrden ? null : nodo.orden)
                  }}
                  updateStatus={nodeUpdateStatus[nodo.orden] ?? 'idle'}
                />
              </div>
            )
          })}
          <FlowConnector label="" />
          <FlowGoalNode label={goal} />
        </div>
      </div>

      {/* Panel de edición — desliza desde la derecha dentro del canvas */}
      <AnimatePresence>
        {selectedEditNodo && (
          <motion.div
            key={selectedEditNodo.orden}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            data-no-drag
            onPointerDown={e => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 z-20 flex flex-col border-l border-neutral-800"
            style={{
              width: selectedEditNodo.tipo === 'email'
                ? 'clamp(500px, 72%, 640px)'
                : 'clamp(420px, 62%, 520px)',
              background: 'rgba(10,10,10,0.97)',
            }}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b border-neutral-800 flex items-center gap-3 shrink-0 ${
              selectedEditNodo.tipo === 'push' ? 'bg-sky-500/8' : 'bg-violet-500/8'
            }`}>
              <span className="text-base leading-none shrink-0">
                {selectedEditNodo.tipo === 'push' ? '📱' : '✉️'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">
                  {selectedEditNodo.nombre ?? `${selectedEditNodo.tipo === 'push' ? 'Push' : 'Email'} ${selectedEditNodo.orden}`}
                </div>
                {(() => {
                  const vals = panelCopies ? [panelCopies.subject, panelCopies.preheader, panelCopies.cuerpo].join(' ') : ''
                  const hasWsc = vals.includes('{%-') || vals.includes('-%}')
                  return hasWsc
                    ? <span className="text-red-400 text-[10px] font-medium">⚠ Expresiones con guión detectadas — se limpian al guardar</span>
                    : <span className="text-neutral-600 text-[10px]">{delayLabel}</span>
                })()}
              </div>
              <button
                data-no-drag
                onClick={() => onSelect(null)}
                className="shrink-0 w-6 h-6 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center justify-center text-base leading-none"
              >
                ×
              </button>
            </div>

            {/* Editor scrollable */}
            <div className="kepler-scroll flex-1 overflow-y-auto p-4">
              <NodeLiquidEditor
                nodo={selectedEditNodo}
                copies={
                  edits.nodeEdits[selectedEditNodo.orden] ?? {
                    subject:   toLiquid(selectedEditNodo.subject as Parameters<typeof toLiquid>[0]),
                    preheader: selectedEditNodo.preheader
                      ? toLiquid(selectedEditNodo.preheader as Parameters<typeof toLiquid>[0])
                      : undefined,
                    cuerpo:    toLiquid(selectedEditNodo.cuerpo as Parameters<typeof toLiquid>[0]),
                  }
                }
                onChange={c => onNodeEdit(selectedEditNodo.orden, c)}
              />
            </div>

            {/* Botón actualizar — fijo al fondo del panel */}
            {panelCanUpdate && (
              <div className="shrink-0 px-4 py-3 border-t border-neutral-800" data-no-drag>
                {panelUpdateStatus === 'success' ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    ✓ Actualizado en CIO
                  </div>
                ) : (
                  <button
                    data-no-drag
                    onClick={() => {
                      if (selectedDisplayNodo && panelCopies)
                        onUpdateNode?.(selectedDisplayNodo, panelCopies)
                    }}
                    disabled={panelUpdateStatus === 'loading'}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors border ${
                      panelUpdateStatus === 'loading'
                        ? 'bg-amber-500/10 text-amber-400/40 border-amber-500/10 cursor-not-allowed'
                        : panelUpdateStatus === 'error'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    {panelUpdateStatus === 'loading' && (
                      <span className="w-3 h-3 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                    )}
                    {panelUpdateStatus === 'loading'
                      ? 'Actualizando...'
                      : panelUpdateStatus === 'error'
                        ? '✗ Error — reintentar'
                        : 'Actualizar en CIO'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StrategyCanvasCard({
  action,
  actionIndex,
  edits,
  onToggle,
  onNodeEdit,
  isOwnCampaign = false,
  assignedTo = null,
}: {
  action: StrategyAction
  actionIndex: number
  edits: ActionEdit
  onToggle: () => void
  onNodeEdit: (nodeOrden: number, copies: NodeCopies) => void
  isOwnCampaign?: boolean
  assignedTo?: string | null
}) {
  const [selectedNodeOrden, setSelectedNodeOrden] = useState<number | null>(null)
  const [razonExpanded, setRazonExpanded] = useState(false)
  const [nodeUpdateStatus, setNodeUpdateStatus] = useState<Record<number, NodeUpdateStatus>>({})

  async function handleUpdateNode(nodo: StrategyNode, copies: NodeCopies) {
    if (!nodo.id_nodo_cio || !nodo.template_id) return
    const orden = nodo.orden
    setNodeUpdateStatus(prev => ({ ...prev, [orden]: 'loading' }))
    try {
      await api.updateNode({
        action_id:   nodo.id_nodo_cio,
        template_id: nodo.template_id,
        subject:     copies.subject,
        cuerpo:      copies.cuerpo,
        preheader:   copies.preheader,
      })
      setNodeUpdateStatus(prev => ({ ...prev, [orden]: 'success' }))
    } catch (err) {
      console.error('[Kepler] Error actualizando nodo', nodo.id_nodo_cio, err)
      setNodeUpdateStatus(prev => ({ ...prev, [orden]: 'error' }))
    }
  }
  const tipo    = TIPO_CFG[action.tipo_accion]
  const isAlta  = action.prioridad === 'alta'
  const { included } = edits

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden transition-opacity duration-200 ${
      included
        ? isAlta ? 'border-red-500/25' : 'border-amber-500/20'
        : 'border-neutral-800 opacity-40'
    }`}>
      {/* Header */}
      <div className={`px-5 py-2.5 flex items-center justify-between gap-3 border-b ${
        included
          ? isAlta ? 'bg-red-500/5 border-red-500/15' : 'bg-amber-500/5 border-amber-500/10'
          : 'bg-neutral-800/30 border-neutral-800'
      }`}>
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggle}
            title={included ? 'Descartar esta acción' : 'Incluir esta acción'}
            className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
              included
                ? 'bg-amber-500 border-amber-500 shadow-sm shadow-amber-500/30'
                : 'bg-transparent border-neutral-600 hover:border-neutral-400'
            }`}
          >
            {included && <span className="text-neutral-950 text-[10px] font-bold leading-none">✓</span>}
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              included
                ? isAlta
                  ? 'bg-red-500/15 text-red-400 border-red-500/25'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                : 'bg-neutral-800 text-neutral-600 border-neutral-700'
            }`}>
              {action.prioridad.toUpperCase()}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tipo.cls}`}>
              {tipo.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {assignedTo && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
              {assignedTo}
            </span>
          )}
          {action.shap_contribucion != null && (
            <span className={`text-sm font-semibold tabular-nums ${action.shap_contribucion >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {action.shap_contribucion >= 0 ? '+' : ''}{action.shap_contribucion.toFixed(0)} dep.
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h3 className="text-white font-semibold">{action.campaña_existente_nombre ?? action.step_name}</h3>
          {isOwnCampaign && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 shrink-0">
              Tu campaña
            </span>
          )}
        </div>

        {/* Razón */}
        <div className="mb-4">
          <div className={`text-neutral-400 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${razonExpanded ? '' : 'line-clamp-2'}`}>
            {action.razon}
          </div>
          <button
            onClick={() => setRazonExpanded(e => !e)}
            className="mt-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            {razonExpanded ? 'Ver menos ↑' : 'Ver más ↓'}
          </button>
        </div>

        {/* Cambios de estructura — visible cuando Claude detecta problema estructural */}
        {action.propuesta.cambios_estructura?.descripcion && (
          <div className="bg-blue-500/6 border border-blue-500/20 rounded-lg p-3.5 mb-4">
            <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold mb-2">
              Cambios de estructura recomendados
            </p>
            <p className="text-blue-200 text-xs leading-relaxed mb-2">
              {action.propuesta.cambios_estructura.descripcion}
            </p>
            {action.propuesta.cambios_estructura.delays_propuestos && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {action.propuesta.cambios_estructura.delays_propuestos.map(d => (
                  <span key={d.nodo} className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Nodo {d.nodo}: +{d.delay_horas}h
                  </span>
                ))}
              </div>
            )}
            {action.propuesta.cambios_estructura.secuencia_canales && (
              <p className="text-blue-400/60 text-[10px] mt-2 font-mono">
                Secuencia propuesta: {action.propuesta.cambios_estructura.secuencia_canales}
              </p>
            )}
            {action.propuesta.cambios_estructura.nodos_adicionales && (
              <p className="text-blue-400/60 text-xs mt-1">
                Nodos adicionales: {action.propuesta.cambios_estructura.nodos_adicionales}
              </p>
            )}
          </div>
        )}

        {/* alerta_gap — no hay nodos que editar */}
        {action.tipo_accion === 'alerta_gap' ? (
          <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-center">
            <p className="text-neutral-500 text-xs">Sin campaña activa en este paso</p>
            <p className="text-neutral-600 text-[10px] mt-1">
              Creá la campaña en CIO con el trigger/goal indicados, o usá la herramienta Crear Campaña.
            </p>
          </div>
        ) : (action.nodos_completos ?? action.propuesta.nodos ?? []).length > 0 ? (
          <CampaignFlowCanvas
            nodos={action.nodos_completos ?? action.propuesta.nodos ?? []}
            nodosPropuesta={action.propuesta.nodos ?? []}
            trigger={action.propuesta.trigger_event}
            goal={action.propuesta.conversion_event}
            edits={edits}
            onNodeEdit={onNodeEdit}
            selectedOrden={selectedNodeOrden}
            onSelect={setSelectedNodeOrden}
            nodeUpdateStatus={nodeUpdateStatus}
            onUpdateNode={handleUpdateNode}
          />
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-neutral-500 min-w-[80px] shrink-0">{label}</span>
      <span className="flex-1 min-w-0">{value}</span>
    </div>
  )
}


// ─── Estado Funnel Badge ──────────────────────────────────────────────────────

const ESTADO_CFG = {
  estable:          { label: 'Estable',           cls: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' },
  anomalia_leve:    { label: 'Anomalía leve',     cls: 'bg-amber-500/12 text-amber-400 border-amber-500/25' },
  anomalia_critica: { label: 'Anomalía crítica',  cls: 'bg-red-500/12 text-red-400 border-red-500/25' },
}

const KPI_CFG = {
  positivo:   'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  alerta:     'bg-red-500/10     text-red-400     border-red-500/20',
  neutro:     'bg-neutral-800   text-neutral-300  border-neutral-700',
  oportunidad:'bg-amber-500/10  text-amber-300    border-amber-500/20',
} as const

// ─── System Context Panel ─────────────────────────────────────────────────────

type SysTab = 'funnel' | 'eventos' | 'atributos' | 'campañas' | 'kb'

const SYS_TABS: { id: SysTab; label: string; countKey: keyof SystemContext }[] = [
  { id: 'funnel',    label: 'Pasos del Funnel', countKey: 'funnel_steps' },
  { id: 'eventos',   label: 'Eventos CIO',       countKey: 'events' },
  { id: 'atributos', label: 'Atributos CIO',     countKey: 'attributes' },
  { id: 'campañas',  label: 'Campañas Caché',    countKey: 'campaigns_cache' },
  { id: 'kb',        label: 'Knowledge Base',    countKey: 'knowledge_base' },
]

const ROLE_CFG: Record<string, string> = {
  trigger: 'bg-sky-500/12 text-sky-400 border-sky-500/25',
  goal:    'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  signal:  'bg-purple-500/12 text-purple-400 border-purple-500/25',
  both:    'bg-amber-500/12 text-amber-400 border-amber-500/25',
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs text-neutral-500 font-medium uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  )
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-3 py-2.5 text-xs border-t border-neutral-800/60 ${mono ? 'font-mono text-neutral-300' : 'text-neutral-400'}`}>
      {children}
    </td>
  )
}

function FunnelStepsTable({ rows }: { rows: FunnelStepRaw[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-neutral-800/40">
          <tr><Th>#</Th><Th>Código</Th><Th>Nombre</Th><Th>Entry event</Th><Th>Exit event</Th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.step_code} className="hover:bg-neutral-800/30 transition-colors">
              <Td><span className="text-neutral-600">{r.step_order}</span></Td>
              <Td mono>{r.step_code}</Td>
              <Td>{r.step_name}</Td>
              <Td mono>{r.entry_event ?? <span className="text-neutral-700">—</span>}</Td>
              <Td mono>{r.exit_event  ?? <span className="text-neutral-700">—</span>}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventsTable({ rows }: { rows: CioEvent[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-neutral-800/40">
          <tr><Th>Activo</Th><Th>Nombre</Th><Th>Rol</Th><Th>Paso</Th><Th>Descripción</Th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name + i} className="hover:bg-neutral-800/30 transition-colors">
              <Td>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${r.active ? 'bg-emerald-400' : 'bg-neutral-700'}`} />
              </Td>
              <Td mono>{r.name}</Td>
              <Td>
                {r.event_role ? (
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${ROLE_CFG[r.event_role] ?? 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                    {r.event_role}
                  </span>
                ) : <span className="text-neutral-700">—</span>}
              </Td>
              <Td mono>{r.funnel_step_code ?? <span className="text-neutral-700">—</span>}</Td>
              <Td>{r.description ?? <span className="text-neutral-700">—</span>}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AttributesTable({ rows }: { rows: CioAttribute[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-neutral-800/40">
          <tr><Th>Activo</Th><Th>Nombre</Th><Th>Descripción</Th><Th>Valores posibles</Th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name + i} className="hover:bg-neutral-800/30 transition-colors">
              <Td>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${r.active ? 'bg-emerald-400' : 'bg-neutral-700'}`} />
              </Td>
              <Td mono>{r.name}</Td>
              <Td>{r.description ?? <span className="text-neutral-700">—</span>}</Td>
              <Td>
                {r.possible_values ? (
                  <span className="text-neutral-500 italic">{r.possible_values}</span>
                ) : <span className="text-neutral-700">—</span>}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CampaignsTable({ rows }: { rows: CampaignCacheRaw[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-neutral-800/40">
          <tr>
            <Th>ID</Th><Th>Nombre</Th><Th>Status</Th><Th>Paso</Th>
            <Th>Trigger</Th><Th>Goal</Th>
            <Th>Entrega</Th><Th>Apertura</Th><Th>CR</Th>
            <Th>Enviados</Th><Th>Spike</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const dr = r.delivery_rate
            const or_ = r.open_rate
            const cr = r.conversion_rate
            const drCls = dr >= 0.7 ? 'text-emerald-400' : dr >= 0.5 ? 'text-amber-400' : 'text-red-400'
            const orCls = or_ >= 0.08 ? 'text-emerald-400' : or_ >= 0.04 ? 'text-amber-400' : 'text-neutral-500'
            const crCls = cr >= 0.07 ? 'text-emerald-400' : cr >= 0.02 ? 'text-amber-400' : 'text-red-400'
            return (
              <tr key={r.cio_campaign_id} className="hover:bg-neutral-800/30 transition-colors">
                <Td mono>{r.cio_campaign_id}</Td>
                <Td><span className="max-w-[180px] truncate block" title={r.name}>{r.name}</span></Td>
                <Td>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    r.status === 'running' ? 'bg-emerald-500/12 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {r.status ?? '—'}
                  </span>
                </Td>
                <Td mono>{r.funnel_step_mapped ?? <span className="text-neutral-700">—</span>}</Td>
                <Td mono>{r.trigger_event ?? <span className="text-neutral-700">—</span>}</Td>
                <Td mono>{r.goal_event    ?? <span className="text-neutral-700">—</span>}</Td>
                <Td><span className={`tabular-nums ${drCls}`}>{(dr * 100).toFixed(0)}%</span></Td>
                <Td><span className={`tabular-nums ${orCls}`}>{(or_ * 100).toFixed(0)}%</span></Td>
                <Td><span className={`tabular-nums font-medium ${crCls}`}>{(cr * 100).toFixed(1)}%</span></Td>
                <Td><span className="tabular-nums text-neutral-500">{r.total_sent.toLocaleString('es-CO')}</span></Td>
                <Td>
                  {r.spike_alert
                    ? <span className="text-orange-400 font-medium">⚠ spike</span>
                    : <span className="text-neutral-700">—</span>}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KnowledgeBaseList({ rows }: { rows: KnowledgeBaseEntry[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const byTipo = rows.reduce<Record<string, KnowledgeBaseEntry[]>>((acc, r) => {
    ;(acc[r.tipo] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="space-y-4 p-1">
      {Object.entries(byTipo).map(([tipo, entries]) => (
        <div key={tipo}>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2 px-2">{tipo}</p>
          <div className="space-y-1">
            {entries.map((e, i) => {
              const globalIdx = rows.indexOf(e)
              const isOpen = openIdx === globalIdx
              return (
                <div key={i} className="bg-neutral-800/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : globalIdx)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.activo ? 'bg-emerald-400' : 'bg-neutral-700'}`} />
                      <span className="text-xs text-neutral-300 font-medium">{e.titulo}</span>
                    </div>
                    <span className={`text-[10px] text-neutral-600 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 pt-0">
                      <p className="text-xs text-neutral-500 leading-relaxed whitespace-pre-wrap">{e.contenido}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function SystemContextPanel({ ctx }: { ctx: SystemContext }) {
  const [tab, setTab] = useState<SysTab>('funnel')

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-0 border-b border-neutral-800 overflow-x-auto">
        {SYS_TABS.map(t => {
          const count = (ctx[t.countKey] as unknown[]).length
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                active ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="max-h-[420px] overflow-auto">
        {tab === 'funnel'    && <FunnelStepsTable rows={ctx.funnel_steps} />}
        {tab === 'eventos'   && <EventsTable      rows={ctx.events} />}
        {tab === 'atributos' && <AttributesTable  rows={ctx.attributes} />}
        {tab === 'campañas'  && <CampaignsTable   rows={ctx.campaigns_cache} />}
        {tab === 'kb'        && <KnowledgeBaseList rows={ctx.knowledge_base} />}
      </div>

      <div className="border-t border-neutral-800 px-4 py-2 flex items-center gap-4 bg-neutral-900/50">
        <span className="text-[10px] text-neutral-600 tabular-nums">
          {ctx.funnel_steps.length} pasos · {ctx.events.length} eventos · {ctx.attributes.length} atributos · {ctx.campaigns_cache.length} campañas · {ctx.knowledge_base.length} entradas KB
        </span>
        <span className="text-[10px] text-neutral-700">Estos son los datos que Claude recibe al generar la estrategia</span>
      </div>
    </div>
  )
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function initEdits(s: StrategyResult): Record<number, ActionEdit> {
  const edits: Record<number, ActionEdit> = {}
  s.acciones.forEach((a, i) => {
    const nodeEdits: Record<number, NodeCopies> = {}
    ;(a.propuesta.nodos ?? []).forEach(n => {
      nodeEdits[n.orden] = {
        subject:   toLiquid(n.subject as Parameters<typeof toLiquid>[0]),
        preheader: n.preheader ? toLiquid(n.preheader as Parameters<typeof toLiquid>[0]) : undefined,
        cuerpo:    toLiquid(n.cuerpo as Parameters<typeof toLiquid>[0]),
      }
    })
    edits[i] = { included: true, nodeEdits }
  })
  return edits
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EstrategiaPage() {
  const [health, setHealth]               = useState<FunnelStep[] | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [safety, setSafety]               = useState<SafetyStatus | null>(null)
  const [syncing, setSyncing]             = useState(false)
  const [syncResult, setSyncResult]       = useState<SyncResult | null>(null)
  const [generating, setGenerating]       = useState(false)
  const [contextoAdicional, setContextoAdicional] = useState('')
  const [strategy, setStrategy]           = useState<StrategyResult | null>(null)
  const [actionEdits, setActionEdits]     = useState<Record<number, ActionEdit>>({})
  const [resumenExpanded, setResumenExpanded] = useState(false)
  const [structuralResumenExpanded, setStructuralResumenExpanded] = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [genError, setGenError]           = useState<string | null>(null)
  const [sysCtx, setSysCtx]               = useState<SystemContext | null>(null)
  const [sysLoading, setSysLoading]       = useState(false)
  const [sysOpen, setSysOpen]             = useState(false)
  const [sysError, setSysError]           = useState<string | null>(null)
  // ── Fase 2B: optimización estructural ──────────────────────────────────────
  const [structuralResult, setStructuralResult]       = useState<StrategyResult | null>(null)
  const [structuralGenerating, setStructuralGenerating] = useState(false)
  const [structuralError, setStructuralError]         = useState<string | null>(null)
  const [structuralEdits, setStructuralEdits]         = useState<Record<number, ActionEdit>>({})
  const [latestPredLabel, setLatestPredLabel]         = useState<string | null>(null)

  // ── Sesión y asignaciones ───────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{ name: string; role: 'admin' | 'agent'; campaign?: string } | null>(null)
  const [userCampaign, setUserCampaign]     = useState<string | null>(null)
  // Mapa campaña→persona para el badge de admin (ej: { "Fotos KYC": "Felipe" })
  const [campaignOwnerMap, setCampaignOwnerMap] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(u => { if (u) setCurrentUser(u) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return

    if (currentUser.role === 'admin') {
      // Admin con campaña propia (ej: Juanita)
      setUserCampaign(currentUser.campaign ?? null)
      // Cargar todas las asignaciones para mostrar badge en cada card
      api.getAssignments()
        .then(rows => {
          const map: Record<string, string> = {}
          rows.forEach(r => { map[r.campaign_name] = r.user_name })
          setCampaignOwnerMap(map)
        })
        .catch(() => {})
      return
    }

    // Agente: obtener su campaña asignada desde el backend
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/strategy/assignment?user_name=${currentUser.name}`)
      .then(r => r.json())
      .then(d => setUserCampaign(d.campaign ?? null))
      .catch(() => {})
  }, [currentUser])

  const isAgent = currentUser?.role === 'agent'

  // Filtra acciones: admin ve todo, agente solo su campaña
  function filterAcciones(acciones: StrategyAction[]): StrategyAction[] {
    if (!isAgent) return acciones
    if (!userCampaign) return []
    return acciones.filter(a => matchesCampaign(a, userCampaign))
  }

  function matchesCampaign(action: StrategyAction, campaign: string): boolean {
    const c = campaign.toLowerCase()
    return (
      (action.step_name ?? '').toLowerCase().includes(c) ||
      (action.campaña_existente_nombre ?? '').toLowerCase().includes(c)
    )
  }

  // Badge: true si esta acción es la campaña propia del usuario
  function isOwnCampaign(action: StrategyAction): boolean {
    if (!userCampaign) return false
    return matchesCampaign(action, userCampaign)
  }

  // Badge: nombre del dueño de esta campaña (para admin)
  function getCampaignOwner(action: StrategyAction): string | null {
    for (const [campName, ownerName] of Object.entries(campaignOwnerMap)) {
      if (matchesCampaign(action, campName)) return ownerName
    }
    return null
  }

  // Visibilidad de secciones para agentes
  const agentHasMode1 = isAgent && !!strategy && filterAcciones(strategy.acciones).length > 0
  const agentHasMode2 = isAgent && !!structuralResult && filterAcciones(structuralResult.acciones).length > 0
  const showMode1Section = !isAgent || agentHasMode1
  const showMode2Section = !isAgent || (agentHasMode2 && !agentHasMode1)

  useEffect(() => {
    // Signal 1: localStorage flag set explicitly by ingresar page after nueva proyección
    const flagReset = localStorage.getItem('kepler-projection-reset') === '1'
    if (flagReset) localStorage.removeItem('kepler-projection-reset')

    api.getSafetyStatus().then(setSafety).catch(() => {})

    Promise.all([
      api.getStrategyHistory().catch((): StrategyResult[] => []),
      api.getUltimaSemana().catch((): Record<string, unknown> => ({})),
      api.latestPrediction().catch((): Record<string, unknown> => ({})),
    ]).then(([histData, ultimaSemana, latestPred]) => {
      // Signal 2: ultima_semana is empty → nueva proyección ran, new week not filled yet
      const ultimaWeek = ultimaSemana['semana'] as string | undefined

      // Signal 3: semana_label of latest prediction differs from semana_label of latest strategy
      // (semana_label = the predicted week, e.g. "25 al 31 de mayo 2026")
      // Both come from the same prediction → if they differ, the strategy is from a past cycle
      const latestStrat = histData[0] ?? null
      const predLabel  = latestPred['semana_label'] as string | undefined
      const stratLabel = latestStrat?.semana_label ?? null
      const stratIsStale = !!(predLabel && stratLabel && predLabel !== stratLabel)

      if (predLabel) setLatestPredLabel(predLabel)

      if (flagReset || !ultimaWeek || stratIsStale) {
        // New projection cycle — start completely fresh
        setHealthLoading(false)
        return
      }

      if (latestStrat) {
        setStrategy(latestStrat)
        setActionEdits(initEdits(latestStrat))
      }

      api.getLatestStructural()
        .then(r => {
          // Solo usar si corresponde a la misma semana que la estrategia Modo 1
          if (latestStrat?.semana_label && r.semana_label && r.semana_label === latestStrat.semana_label) {
            setStructuralResult(r)
            setStructuralEdits(initEdits(r))
          }
        })
        .catch(() => {})

      api.getFunnelHealth().then(setHealth).catch(() => setHealth([])).finally(() => setHealthLoading(false))
    }).catch(() => setHealthLoading(false))
  }, [])

  async function handleLoadSysCtx() {
    if (sysCtx && sysOpen) { setSysOpen(false); return }
    setSysOpen(true)
    if (sysCtx) return
    setSysLoading(true)
    setSysError(null)
    try {
      setSysCtx(await api.getSystemContext())
    } catch (e) {
      setSysError(e instanceof Error ? e.message : 'Error al cargar contexto')
    } finally {
      setSysLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)
    setSyncResult(null)
    try {
      const r = await api.syncCampaigns()
      setSyncResult(r)
      setHealth(await api.getFunnelHealth())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  async function handleStartAnalysis() {
    setGenerating(true)
    setGenError(null)
    setStrategy(null)
    setStructuralResult(null)
    setStructuralEdits({})
    setStructuralError(null)
    try {
      const s = await api.generateStrategy(contextoAdicional.trim() || undefined)
      setStrategy(s)
      setActionEdits(initEdits(s))
      setResumenExpanded(false)
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Error al generar estrategia')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateStructural() {
    if (!strategy) return
    setStructuralGenerating(true)
    setStructuralError(null)
    setStructuralResult(null)
    try {
      const r = await api.generateStructural(strategy, contextoAdicional.trim() || undefined)
      setStructuralResult(r)
      setStructuralEdits(initEdits(r))
    } catch (e) {
      setStructuralError(e instanceof Error ? e.message : 'Error al analizar')
    } finally {
      setStructuralGenerating(false)
    }
  }

  function toggleAction(i: number) {
    setActionEdits(prev => ({
      ...prev,
      [i]: { ...prev[i], included: !(prev[i]?.included ?? true) },
    }))
  }

  function editNode(actionIdx: number, nodeOrden: number, copies: NodeCopies) {
    setActionEdits(prev => ({
      ...prev,
      [actionIdx]: {
        ...prev[actionIdx],
        nodeEdits: { ...prev[actionIdx]?.nodeEdits, [nodeOrden]: copies },
      },
    }))
  }

  const { campaignViews, trueGaps } = health ? buildCampaignViews(health) : { campaignViews: [], trueGaps: [] }
  const actionsCount = (strategy?.acciones ?? []).length

  return (
    <div className="flex-1 overflow-auto bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">Estrategia Semanal</h1>
            <p className="text-neutral-500 text-sm mt-1">
              {strategy?.semana_label
                ? `Semana ${strategy.semana_label}`
                : latestPredLabel
                ? `Proyección semana ${latestPredLabel} · sin estrategia generada`
                : 'Diagnóstico Customer.io · Generación con Claude'}
            </p>
          </div>

          {!isAgent && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 rounded-lg transition-colors disabled:opacity-40 shrink-0"
            >
              {syncing ? (
                <>
                  <span className="w-3.5 h-3.5 border border-neutral-400 border-t-transparent rounded-full animate-spin" />
                  Corriendo diagnóstico…
                </>
              ) : '↻ Correr diagnóstico'}
            </button>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        {syncResult && (
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-400 flex items-center justify-between">
            <span>
              ✓ Diagnóstico actualizado — {syncResult.total_synced} campañas cargadas · {syncResult.mapped_to_funnel} mapeadas al funnel
              {syncResult.unmapped > 0 && ` · ${syncResult.unmapped} sin mapear al funnel`}
            </span>
            {syncResult.spike_alerts.length > 0 && (
              <span className="text-orange-400 text-xs">⚠ {syncResult.spike_alerts.length} spike(s)</span>
            )}
          </div>
        )}

        {/* ── Funnel Diagnostic ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-lg">Diagnóstico del Funnel</h2>
              {!healthLoading && health && (
                <p className="text-neutral-500 text-xs mt-0.5">
                  {campaignViews.length} campañas activas · {trueGaps.length} pasos sin cobertura
                </p>
              )}
            </div>
          </div>

          {healthLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          ) : health && health.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campaignViews.map(v => <CampaignDiagnosticCard key={v.cid} view={v} />)}
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <p className="text-neutral-400 mb-1">No hay datos del diagnóstico todavía</p>
              <p className="text-neutral-600 text-sm">Hacé clic en "Correr diagnóstico" para cargar el estado de tus campañas</p>
            </div>
          )}
        </section>

        {/* ── Strategy Generation ───────────────────────────────────────────── */}
        <section>
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Estrategia semanal</h2>
          </div>

          {/* ── Paso 1: formulario inicial ── */}
          {!strategy && !generating && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 border border-neutral-700">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-amber-400">
                    <path d="M9 2C9 2 5 4 5 9C5 11.8 6.5 13.5 9 14C11.5 13.5 13 11.8 13 9C13 4 9 2 9 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                    <path d="M6 9C6 9 7 10.5 9 11C11 10.5 12 9 12 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M9 14V16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M7 16H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Genera la estrategia de esta semana</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    Cruza la predicción del modelo con tus campañas, noticias de la semana e iniciativas de trii para decidir qué optimizar y cómo.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-wider font-medium mb-2">
                  Noticias, iniciativas y contexto de esta semana
                </label>
                <textarea
                  value={contextoAdicional}
                  onChange={e => setContextoAdicional(e.target.value)}
                  rows={3}
                  placeholder={`Noticias, eventos, situaciones internas, competencia...\n\nEj: "Esta semana lanzamos la jornada sin comisiones el martes 13. TRM en máximos históricos."`}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3.5 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/40 hover:border-neutral-600 transition-colors leading-relaxed"
                />
                <p className="text-neutral-700 text-xs mt-1.5">
                  Tiene peso especial en el copy y en el análisis de la semana.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleStartAnalysis}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm rounded-lg transition-colors"
                >
                  Iniciar análisis
                </button>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {generating && <StrategyLoader awaitingMcp={false} />}

          {/* ── Error ── */}
          {genError && !generating && (
            <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4">
              <p className="text-red-400 text-sm font-medium mb-1">Error al generar</p>
              <p className="text-red-400/70 text-xs">{genError}</p>
              <button
                onClick={handleStartAnalysis}
                className="mt-3 text-xs text-red-400 underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {strategy && !generating && showMode1Section && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">

                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                  <h3 className="text-white font-semibold">Qué está pasando esta semana</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {strategy.estado_funnel && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${ESTADO_CFG[strategy.estado_funnel]?.cls}`}>
                        {ESTADO_CFG[strategy.estado_funnel]?.label}
                      </span>
                    )}
                    {actionsCount > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {actionsCount} acción{actionsCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* KPI chips — scan rápido */}
                {strategy.resumen_kpis && strategy.resumen_kpis.length > 0 && (
                  <div className="px-5 pb-3 flex flex-wrap gap-2">
                    {strategy.resumen_kpis.map((kpi, i) => (
                      <div
                        key={i}
                        className={`flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg border ${KPI_CFG[kpi.tipo]}`}
                      >
                        <span className="text-[10px] font-medium opacity-60 leading-none">{kpi.etiqueta}</span>
                        <span className="text-sm font-bold tabular-nums leading-none">{kpi.valor}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Separador */}
                <div className="mx-5 border-t border-neutral-800/60" />

                {/* Análisis completo — colapsable */}
                <div className="px-5 py-3">
                  <div className={`text-neutral-400 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${resumenExpanded ? '' : 'line-clamp-2'}`}>
                    {strategy.resumen}
                  </div>
                  <button
                    onClick={() => setResumenExpanded(e => !e)}
                    className="mt-2 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    {resumenExpanded ? 'Ver menos ↑' : 'Ver análisis completo ↓'}
                  </button>
                </div>

              </div>

              {/* Canvas: action cards with checkboxes + editable copies */}
              {strategy.acciones.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-neutral-400 text-sm font-medium">Acciones propuestas</p>
                    <div className="flex-1 h-px bg-neutral-800" />
                  </div>
                  {filterAcciones(strategy.acciones).map((action, i) => (
                    <StrategyCanvasCard
                      key={i}
                      action={action}
                      actionIndex={i}
                      edits={actionEdits[i] ?? { included: true, nodeEdits: {} }}
                      onToggle={() => toggleAction(i)}
                      onNodeEdit={(nodeOrden, copies) => editNode(i, nodeOrden, copies)}
                      isOwnCampaign={isOwnCampaign(action)}
                      assignedTo={getCampaignOwner(action)}
                    />
                  ))}
                </>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-center">
                  <p className="text-neutral-400 text-sm">✓ No hay acciones requeridas esta semana — el funnel está estable</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Fase 2B: Revisión de todas las campañas ────────────────────────── */}
        {strategy && !generating && showMode2Section && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-white font-semibold text-lg">Revisión del resto de campañas</h2>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            {/* Campañas ya cubiertas por el análisis principal */}
            {strategy.acciones.filter(a => a.campaña_existente_id).length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">
                  Ya cubiertas en el análisis principal — no se repiten acá
                </p>
                <div className="flex flex-wrap gap-2">
                  {strategy.acciones
                    .filter(a => a.campaña_existente_id)
                    .map(a => (
                      <span
                        key={a.campaña_existente_id}
                        className="text-[10px] bg-neutral-800 text-neutral-500 border border-neutral-700 px-2.5 py-1 rounded-full"
                      >
                        {a.campaña_existente_nombre ?? a.campaña_existente_id}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Formulario — muestra si no hay resultado O si el usuario quiere reanalizat */}
            {!structuralResult && !structuralGenerating && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-lg">🔍</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-0.5">Revisar campañas restantes</p>
                    <p className="text-neutral-500 text-xs leading-relaxed">
                      El sistema leerá automáticamente la estructura y contenido de las campañas
                      que no fueron intervenidas en el análisis principal.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-neutral-600">
                    <span>~30–60 seg</span>
                    <span>·</span>
                    <span>~$0.01 USD</span>
                    <span>·</span>
                    <span>Resultado guardado para la semana</span>
                  </div>
                  <button
                    onClick={handleGenerateStructural}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    Revisar campañas
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {structuralGenerating && <StrategyLoader awaitingMcp={true} />}

            {/* Error */}
            {structuralError && !structuralGenerating && (
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4">
                <p className="text-red-400 text-sm font-medium mb-1">Error al revisar</p>
                <p className="text-red-400/70 text-xs">{structuralError}</p>
                <button onClick={handleGenerateStructural} className="mt-3 text-xs text-red-400 underline">
                  Reintentar
                </button>
              </div>
            )}

            {/* Resultados */}
            {structuralResult && !structuralGenerating && (
              <div className="space-y-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">

                  {/* Header */}
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                    <h3 className="text-white font-semibold">Qué encontramos en el resto de campañas</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {structuralResult.estado_funnel && (
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${ESTADO_CFG[structuralResult.estado_funnel]?.cls}`}>
                          {ESTADO_CFG[structuralResult.estado_funnel]?.label}
                        </span>
                      )}
                      {structuralResult.acciones.length > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {structuralResult.acciones.length} mejora{structuralResult.acciones.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KPI chips */}
                  {structuralResult.resumen_kpis && structuralResult.resumen_kpis.length > 0 && (
                    <div className="px-5 pb-3 flex flex-wrap gap-2">
                      {structuralResult.resumen_kpis.map((kpi, i) => (
                        <div
                          key={i}
                          className={`flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg border ${KPI_CFG[kpi.tipo]}`}
                        >
                          <span className="text-[10px] font-medium opacity-60 leading-none">{kpi.etiqueta}</span>
                          <span className="text-sm font-bold tabular-nums leading-none">{kpi.valor}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Separador */}
                  <div className="mx-5 border-t border-neutral-800/60" />

                  {/* Análisis colapsable */}
                  <div className="px-5 py-3">
                    <div className={`text-neutral-400 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${structuralResumenExpanded ? '' : 'line-clamp-2'}`}>
                      {structuralResult.resumen}
                    </div>
                    <button
                      onClick={() => setStructuralResumenExpanded(e => !e)}
                      className="mt-2 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
                    >
                      {structuralResumenExpanded ? 'Ver menos ↑' : 'Ver análisis completo ↓'}
                    </button>
                  </div>

                </div>

                {structuralResult.acciones.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-neutral-400 text-sm font-medium">Campañas con oportunidad de mejora</p>
                      <div className="flex-1 h-px bg-neutral-800" />
                    </div>
                    {filterAcciones(structuralResult.acciones).map((action, i) => (
                      <StrategyCanvasCard
                        key={i}
                        action={action}
                        actionIndex={i}
                        edits={structuralEdits[i] ?? { included: true, nodeEdits: {} }}
                        onToggle={() => setStructuralEdits(prev => ({
                          ...prev,
                          [i]: { ...prev[i], included: !(prev[i]?.included ?? true) },
                        }))}
                        onNodeEdit={(nodeOrden, copies) => setStructuralEdits(prev => ({
                          ...prev,
                          [i]: {
                            ...prev[i],
                            nodeEdits: { ...(prev[i]?.nodeEdits ?? {}), [nodeOrden]: copies },
                          },
                        }))}
                        isOwnCampaign={isOwnCampaign(action)}
                        assignedTo={getCampaignOwner(action)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-center">
                    <p className="text-neutral-400 text-sm">
                      ✓ Todas las campañas revisadas están en buen estado — entrega, cadencia y copy correctos
                    </p>
                  </div>
                )}

              </div>
            )}
          </section>
        )}

        {/* ── Datos activos en el sistema ───────────────────────────────────── */}
        <section>
          <button
            onClick={handleLoadSysCtx}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 hover:bg-neutral-800/70 border border-neutral-800 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-neutral-500 text-sm">🔍</span>
              <div className="text-left">
                <p className="text-neutral-300 text-sm font-medium group-hover:text-white transition-colors">
                  Datos activos en el sistema
                </p>
                <p className="text-neutral-600 text-xs">
                  Pasos del funnel · Eventos CIO · Atributos · Campañas en caché · Knowledge Base
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sysCtx && (
                <span className="text-[10px] text-neutral-600 tabular-nums">
                  {sysCtx.funnel_steps.length} pasos · {sysCtx.events.length} eventos · {sysCtx.attributes.length} atrib · {sysCtx.campaigns_cache.length} camp · {sysCtx.knowledge_base.length} KB
                </span>
              )}
              <span className={`text-xs text-neutral-600 transition-transform duration-200 ${sysOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </button>

          {sysOpen && (
            <div className="mt-2">
              {sysLoading && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-neutral-500 text-sm">Cargando contexto del sistema…</span>
                </div>
              )}
              {sysError && !sysLoading && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4">
                  <p className="text-red-400 text-sm">{sysError}</p>
                  <button
                    onClick={() => { setSysCtx(null); setSysError(null); handleLoadSysCtx() }}
                    className="mt-2 text-xs text-red-400 underline"
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {sysCtx && !sysLoading && <SystemContextPanel ctx={sysCtx} />}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
