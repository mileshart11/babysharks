import type { Game, Pick } from './supabase/types'

export function computeRecord(babySharkId: string, picks: Pick[], games: Game[]) {
  const gamesById = new Map(games.map((g) => [g.id, g]))
  let wins = 0
  let losses = 0
  let pushes = 0

  for (const pick of picks) {
    if (pick.baby_shark_id !== babySharkId) continue
    const game = gamesById.get(pick.game_id)
    if (!game || game.status !== 'final') continue

    if (game.winner_team_id === null) pushes++
    else if (pick.picked_team_id === game.winner_team_id) wins++
    else losses++
  }

  return { wins, losses, pushes }
}

export function rankSharks<T extends { id: string }>(sharks: T[], picks: Pick[], games: Game[]) {
  return sharks
    .map((shark) => {
      const record = computeRecord(shark.id, picks, games)
      const played = record.wins + record.losses + record.pushes
      const winPct = played > 0 ? record.wins / played : 0
      return { shark, ...record, winPct }
    })
    .sort((a, b) => b.wins - a.wins || b.winPct - a.winPct || a.losses - b.losses)
}
