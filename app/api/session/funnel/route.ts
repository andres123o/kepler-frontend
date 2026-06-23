import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { SessionUser } from '@/app/(internal)/login/actions'

// Devuelve org_slug + funnel_slug desde la sesión httpOnly.
// api.ts lo usa para construir los headers X-Org-Slug / X-Funnel-Slug
// sin exponer la sesión completa al cliente.
export async function GET(): Promise<NextResponse> {
  const store = await cookies()
  const raw = store.get('kepler-session')?.value
  if (!raw) return NextResponse.json(null, { status: 401 })

  try {
    const session = JSON.parse(raw) as SessionUser
    if (!session?.org_slug || !session?.funnel_slug)
      return NextResponse.json(null, { status: 401 })

    return NextResponse.json({
      org_slug:    session.org_slug,
      funnel_slug: session.funnel_slug,
    })
  } catch {
    return NextResponse.json(null, { status: 401 })
  }
}
