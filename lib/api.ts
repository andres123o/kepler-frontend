const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

// Cache en memoria — se resetea en cada navegación/recarga (comportamiento correcto).
// La fuente de verdad es kepler-session (httpOnly), leída por /api/session/funnel server-side.
let _headersCache: Record<string, string> | null = null

async function getFunnelHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {}
  if (_headersCache) return _headersCache
  try {
    const res = await fetch('/api/session/funnel')
    if (!res.ok) return {}
    const data = await res.json() as { org_slug: string; funnel_slug: string } | null
    if (data?.org_slug && data?.funnel_slug) {
      _headersCache = { 'X-Org-Slug': data.org_slug, 'X-Funnel-Slug': data.funnel_slug }
      return _headersCache
    }
  } catch { /* ignora */ }
  return {}
}

// Llamar tras switchFunnel() para que el siguiente request use el funnel nuevo.
export function clearFunnelHeadersCache(): void {
  _headersCache = null
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const funnelHeaders = await getFunnelHeaders()
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...funnelHeaders, ...options?.headers },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  // ── Fase 1: ML ──────────────────────────────────────────────────────────
  getUltimaSemana: () =>
    apiFetch<Record<string, unknown>>('/api/data/ultima-semana'),
  saveUltimaSemana: (data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>('/api/data/ultima-semana', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  nuevaProyeccion: () =>
    apiFetch<{ ok: boolean; semana_archivada: string }>('/api/data/nueva-proyeccion', {
      method: 'POST',
    }),
  predict: () => apiFetch<PredictionResult>('/api/ml/predict', { method: 'POST' }),
  latestPrediction: () => apiFetch<PredictionResult | Record<string, never>>('/api/ml/latest-prediction'),
  predictionHistory: () => apiFetch<PredictionResult[]>('/api/ml/prediction-history'),
  trainingStatus: () => apiFetch<TrainingStatus>('/api/ml/training-status'),
  train: () => apiFetch<Record<string, unknown>>('/api/ml/train', { method: 'POST' }),

  // ── Fase 2: Estrategia ───────────────────────────────────────────────────
  getFunnelHealth: () => apiFetch<FunnelStep[]>('/api/strategy/funnel-health'),
  syncCampaigns: () => apiFetch<SyncResult>('/api/strategy/sync', { method: 'POST' }),
  getSafetyStatus: () => apiFetch<SafetyStatus>('/api/strategy/safety-status'),
  executeStrategy: (strategy: StrategyResult) =>
    apiFetch<ExecuteResult>('/api/strategy/execute', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    }),
  getSystemContext: () => apiFetch<SystemContext>('/api/strategy/system-context'),
  getLatestStrategy: () => apiFetch<StrategyResult>('/api/strategy/latest'),
  getStrategyHistory: () => apiFetch<StrategyResult[]>('/api/strategy/history'),
  getLatestStructural: () => apiFetch<StrategyResult>('/api/strategy/latest-structural'),
  getAssignments: () => apiFetch<{ user_name: string; campaign_name: string }[]>('/api/strategy/assignments'),
  fetchResearch: () =>
    apiFetch<{ raw_text: string | null; citations: string[] }>('/api/strategy/fetch-research', { method: 'POST' }),
  generatePremium: (marketResearch?: { raw_text: string | null; citations: string[] } | null) =>
    apiFetch<StrategyResult>('/api/strategy/generate-premium', {
      method: 'POST',
      body: JSON.stringify({ market_research: marketResearch ?? null }),
    }),
  generateBasic: () =>
    apiFetch<StrategyResult>('/api/strategy/generate-basic', { method: 'POST' }),
  updateNode: (payload: { action_id: number; template_id: number; subject: string; cuerpo: string; preheader?: string; user_name?: string; campaign_name?: string; semana_label?: string }) =>
    apiFetch<{ ok: boolean; action_id: number; template_id: number }>('/api/strategy/update-node', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSentNodes: (semanaLabel: string, after?: string) =>
    apiFetch<{ semana_label: string; sent: number[] }>(
      `/api/strategy/sent-nodes?semana_label=${encodeURIComponent(semanaLabel)}${after ? `&after=${encodeURIComponent(after)}` : ''}`
    ),
  validateAndSendPremium: (payload: {
    nodes: { id_nodo_cio: number; template_id: number; tipo: string; subject: string; cuerpo: string; preheader?: string; nombre?: string; campaign_name?: string; step_code?: string }[]
    semana_label: string
    user_name?: string
  }) => apiFetch<{
    results: { id_nodo_cio: number; status: string; errors: string[]; warnings: string[]; sent: boolean; layer?: string }[]
    total_sent: number
    total_blocked: number
  }>('/api/strategy/validate-and-send-premium', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  validateAndSend: (payload: {
    nodes: Array<{
      id_nodo_cio: number
      template_id: number
      tipo: string
      subject: string
      cuerpo: string
      preheader?: string
      nombre?: string
      campaign_name?: string
      step_code?: string
    }>
    semana_label: string
    user_name?: string
  }) =>
    apiFetch<{
      results: Array<{
        id_nodo_cio: number
        status: 'listo' | 'cambios'
        layer: 'L1' | 'L2' | 'sent' | 'send_error'
        errors: string[]
        warnings: string[]
        sent: boolean
      }>
      total_sent: number
      total_blocked: number
    }>('/api/strategy/validate-and-send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAdminStatus: () =>
    apiFetch<{ user_name: string; campaign_name: string; nodes_updated: number; nodes_total: number | null; nodes_pending: number | null; semana_label: string | null; last_update: string | null; sent_by: string | null; status: 'done' | 'partial' | 'pending' }[]>('/api/strategy/admin-status'),

  // ── Configuración ────────────────────────────────────────────────────────
  getTrackedCampaigns: () =>
    apiFetch<TrackedCampaign[]>('/api/config/tracked-campaigns'),
  addTrackedCampaign: (cio_campaign_id: string) =>
    apiFetch<TrackedCampaign>('/api/config/tracked-campaigns', {
      method: 'POST',
      body: JSON.stringify({ cio_campaign_id }),
    }),
  deleteTrackedCampaign: (campaign_id: string) =>
    apiFetch<{ ok: boolean; deleted: string }>(`/api/config/tracked-campaigns/${campaign_id}`, {
      method: 'DELETE',
    }),
  getConfigKnowledgeBase: () =>
    apiFetch<KnowledgeBaseEntry[]>('/api/config/knowledge-base'),
  updateKnowledgeBaseEntry: (id: string, updates: Partial<KnowledgeBaseEntry>) =>
    apiFetch<KnowledgeBaseEntry>(`/api/config/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  addKnowledgeBaseEntry: (entry: { tipo: string; titulo: string; contenido: string }) =>
    apiFetch<KnowledgeBaseEntry>('/api/config/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
  deleteKnowledgeBaseEntry: (id: string) =>
    apiFetch<{ ok: boolean; deleted: string }>(`/api/config/knowledge-base/${id}`, {
      method: 'DELETE',
    }),

  // ── Auto-fetch variables macro ──────────────────────────────────────────
  fetchAutoVariables: (semana: string, banrepTasa?: number | null) => {
    let url = `/api/data/auto-variables?semana=${encodeURIComponent(semana)}`
    if (banrepTasa != null) url += `&banrep_tasa=${banrepTasa}`
    return apiFetch<AutoVariablesResult>(url, { signal: AbortSignal.timeout(300_000) })
  },

  // ── Medición Fase 4 ─────────────────────────────────────────────────────
  bqStatus: () => apiFetch<{ configured: boolean; message: string }>('/api/measure/status'),
  runMeasurement: (body: MeasurementRequest) =>
    apiFetch<MeasurementReport>('/api/measure/run', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ── Snapshots manuales (HTML de Claude) ──────────────────────────────────
  saveSnapshot: (body: {
    semana_label: string
    inicio_semana?: string
    fin_semana?: string
    model_version?: string
    html_content: string
  }) =>
    apiFetch<MeasurementSnapshot>('/api/measure/save-snapshot', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listSnapshots: () => apiFetch<MeasurementSnapshot[]>('/api/measure/snapshots'),
  getSnapshot: (id: string) => apiFetch<MeasurementSnapshot>(`/api/measure/snapshots/${id}`),
}

// ── Auto-fetch variables macro ─────────────────────────────────────────────

export interface AutoVariablesResult {
  semana: string
  values: Record<string, number | null>
  status: Record<string, 'ok' | 'error' | 'pending'>
  errors: string[]
}

export interface ShapItem {
  feature: string
  value: number | null
  contribution: number
}

export interface ContextoItem {
  feature: string
  current_value: number | null
  trailing_12w_mean: number
  z_score: number | null
  shap_contribution: number
}

export interface PrescripcionItem {
  variable: string
  z_score: number
  contribucion_depositos: number
  direccion: string
  severidad: string
  tipo_accion: string
}

export interface PredictionResult {
  semana_datos: string
  semana_label?: string        // "6 al 12 de marzo 2026"
  prediccion_siguiente_semana: number
  target_name: string
  modelo_version: string
  mae_modelo: number | null
  baseline_12w: number
  brecha_vs_baseline: number
  shap_top: ShapItem[]
  contexto_historico_top_features: ContextoItem[]
  prescripcion: PrescripcionItem[]
  _id?: string
}

export interface TrainingStatus {
  has_model: boolean
  version?: number
  mae_walk_forward?: number
  r2_train?: number
  mae_train?: number
  ratio_wf_train?: number
  overfitting_flag?: string
  n_samples?: number
  n_features?: number
  message?: string
}

// ── Fase 2: Estrategia ─────────────────────────────────────────────────────

export interface WeeklySeries {
  delivered: number[]
  sent: number[]
  human_opened: number[]
  clicked: number[]
  converted: number[]
  bounced: number[]
  undeliverable: number[]
  created: number[]
}

export interface MetricsWeeklyJson {
  period: string
  start: string
  end: string
  series: WeeklySeries
}

export interface CampaignNode {
  id?: number | null
  type: 'email_action' | 'push_notification_action'
  name: string
}

export interface CampaignSummary {
  cio_campaign_id: string
  name: string
  status: string | null
  funnel_step_name?: string | null
  funnel_step_code?: string | null
  goal_event?: string | null
  delivery_rate: number
  open_rate: number
  conversion_rate: number
  delivered: number
  total_sent: number
  converted: number
  undeliverable: number
  human_opened: number
  clicked: number
  spike_alert?: boolean
  last_synced_at?: string | null
  metrics_weekly_json: MetricsWeeklyJson | null
  n_nodos?: number | null
  node_list?: CampaignNode[]
  warnings?: string[]
}

export interface FunnelMetrics {
  delivered: number
  total_sent: number
  converted: number
  human_opened: number
  undeliverable: number
  delivery_rate: number
  open_rate: number
  conversion_rate: number
  delivery_delta: number
}

export interface FunnelStep {
  step_order: number
  step_code: string
  step_name: string
  health: 'verde' | 'amarillo' | 'rojo' | 'spike'
  label: string
  warnings: string[]
  metrics: FunnelMetrics
  campaigns: CampaignSummary[]
  entry_event: string | null
  exit_event: string | null
}

export interface StrategyNode {
  orden: number
  id_nodo_cio?: number | null  // ID exacto del nodo en CIO — campo de match primario para el canvas
  template_id?: number | null  // ID del template CIO donde vive el copy real del nodo
  nombre?: string      // nombre EXACTO del nodo en CIO — fallback de match si id_nodo_cio no está
  tipo: 'push' | 'email'
  delay_desde_anterior_horas: number
  subject:    string   // Liquid expression con ramas por Perfil_de_riesgo
  preheader?: string   // Liquid expression (solo email)
  cuerpo:     string   // Liquid expression con ramas por Perfil_de_riesgo
  modificado?: boolean // true = tiene cambios propuestos; false = nodo sin cambios (read-only en canvas)
}

export interface CambiosEstructura {
  descripcion: string | null
  delays_propuestos?: { nodo: number; delay_horas: number }[]
  secuencia_canales?: string | null
  nodos_adicionales?: string | null
}

export interface StrategyAction {
  step_code: string
  step_name: string
  shap_z: number
  shap_contribucion?: number
  prioridad: 'alta' | 'media'
  tipo_accion: 'optimizar' | 'reforzar' | 'alerta_gap' | 'crear'
  campaña_existente_id: string | null
  campaña_existente_nombre: string | null
  razon: string
  propuesta: {
    nombre_campaña: string
    trigger_event: string
    conversion_event: string
    cambios_estructura?: CambiosEstructura
    nodos: StrategyNode[] | null  // null para alerta_gap
  }
  nodos_completos?: StrategyNode[] // todos los nodos del journey (modificado=true/false) para el canvas
}

export interface ResumenKpi {
  etiqueta: string
  valor: string
  tipo: 'positivo' | 'alerta' | 'neutro' | 'oportunidad'
}

export interface StrategyResult {
  resumen: string
  resumen_kpis?: ResumenKpi[]
  estado_funnel: 'estable' | 'anomalia_leve' | 'anomalia_critica'
  semana_label?: string
  acciones: StrategyAction[]
  _id?: string
  _created_at?: string
}

export interface SafetyStatus {
  cio_dry_run: boolean
  max_campaigns_per_execute: number
  cio_key_configured: boolean
  escrituras_bloqueadas: boolean
  mensaje: string
}

export interface SyncResult {
  total_synced: number
  mapped_to_funnel: number
  unmapped: number
  spike_alerts: string[]
  errors: string[]
}

export interface FunnelStepRaw {
  id?: string
  step_order: number
  step_code: string
  step_name: string
  entry_event: string | null
  exit_event: string | null
}

export interface CampaignCacheRaw {
  cio_campaign_id: string
  name: string
  campaign_type: string | null
  status: string | null
  trigger_event: string | null
  goal_event: string | null
  country: string | null
  funnel_step_mapped: string | null
  delivered: number
  total_sent: number
  opened: number
  human_opened: number
  clicked: number
  converted: number
  bounced: number
  undeliverable: number
  delivery_rate: number
  open_rate: number
  conversion_rate: number
  undeliverable_rate: number
  metrics_weeks_covered: number
  spike_alert: boolean
  last_synced_at: string | null
}

export interface CioEvent {
  id?: string
  name: string
  record_type: 'event'
  event_role: 'trigger' | 'goal' | 'signal' | 'both' | null
  funnel_step_code: string | null
  description: string | null
  active: boolean
}

export interface CioAttribute {
  id?: string
  name: string
  record_type: 'attribute'
  description: string | null
  possible_values: string | null
  active: boolean
}

export interface KnowledgeBaseEntry {
  id?: string
  tipo: string
  titulo: string
  contenido: string
  activo: boolean
}

export interface SystemContext {
  funnel_steps: FunnelStepRaw[]
  campaigns_cache: CampaignCacheRaw[]
  events: CioEvent[]
  attributes: CioAttribute[]
  knowledge_base: KnowledgeBaseEntry[]
}


export interface TrackedCampaign {
  cio_campaign_id: string
  name: string
  status: string | null
  funnel_step_mapped: string | null
  trigger_event: string | null
  delivery_rate: number
  open_rate: number
  conversion_rate: number
  total_sent: number
  last_synced_at: string | null
  unmapped_warning: boolean
}

export interface ExecuteResult {
  executed: Array<{
    step_code: string
    tipo: string
    campaign_id?: string
    nombre?: string
    nodos_actualizados?: number
  }>
  errors: Array<{ step_code: string; tipo: string; error: string }>
  total_ejecutadas: number
  total_errores: number
}

// ── Fase 4: Medición ──────────────────────────────────────────────────────────

export interface MeasurementSnapshot {
  id: string
  created_at: string
  semana_label: string
  inicio_semana: string | null
  fin_semana: string | null
  model_version: string
  html_content?: string
}

export interface MeasurementRequest {
  campaign_name?: string
  test_user_ids: string[]
  start_date: string  // YYYY-MM-DD
  end_date: string    // YYYY-MM-DD
}

export interface MeasurementGroupStats {
  n: number
  conversiones: number
  conversion_rate: number
  total_cashin_usd: number
  avg_cashin_convertidos_usd: number
  total_aum_usd: number
}

export interface MeasurementReport {
  campaign_name: string
  window: { start: string; end: string }
  n_test_ids_provided: number
  n_test_ids_matched: number
  groups: {
    test: MeasurementGroupStats
    control: MeasurementGroupStats
  }
  uplift: {
    absolute: number
    pct: number | null
    significant: boolean
    direction: 'positivo' | 'negativo' | 'neutro'
  }
  profile_breakdown: Record<string, Array<{
    perfil: string
    n: number
    conversiones: number
    conversion_rate: number
  }>>
  weekly_trend: Array<{
    semana: string
    test?: { n: number; conversiones: number; conversion_rate: number }
    control?: { n: number; conversiones: number; conversion_rate: number }
  }>
}
