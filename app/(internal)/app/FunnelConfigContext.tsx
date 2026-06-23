'use client'
import { createContext, useContext, ReactNode } from 'react'
import type { FunnelConfig } from '@/lib/funnel-config'

const FunnelConfigContext = createContext<FunnelConfig | null>(null)

export function FunnelConfigProvider({
  config,
  children,
}: {
  config: FunnelConfig | null
  children: ReactNode
}) {
  return (
    <FunnelConfigContext.Provider value={config}>
      {children}
    </FunnelConfigContext.Provider>
  )
}

export function useFunnelConfig(): FunnelConfig {
  const ctx = useContext(FunnelConfigContext)
  if (!ctx) throw new Error('useFunnelConfig debe usarse dentro de FunnelConfigProvider')
  return ctx
}

export function useFunnelConfigOptional(): FunnelConfig | null {
  return useContext(FunnelConfigContext)
}
