'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface NavCtx { isNavigating: boolean; startNav: () => void }

const Ctx = createContext<NavCtx>({ isNavigating: false, startNav: () => {} })

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname                    = usePathname()
  const [isNavigating, setNav]      = useState(false)
  const startNav                    = useCallback(() => setNav(true), [])

  useEffect(() => { setNav(false) }, [pathname])

  return <Ctx.Provider value={{ isNavigating, startNav }}>{children}</Ctx.Provider>
}

export const useNav = () => useContext(Ctx)
