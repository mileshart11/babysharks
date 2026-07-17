// One-off: removes files in the `avatars` storage bucket that no longer
// match any baby_sharks.avatar_url — leftovers from profile picture
// updates before the app started cleaning up after itself.
//
// Usage:
//   node scripts/cleanup-orphaned-avatars.mjs --dry-run   (preview only)
//   node scripts/cleanup-orphaned-avatars.mjs             (actually delete)

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const dryRun = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: sharks, error: sharksError } = await supabase.from('baby_sharks').select('id, avatar_url')
if (sharksError) {
  console.error('Failed to load baby_sharks:', sharksError.message)
  process.exit(1)
}

const referenced = new Set(
  sharks.map((s) => s.avatar_url?.split('/avatars/').pop()).filter(Boolean)
)

const { data: folders, error: foldersError } = await supabase.storage.from('avatars').list()
if (foldersError) {
  console.error('Failed to list avatars bucket:', foldersError.message)
  process.exit(1)
}

let removed = 0
let kept = 0

for (const folder of folders ?? []) {
  if (!folder.name) continue

  // Each baby shark's files live under a folder named after its id.
  const { data: files, error: filesError } = await supabase.storage.from('avatars').list(folder.name)
  if (filesError) {
    console.log(`FAIL  could not list ${folder.name}/ - ${filesError.message}`)
    continue
  }

  for (const file of files ?? []) {
    const path = `${folder.name}/${file.name}`
    if (referenced.has(path)) {
      kept++
      continue
    }

    console.log(`${dryRun ? 'WOULD REMOVE' : 'REMOVE'}  ${path}`)
    if (!dryRun) {
      const { error: removeError } = await supabase.storage.from('avatars').remove([path])
      if (removeError) console.log(`FAIL  ${path} - ${removeError.message}`)
      else removed++
    }
  }
}

console.log(
  dryRun
    ? `Dry run complete. ${kept} file(s) referenced and kept; see above for what would be removed.`
    : `Done. Removed ${removed} orphaned file(s), kept ${kept} referenced file(s).`
)
