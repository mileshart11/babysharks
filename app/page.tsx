import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { rankSharks } from '@/lib/records'
import { relativeTime } from '@/lib/time'
import { SharkAvatar } from '@/components/shark-avatar'
import { TeamLogo } from '@/components/team-logo'
import type { BabyShark, Game, NflTeam, Pick } from '@/lib/supabase/types'

const FEATURES = [
  { emoji: '🏈', title: 'Pick', description: 'Choose the teams you think will win!' },
  { emoji: '🏆', title: 'Play', description: 'Join games and compete with others.' },
  { emoji: '💰', title: 'Win', description: 'Climb the leaderboard and win rewards!' },
  { emoji: '😄', title: 'Have Fun', description: "It's easy, exciting, and made for everyone!" },
]

const BUBBLES = [
  { top: '8%', left: '6%', size: 18 },
  { top: '20%', left: '85%', size: 26 },
  { top: '55%', left: '92%', size: 14 },
  { top: '75%', left: '4%', size: 22 },
  { top: '40%', left: '15%', size: 10 },
]

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const [{ data: teams }, { data: allGames }, { data: allSharks }, { data: allPicks }] =
      await Promise.all([
        supabase.from('nfl_teams').select('*'),
        supabase.from('games').select('*').order('week').order('kickoff_at'),
        supabase.from('baby_sharks').select('*'),
        supabase.from('picks').select('*'),
      ])

    const teamsById = new Map((teams ?? []).map((t) => [t.id, t]))
    const games = (allGames ?? []).slice(0, 3)
    const topSharks = rankSharks(allSharks ?? [], allPicks ?? [], allGames ?? []).slice(0, 4)

    return (
      <div className="flex flex-1 flex-col">
        <section className="relative bg-gradient-to-b from-sky via-blue to-navy px-4 py-16 text-white sm:py-24">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="absolute rounded-full bg-white/20"
              style={{ top: b.top, left: b.left, width: b.size, height: b.size }}
            />
          ))}

          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="font-display text-5xl leading-tight font-semibold sm:text-6xl">
                <span className="block text-white drop-shadow-sm">Pick your team.</span>
                <span className="block text-gold drop-shadow-sm">Win big.</span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-white/90">
                Join Baby Sharks and start picking winning teams today!
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-white px-6 py-3 font-semibold text-blue shadow hover:bg-white/90"
                >
                  Play Now
                </Link>
                <Link
                  href="/how-it-works"
                  className="rounded-full border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
                >
                  How It Works
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
              {(teams ?? [])
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((team) => (
                  <div
                    key={team.id}
                    className="flex aspect-square items-center justify-center rounded-full bg-white/90 p-1.5 shadow-md"
                  >
                    <TeamLogo team={team} size={36} />
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-16 grid w-full max-w-5xl grid-cols-2 gap-6 rounded-2xl bg-white p-6 px-4 shadow-xl sm:grid-cols-4 sm:px-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-1 text-center">
              <span className="text-4xl" aria-hidden="true">
                {f.emoji}
              </span>
              <h3 className="font-display text-lg text-navy">{f.title}</h3>
              <p className="text-sm text-navy/60">{f.description}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
          <div className="rounded-2xl border border-fog p-5">
            <h2 className="font-display text-lg text-navy">Upcoming Games</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {(games ?? []).map((game) => {
                const home = teamsById.get(game.home_team_id)
                const away = teamsById.get(game.away_team_id)
                return (
                  <li
                    key={game.id}
                    className="flex flex-col gap-2 text-sm text-navy sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <TeamLogo team={away} size={24} />
                      <span>
                        {away?.city} {away?.name}
                      </span>
                      <span className="text-navy/40">@</span>
                      <TeamLogo team={home} size={24} />
                      <span>
                        {home?.city} {home?.name}
                      </span>
                    </span>
                    <Link
                      href={user ? '/' : '/signup'}
                      className="self-start shrink-0 rounded-full bg-blue px-3 py-1 text-xs font-semibold text-white hover:bg-blue/90 sm:self-auto"
                    >
                      Pick Now
                    </Link>
                  </li>
                )
              })}
              {(!games || games.length === 0) && (
                <li className="text-sm text-navy/50">No games scheduled yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-fog p-5">
            <h2 className="font-display text-lg text-navy">Leaderboard</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {topSharks.map((entry, i) => (
                <li
                  key={entry.shark.id}
                  className="flex items-center justify-between text-sm text-navy"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                      {i + 1}
                    </span>
                    {entry.shark.name}
                  </span>
                  <span className="text-navy/60">
                    {entry.wins}-{entry.losses}
                  </span>
                </li>
              ))}
              {topSharks.length === 0 && (
                <li className="text-sm text-navy/50">No Baby Sharks yet &mdash; be the first!</li>
              )}
            </ul>
            <Link
              href="/leaderboard"
              className="mt-4 block rounded-full bg-blue py-2 text-center text-sm font-semibold text-white hover:bg-blue/90"
            >
              View Full Leaderboard
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const [{ data: myBabySharks }, { data: followedRows }] = await Promise.all([
    supabase.from('baby_sharks').select('*').eq('owner_id', user.id),
    supabase.from('follows').select('baby_shark_id').eq('follower_id', user.id),
  ])

  const feedSharkIds = Array.from(
    new Set([
      ...(myBabySharks ?? []).map((s) => s.id),
      ...(followedRows ?? []).map((r) => r.baby_shark_id),
    ])
  )

  let feedPicks: Pick[] = []
  let feedSharks: BabyShark[] = []
  let feedGames: Game[] = []
  let feedTeams: NflTeam[] = []

  if (feedSharkIds.length > 0) {
    const [{ data: picks }, { data: sharks }, { data: games }, { data: teams }] =
      await Promise.all([
        supabase
          .from('picks')
          .select('*')
          .in('baby_shark_id', feedSharkIds)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('baby_sharks').select('*').in('id', feedSharkIds),
        supabase.from('games').select('*'),
        supabase.from('nfl_teams').select('*'),
      ])
    feedPicks = picks ?? []
    feedSharks = sharks ?? []
    feedGames = games ?? []
    feedTeams = teams ?? []
  }

  const sharksById = new Map(feedSharks.map((s) => [s.id, s]))
  const gamesById = new Map(feedGames.map((g) => [g.id, g]))
  const teamsById = new Map(feedTeams.map((t) => [t.id, t]))

  // Group picks by (shark, week) so the feed reads as "here's what each
  // shark picked this week" instead of one card per individual pick.
  type FeedGroup = {
    key: string
    shark: BabyShark
    week: number
    picks: { pick: Pick; team: NflTeam | undefined; opponent: NflTeam | undefined }[]
    latestCreatedAt: string
  }

  const groups = new Map<string, FeedGroup>()
  for (const pick of feedPicks) {
    const shark = sharksById.get(pick.baby_shark_id)
    const game = gamesById.get(pick.game_id)
    if (!shark || !game) continue

    const key = `${shark.id}-${game.week}`
    const pickedTeam = teamsById.get(pick.picked_team_id)
    const opponentId =
      pick.picked_team_id === game.home_team_id ? game.away_team_id : game.home_team_id
    const opponent = teamsById.get(opponentId)

    const group = groups.get(key)
    if (group) {
      group.picks.push({ pick, team: pickedTeam, opponent })
      if (pick.created_at > group.latestCreatedAt) group.latestCreatedAt = pick.created_at
    } else {
      groups.set(key, {
        key,
        shark,
        week: game.week,
        picks: [{ pick, team: pickedTeam, opponent }],
        latestCreatedAt: pick.created_at,
      })
    }
  }

  const feedGroups = Array.from(groups.values()).sort((a, b) =>
    b.latestCreatedAt.localeCompare(a.latestCreatedAt)
  )

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-xl text-navy">Your Feed</h1>

      {feedSharkIds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-fog p-8 text-center">
          <span className="text-4xl" aria-hidden="true">
            🦈
          </span>
          <p className="text-navy/60">
            Create a Baby Shark or follow one to start seeing picks here.
          </p>
          <Link
            href="/baby-sharks/new"
            className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue/90"
          >
            Create a Baby Shark
          </Link>
        </div>
      ) : feedGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-fog p-8 text-center">
          <span className="text-4xl" aria-hidden="true">
            🏈
          </span>
          <p className="text-navy/60">No picks yet from your Baby Sharks.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {feedGroups.map((group) => (
            <li key={group.key}>
              <Link
                href={`/baby-sharks/${group.shark.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-fog bg-white p-4 shadow-sm transition-colors hover:border-blue/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <SharkAvatar name={group.shark.name} avatarUrl={group.shark.avatar_url} size={36} />
                    <div>
                      <p className="font-display text-sm text-navy">{group.shark.name}</p>
                      <p className="text-xs text-navy/50">Week {group.week}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-navy/40">
                    {relativeTime(group.latestCreatedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.picks.map(({ pick, team, opponent }) => (
                    <div
                      key={pick.id}
                      className="flex items-center gap-1.5 rounded-full bg-sky/10 py-1 pr-2.5 pl-1"
                    >
                      <TeamLogo team={team} size={22} />
                      <span className="text-xs font-medium text-navy">{team?.city}</span>
                      <span className="text-[10px] text-navy/40">vs {opponent?.id ?? '?'}</span>
                    </div>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
