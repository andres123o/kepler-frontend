export interface IngestionField {
  key:   string
  label: string
  type:  'number' | 'integer' | 'boolean'
}

export interface IngestionGroup {
  id:          string
  title:       string
  description: string
  auto_fetch:  boolean
  fields:      IngestionField[]
}

export interface FunnelConfig {
  market: {
    locale:      string    // 'es-CO', 'es-PE'
    currency:    string    // 'COP', 'PEN'
    country:     string    // 'co', 'pe'
    rate_label?: string    // 'Tasa BanRep (%)' para CO — undefined = no mostrar input de tasa manual en auto-fetch
  }
  ml: {
    model_dir:    string   // 'models', 'primer_master_peru/models_peru'
    target_label: string   // 'Usuarios Primer Depósito', 'Depósitos Semanales'
  }
  ingestion_groups: IngestionGroup[]
  feature_labels:   Record<string, string>
  integrations: {
    customerio: boolean
    perplexity: boolean
  }
  nav:          string[]
  derived_vars: string[]   // features calculadas por el modelo — no accionables, ocultas de "Factores clave"
}
