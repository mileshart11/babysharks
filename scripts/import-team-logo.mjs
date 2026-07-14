// Trims transparent padding from a team logo, saves it into
// public/team-logos/, and points nfl_teams.logo_url at it.
//
// Usage: node scripts/import-team-logo.mjs <TEAM_ID> "<source file path>"
// Example: node scripts/import-team-logo.mjs ARI "C:\Users\miles\Desktop\Baby Sharks Logos\AZ Logo.png"

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

loadEnvConfig(process.cwd())

const [, , teamId, sourcePath] = process.argv
if (!teamId || !sourcePath) {
  console.error('Usage: node scripts/import-team-logo.mjs <TEAM_ID> "<source file path>"')
  process.exit(1)
}

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const destRelative = `/team-logos/${teamId}.png`
const destAbsolute = path.join(projectRoot, 'public', 'team-logos', `${teamId}.png`)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data: team, error: teamError } = await supabase
  .from('nfl_teams')
  .select('id, city, name')
  .eq('id', teamId)
  .maybeSingle()

if (teamError || !team) {
  console.error(`Unknown team id "${teamId}". Must match an nfl_teams.id.`)
  process.exit(1)
}

// Source files come straight out of image generators at ~1000-1500px;
// the largest on-site usage (tap-pick screen) tops out around 240px even
// on retina, so anything bigger is wasted bytes on every page load.
const MAX_DIMENSION = 500

const info = await sharp(sourcePath)
  .trim()
  .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(destAbsolute)
console.log(`Saved trimmed + optimized logo (${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB) to public${destRelative}`)

const { error } = await supabase
  .from('nfl_teams')
  .update({ logo_url: destRelative })
  .eq('id', teamId)

if (error) {
  console.error('Failed to update nfl_teams.logo_url:', error.message)
  process.exit(1)
}

console.log(`Done. ${team.city} ${team.name} (${teamId}) now uses ${destRelative}.`)
