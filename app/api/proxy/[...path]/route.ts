import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { SessionUser } from '@/app/(internal)/login/actions'

// Único punto por el que el navegador puede llegar al backend FastAPI.
// El backend real (BACKEND_URL) y el secreto compartido (KEPLER_BACKEND_SECRET)
// viven solo en env vars server-only — nunca se exponen al bundle del cliente.
// Requiere sesión válida y adjunta X-Org-Slug/X-Funnel-Slug desde la cookie
// (nunca desde headers que mande el cliente), así nadie puede pedir datos de
// otra organización cambiando un header a mano.

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'
const BACKEND_SECRET = process.env.KEPLER_BACKEND_SECRET ?? ''

async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get('kepler-session')?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SessionUser
    if (parsed?.org_slug && parsed?.funnel_slug) return parsed
  } catch { /* ignora */ }
  return null
}

async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ detail: 'No autenticado' }, { status: 401 })
  }

  const targetUrl = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`

  const init: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Org-Slug': session.org_slug,
      'X-Funnel-Slug': session.funnel_slug,
      'X-Kepler-User': encodeURIComponent(session.name),
      Authorization: `Bearer ${BACKEND_SECRET}`,
    },
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text()
  }

  const res = await fetch(targetUrl, init)
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  })
}

type RouteParams = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path)
}
export async function POST(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path)
}
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path)
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return forward(request, (await params).path)
}

// El auto-fetch de variables macro puede tardar varios minutos (llama APIs externas).
// maxDuration solo tiene efecto real en Vercel Pro o superior (Hobby lo limita a 60s).
export const maxDuration = 300
