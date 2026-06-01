import { NextRequest, NextResponse } from 'next/server'

function parseSession(value: string | undefined): { name: string; role: string } | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed?.name && parsed?.role) return parsed
  } catch { /* ignora */ }
  return null
}

export function middleware(request: NextRequest) {
  const raw     = request.cookies.get('kepler-session')?.value
  const session = parseSession(raw)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Agentes no pueden acceder a ingresar datos
  if (pathname.startsWith('/app/ingresar') && session?.role === 'agent') {
    return NextResponse.redirect(new URL('/app/predecir', request.url))
  }

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/app/ingresar', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/login'],
}
