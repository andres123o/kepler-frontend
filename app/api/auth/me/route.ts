import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { SessionUser } from '@/app/(internal)/login/actions'

export type { SessionUser }

export async function GET(): Promise<NextResponse<SessionUser | null>> {
  const store = await cookies()
  const raw = store.get('kepler-session')?.value

  if (!raw) return NextResponse.json(null)

  try {
    const parsed = JSON.parse(raw) as SessionUser
    if (parsed?.name && parsed?.role && parsed?.org_slug) return NextResponse.json(parsed)
  } catch { /* ignora */ }

  return NextResponse.json(null)
}
