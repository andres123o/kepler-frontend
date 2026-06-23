import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { NavigationProvider } from './NavigationProvider'
import { FunnelConfigProvider } from './FunnelConfigContext'
import type { FunnelConfig } from '@/lib/funnel-config'

async function loadFunnelConfig(
  orgSlug: string,
  funnelSlug: string,
): Promise<FunnelConfig | null> {
  const supabase = createAdminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) return null

  const { data: funnel } = await supabase
    .from('funnels')
    .select('config')
    .eq('org_id', org.id)
    .eq('slug', funnelSlug)
    .single()

  return (funnel?.config as unknown as FunnelConfig) ?? null
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('kepler-funnel')?.value

  let funnelKey = 'default'
  let config: FunnelConfig | null = null
  if (raw) {
    try {
      const { org_slug, funnel_slug } = JSON.parse(decodeURIComponent(raw))
      if (org_slug && funnel_slug) {
        funnelKey = funnel_slug
        config = await loadFunnelConfig(org_slug, funnel_slug)
      }
    } catch {
      // cookie malformada — continúa sin config
    }
  }

  return (
    <NavigationProvider>
      <FunnelConfigProvider config={config}>
        <div className="flex min-h-screen bg-neutral-950">
          <Sidebar />
          <MainContent key={funnelKey}>{children}</MainContent>
        </div>
      </FunnelConfigProvider>
    </NavigationProvider>
  )
}
