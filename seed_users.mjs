// Correr UNA sola vez: node seed_users.mjs
// Requiere: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'

// Leer vars de ambos .env
function parseEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
    )
  } catch { return {} }
}

const frontendEnv = parseEnv('.env.local')
const backendEnv  = parseEnv('../kepler-backend/.env')

const SUPABASE_URL          = frontendEnv['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_SERVICE_KEY  = backendEnv['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const USERS = [
  { username: 'admin',   display_name: 'Admin',   password: 'admintrii', role: 'admin'  },
  { username: 'sebas',   display_name: 'Sebas',   password: 'admin',     role: 'viewer' },
  { username: 'felipe',  display_name: 'Felipe',  password: 'admin',     role: 'viewer' },
  { username: 'juanita', display_name: 'Juanita', password: 'admin',     role: 'viewer' },
  { username: 'andrea',  display_name: 'Andrea',  password: 'admin',     role: 'viewer' },
  { username: 'manu',    display_name: 'Manu',    password: 'admin',     role: 'viewer' },
  { username: 'camu',    display_name: 'Camu',    password: 'admin',     role: 'viewer' },
]

// Buscar el team trii_co
const { data: team, error: teamErr } = await supabase
  .from('teams')
  .select('id')
  .eq('slug', 'trii_co')
  .single()

if (teamErr || !team) {
  console.error('No se encontró el team trii_co. Asegúrate de haber corrido el SQL del Paso 1.')
  process.exit(1)
}

console.log(`Team trii_co encontrado: ${team.id}`)

for (const u of USERS) {
  const password_hash = await bcrypt.hash(u.password, 10)

  const { data: inserted, error: userErr } = await supabase
    .from('users')
    .insert({ username: u.username, password_hash, display_name: u.display_name })
    .select('id')
    .single()

  if (userErr) {
    console.error(`Error insertando ${u.username}:`, userErr.message)
    continue
  }

  const { error: accessErr } = await supabase
    .from('user_team_access')
    .insert({ user_id: inserted.id, team_id: team.id, role: u.role })

  if (accessErr) {
    console.error(`Error asignando acceso a ${u.username}:`, accessErr.message)
  } else {
    console.log(`✓ ${u.username} (${u.role}) insertado`)
  }
}

console.log('\nSeed completado.')
