import { createClient } from '@supabase/supabase-js'

// Server-only: uses the service role key, which bypasses Row Level Security
// entirely. Never import this from a Client Component and never return the
// client (or the key) to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
