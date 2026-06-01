'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface LoginState {
  error?: string
}

// Usuarios hardcodeados — contraseña "admin" para todos los agentes
// campaign: solo para admins que también tienen una campaña asignada
const USERS: Record<string, { name: string; role: 'admin' | 'agent'; campaign?: string }> = {
  admin:   { name: 'Admin',   role: 'admin' },
  sebas:   { name: 'Sebas',   role: 'agent' },
  felipe:  { name: 'Felipe',  role: 'agent' },
  juanita: { name: 'Juanita', role: 'agent' },
  andrea:  { name: 'Andrea',  role: 'agent' },
  manu:    { name: 'Manu',    role: 'agent' },
  camu:    { name: 'Camu',    role: 'agent' },
}

const PASSWORDS: Record<string, string> = {
  admin:   'admintrii',
  sebas:   'admin',
  felipe:  'admin',
  juanita: 'admin',
  andrea:  'admin',
  manu:    'admin',
  camu:    'admin',
}

export async function login(
  _prev: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const username = (formData.get('username') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  const user = USERS[username]
  const expected = PASSWORDS[username]

  if (user && expected && password === expected) {
    const cookieStore = await cookies()
    cookieStore.set('kepler-session', JSON.stringify({ name: user.name, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })
    redirect('/app/ingresar')
  }

  return { error: 'Usuario o contraseña incorrectos' }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('kepler-session')
  redirect('/login')
}
