export interface Profile {
  id: string
  username: string
  display_name: string | null
  is_admin: boolean
  created_at: string
}

export interface NflTeam {
  id: string
  city: string
  name: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
}

export type GameStatus = 'scheduled' | 'in_progress' | 'final'

export interface Game {
  id: string
  season: number
  week: number
  home_team_id: string
  away_team_id: string
  kickoff_at: string
  status: GameStatus
  home_score: number | null
  away_score: number | null
  winner_team_id: string | null
  external_id: string | null
  created_at: string
}

export type SharkType = 'baby' | 'pet'

export interface BabyShark {
  id: string
  owner_id: string
  name: string
  bio: string | null
  avatar_url: string | null
  search_code: string | null
  shark_type: SharkType | null
  created_at: string
}

export interface Pick {
  id: string
  baby_shark_id: string
  game_id: string
  picked_team_id: string
  created_at: string
}

export type PickResult = 'win' | 'loss' | 'push' | null

export interface PickWithResult {
  pick_id: string
  baby_shark_id: string
  game_id: string
  picked_team_id: string
  season: number
  week: number
  status: GameStatus
  winner_team_id: string | null
  result: PickResult
}

export interface Follow {
  id: string
  follower_id: string
  baby_shark_id: string
  created_at: string
}
