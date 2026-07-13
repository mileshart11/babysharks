// Creates pre-confirmed users via the Supabase Admin API, bypassing email
// confirmation entirely. Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
//
// Usage: node scripts/seed-users.mjs <path-to-users.json>
//
// users.json shape: [{ "email": "...", "password": "...", "username": "optional" }]
// Keep that file OUTSIDE the repo — it holds plaintext passwords.

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

loadEnvConfig(process.cwd())

const usersPath = process.argv[2]
if (!usersPath) {
  console.error('Usage: node scripts/seed-users.mjs <path-to-users.json>')
  process.exit(1)
}

const users = JSON.parse(readFileSync(usersPath, 'utf-8'))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

for (const { email, password, username } of users) {
  const resolvedUsername = username ?? email.split('@')[0]
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: resolvedUsername },
  })

  if (error) {
    console.log(`FAIL  ${email} - ${error.message}`)
  } else {
    console.log(`OK    ${email} - user id ${data.user.id}, username "${resolvedUsername}"`)
  }
}
