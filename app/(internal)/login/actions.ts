'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'

export interface LoginState {
  error?: string
}

export interface FunnelRef { slug: string; name: string }

export interface SessionUser {
  user_id:      string
  name:         string
  role:         'admin' | 'viewer'
  org_id:       string
  org_slug:     string
  org_name:     string
  funnel_slug:  string
  funnel_name:  string
  funnels:      FunnelRef[]
}

export async function login(
  _prev: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const username = (formData.get('username') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, username, password_hash, display_name')
    .eq('username', username)
    .single()

  if (!user) return { error: 'Usuario o contraseña incorrectos' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return { error: 'Usuario o contraseña incorrectos' }

  const { data: access } = await supabase
    .from('user_org_access')
    .select('role, organizations(id, slug, name)')
    .eq('user_id', user.id)
    .single()

  if (!access) return { error: 'Sin acceso asignado. Contacta al administrador.' }

  const org = access.organizations as { id: string; slug: string; name: string }

  const { data: funnels } = await supabase
    .from('funnels')
    .select('slug, name')
    .eq('org_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (!funnels || funnels.length === 0)
    return { error: 'La organización no tiene funnels configurados.' }

  const session: SessionUser = {
    user_id:     user.id,
    name:        user.display_name ?? user.username,
    role:        access.role as 'admin' | 'viewer',
    org_id:      org.id,
    org_slug:    org.slug,
    org_name:    org.name,
    funnel_slug: funnels[0].slug,
    funnel_name: funnels[0].name,
    funnels,
  }

  const cookieStore = await cookies()
  cookieStore.set('kepler-session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  // Cookie httpOnly — leída server-side por layout.tsx y /api/session/funnel
  cookieStore.set('kepler-funnel', JSON.stringify({ org_slug: org.slug, funnel_slug: funnels[0].slug }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  redirect('/app/ingresar')
}

export async function switchFunnel(slug: string, name: string): Promise<void> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('kepler-session')?.value
  if (!raw) return
  const session = JSON.parse(raw) as SessionUser
  cookieStore.set('kepler-session', JSON.stringify({ ...session, funnel_slug: slug, funnel_name: name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  cookieStore.set('kepler-funnel', JSON.stringify({ org_slug: session.org_slug, funnel_slug: slug }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('kepler-session')
  redirect('/login')
}
