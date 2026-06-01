import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { NavigationProvider } from './NavigationProvider'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-neutral-950">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </NavigationProvider>
  )
}
