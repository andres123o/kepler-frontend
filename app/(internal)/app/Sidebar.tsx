'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '../login/actions'
import { useNav } from './NavigationProvider'

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

interface Session { name: string; role: 'admin' | 'agent'; campaign?: string }

export function Sidebar() {
  const pathname         = usePathname()
  const router           = useRouter()
  const { startNav }     = useNav()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setSession(data))
      .catch(() => {})
  }, [])

  const isAdmin       = session?.role === 'admin'
  const visibleNav    = NAV.filter(item => !item.adminOnly || isAdmin)
  const visibleBottom = NAV_BOTTOM.filter(item => !(item as { adminOnly?: boolean }).adminOnly || isAdmin)

  function navigate(href: string) {
    if (href === pathname) return
    startNav()
    router.push(href)
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
        <p className="text-white text-sm font-semibold leading-none">trii Growth</p>
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
