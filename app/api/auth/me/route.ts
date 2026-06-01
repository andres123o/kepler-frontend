import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export interface SessionUser {
  name: string
  role: 'admin' | 'agent'
  campaign?: string   // solo para admins con campaña asignada (ej: Juanita)
}

export async function GET(): Promise<NextResponse<SessionUser | null>> {
  const store = await cookies()
  const raw = store.get('kepler-session')?.value

  if (!raw) return NextResponse.json(null)

  try {
    const parsed = JSON.parse(raw) as SessionUser
    if (parsed?.name && parsed?.role) return NextResponse.json(parsed)
  } catch { /* ignora */ }

  return NextResponse.json(null)
}
