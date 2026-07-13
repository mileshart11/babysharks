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
