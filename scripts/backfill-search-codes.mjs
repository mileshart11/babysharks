// One-off: assigns a search_code to any baby_sharks row that doesn't have one yet.
// Usage: node scripts/backfill-search-codes.mjs

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function generateSearchCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: sharks, error } = await supabase
  .from('baby_sharks')
  .select('id, name, search_code')
  .is('search_code', null)

if (error) {
  console.error('Failed to load baby_sharks:', error.message)
  process.exit(1)
}

for (const shark of sharks) {
  let saved = false
  for (let attempt = 0; attempt < 5 && !saved; attempt++) {
    const code = generateSearchCode()
    const { error: updateError } = await supabase
      .from('baby_sharks')
      .update({ search_code: code })
      .eq('id', shark.id)

    if (!updateError) {
      console.log(`OK    ${shark.name} - ${code}`)
      saved = true
    } else if (updateError.code !== '23505') {
      console.log(`FAIL  ${shark.name} - ${updateError.message}`)
      break
    }
  }
}
