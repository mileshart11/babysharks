// Syncs the NFL regular-season schedule from nflverse's public, free,
// community-maintained dataset into the `games` table. Safe to re-run any
// time (weekly during the season for score updates, yearly for a new
// schedule) — upserts by external_id instead of creating duplicates.
//
// Usage: node scripts/sync-nfl-schedule.mjs [season]
//   season defaults to the year of the next/current NFL season.

import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { createClient } from '@supabase/supabase-js'

loadEnvConfig(process.cwd())

const NFLVERSE_GAMES_CSV =
  'https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv'

// nflverse uses a couple of team codes that differ from ours.
const TEAM_CODE_MAP = {
  LA: 'LAR',
}

function mapTeamCode(code) {
  return TEAM_CODE_MAP[code] ?? code
}

// Handles quoted fields (which may contain commas) properly, unlike a bare
// line.split(','). nflverse's CSV hasn't needed this so far, but a naive
// split silently misaligns every column the moment one ever does.
function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

const REQUIRED_COLUMNS = [
  'game_id',
  'season',
  'game_type',
  'week',
  'gameday',
  'gametime',
  'away_team',
  'away_score',
  'home_team',
  'home_score',
]

function parseCsv(text) {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.length > 0)
  const header = parseCsvLine(lines[0])
  const colIndex = Object.fromEntries(header.map((name, i) => [name, i]))

  const missing = REQUIRED_COLUMNS.filter((name) => !(name in colIndex))
  if (missing.length > 0) {
    console.error(
      `nflverse CSV is missing expected column(s): ${missing.join(', ')}. ` +
        'The upstream format may have changed — check the CSV header manually.'
    )
    process.exit(1)
  }

  const rows = lines.slice(1).map(parseCsvLine)
  return { colIndex, rows }
}

// NFL kickoff times in this dataset are wall-clock America/New_York time.
// Converts to a UTC ISO string, accounting for DST on the given date.
function easternWallClockToUtcIso(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = (timeStr || '13:00').split(':').map(Number)

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  }).formatToParts(utcGuess)
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-5'
  const offsetHours = Number(offsetPart.replace('GMT', '')) || -5

  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute)).toISOString()
}

// The NFL season is named for the year it kicks off in (Sept), and runs
// into February. Before ~March, "now" still belongs to the previous
// season's year — without this, a January cron run would try (and fail)
// to sync a season whose schedule doesn't exist yet.
function defaultSeason() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month <= 3 ? year - 1 : year
}

const season = Number(process.argv[2]) || defaultSeason()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

console.log(`Fetching nflverse schedule for season ${season}...`)
const res = await fetch(NFLVERSE_GAMES_CSV)
if (!res.ok) {
  console.error('Failed to fetch schedule:', res.status, res.statusText)
  process.exit(1)
}
const csvText = await res.text()
const { colIndex, rows } = parseCsv(csvText)

const games = rows
  .map((cols) => ({
    game_id: cols[colIndex.game_id],
    season: Number(cols[colIndex.season]),
    game_type: cols[colIndex.game_type],
    week: Number(cols[colIndex.week]),
    gameday: cols[colIndex.gameday],
    gametime: cols[colIndex.gametime],
    away_team: cols[colIndex.away_team],
    away_score: cols[colIndex.away_score],
    home_team: cols[colIndex.home_team],
    home_score: cols[colIndex.home_score],
  }))
  .filter((g) => g.season === season && g.game_type === 'REG')

if (games.length === 0) {
  console.error(`No regular-season games found for season ${season}.`)
  process.exit(1)
}

const records = games.map((g) => {
  const homeScore = g.home_score === '' ? null : Number(g.home_score)
  const awayScore = g.away_score === '' ? null : Number(g.away_score)
  const isFinal = homeScore !== null && awayScore !== null
  const homeTeamId = mapTeamCode(g.home_team)
  const awayTeamId = mapTeamCode(g.away_team)

  let winnerTeamId = null
  if (isFinal && homeScore !== awayScore) {
    winnerTeamId = homeScore > awayScore ? homeTeamId : awayTeamId
  }

  return {
    external_id: g.game_id,
    season: g.season,
    week: g.week,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    kickoff_at: easternWallClockToUtcIso(g.gameday, g.gametime),
    status: isFinal ? 'final' : 'scheduled',
    home_score: homeScore,
    away_score: awayScore,
    winner_team_id: winnerTeamId,
  }
})

console.log(`Upserting ${records.length} games for season ${season}...`)
const { error } = await supabase.from('games').upsert(records, { onConflict: 'external_id' })

if (error) {
  console.error('Sync failed:', error.message)
  process.exit(1)
}

console.log(`Done. Synced ${records.length} regular-season games for ${season}.`)
