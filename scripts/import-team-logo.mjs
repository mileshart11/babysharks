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

const info = await sharp(sourcePath).trim().toFile(destAbsolute)
console.log(`Saved trimmed logo (${info.width}x${info.height}) to public${destRelative}`)

const { error } = await supabase
  .from('nfl_teams')
  .update({ logo_url: destRelative })
  .eq('id', teamId)

if (error) {
  console.error('Failed to update nfl_teams.logo_url:', error.message)
  process.exit(1)
}

console.log(`Done. ${team.city} ${team.name} (${teamId}) now uses ${destRelative}.`)
