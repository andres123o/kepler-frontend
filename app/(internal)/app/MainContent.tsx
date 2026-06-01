'use client'
import { useNav } from './NavigationProvider'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNav()

  return (
    <main className="flex-1 overflow-auto relative">
      {isNavigating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/75 backdrop-blur-[2px]">
          <div className="w-7 h-7 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
          <p className="text-neutral-500 text-xs mt-3">Cargando...</p>
        </div>
      )}
      {children}
    </main>
  )
}
