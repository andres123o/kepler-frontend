'use client'
import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { logout, switchFunnel } from '../login/actions'
import { clearFunnelHeadersCache } from '@/lib/api'
import { useNav } from './NavigationProvider'
import type { SessionUser } from '../login/actions'

const NAV = [
  { href: '/app/ingresar',   label: 'Ingresar datos',        adminOnly: true },
  { href: '/app/predecir',   label: 'Proyección' },
  { href: '/app/estrategia', label: 'Estrategia' },
  { href: '/app/campanas',   label: 'Campañas' },
  { href: '/app/medicion',   label: 'Métricas y Resultados' },
]

const NAV_BOTTOM = [
  { href: '/app/modelo',        label: 'Modelo' },
  { href: '/app/configuracion', label: 'Configuración' },
  { href: '/app/admin',         label: 'Panel Admin', adminOnly: true },
]

export function Sidebar() {
  const pathname           = usePathname()
  const router             = useRouter()
  const { startNav }       = useNav()
  const [session, setSession]         = useState<SessionUser | null>(null)
  const [showFunnels, setShowFunnels] = useState(false)
  const [, startTransition]           = useTransition()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setSession(data))
      .catch(() => {})
  }, [])

  const isAdmin       = session?.role === 'admin'
  const visibleNav    = NAV.filter(item => !item.adminOnly || isAdmin)
  const visibleBottom = NAV_BOTTOM.filter(item => !(item as { adminOnly?: boolean }).adminOnly || isAdmin)
  const hasMultiple   = (session?.funnels?.length ?? 0) > 1

  function navigate(href: string) {
    if (href === pathname) return
    startNav()
    router.push(href)
  }

  function handleSwitchFunnel(slug: string, name: string) {
    setShowFunnels(false)
    if (slug === session?.funnel_slug) return
    startTransition(async () => {
      await switchFunnel(slug, name)
      clearFunnelHeadersCache()
      window.dispatchEvent(new CustomEvent('kepler-funnel-changed', { detail: { slug } }))
      setSession(prev => prev ? { ...prev, funnel_slug: slug, funnel_name: name } : prev)
      router.refresh()
    })
  }

  function navItem(item: { href: string; label: string }) {
    const active = pathname === item.href
    return (
      <button
        key={item.href}
        onClick={() => navigate(item.href)}
        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
          active
            ? 'bg-amber-500/10 text-amber-400 font-medium'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
        }`}
      >
        {item.label}
      </button>
    )
  }

  return (
    <aside className="w-56 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-neutral-800">
        <p className="text-white text-sm font-semibold leading-none">{session?.org_name ?? 'Kepler'}</p>

        {/* Selector de funnel */}
        <div className="relative mt-2">
          <button
            onClick={() => hasMultiple && setShowFunnels(v => !v)}
            className={`flex items-center gap-1 text-xs text-neutral-400 ${hasMultiple ? 'hover:text-white cursor-pointer' : 'cursor-default'}`}
          >
            <span>{session?.funnel_name ?? '...'}</span>
            {hasMultiple && <span className="text-neutral-600">▾</span>}
          </button>

          {showFunnels && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-neutral-800 border border-neutral-700 rounded-lg py-1 min-w-[140px] shadow-xl">
              {session?.funnels?.map(f => (
                <button
                  key={f.slug}
                  onClick={() => handleSwitchFunnel(f.slug, f.name)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    f.slug === session.funnel_slug
                      ? 'text-amber-400 font-medium'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {visibleNav.map(navItem)}
      </nav>

      <div className="p-3 border-t border-neutral-800">
        <div className="space-y-0.5 mb-3">
          {visibleBottom.map(navItem)}
        </div>
        <div className="border-t border-neutral-800 pt-3">
          <p className="text-xs text-neutral-600 px-3 mb-2">{session?.name ?? '...'}</p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
