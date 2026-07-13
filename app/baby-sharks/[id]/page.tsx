import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  followBabyShark,
  unfollowBabyShark,
  deletePick,
} from '@/app/baby-sharks/actions'
import { computeRecord } from '@/lib/records'
import { SubmitButton } from '@/components/submit-button'
import { SharkAvatar } from '@/components/shark-avatar'
import { TeamLogo } from '@/components/team-logo'
import type { Game, NflTeam, Pick } from '@/lib/supabase/types'

function teamLabel(team: NflTeam | undefined) {
  return team ? `${team.city} ${team.name}` : 'Unknown'
}

export default async function BabySharkPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const supabase = await createClient()

  const [{ data: shark }, { data: teams }, { data: games }, { data: picks }] =
    await Promise.all([
      supabase.from('baby_sharks').select('*').eq('id', id).single(),
      supabase.from('nfl_teams').select('*'),
      supabase.from('games').select('*').order('week').order('kickoff_at'),
      supabase.from('picks').select('*').eq('baby_shark_id', id),
    ])

  if (!shark) notFound()

  const [{ data: owner }, {
    data: { user },
  }] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', shark.owner_id).single(),
    supabase.auth.getUser(),
  ])

  const [{ count: followerCount }, { data: myFollow }] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('baby_shark_id', id),
    user
      ? supabase
          .from('follows')
          .select('id')
          .eq('baby_shark_id', id)
          .eq('follower_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isOwner = user?.id === shark.owner_id
  const isFollowing = Boolean(myFollow)

  const teamsById = new Map<string, NflTeam>((teams ?? []).map((t) => [t.id, t]))
  const picksByGameId = new Map<string, Pick>((picks ?? []).map((p) => [p.game_id, p]))

  const gamesByWeek = new Map<number, Game[]>()
  for (const game of games ?? []) {
    const list = gamesByWeek.get(game.week) ?? []
    list.push(game)
    gamesByWeek.set(game.week, list)
  }

  const { wins, losses, pushes } = computeRecord(id, picks ?? [], games ?? [])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SharkAvatar name={shark.name} avatarUrl={shark.avatar_url} size={56} />
            <div>
              <h1 className="text-2xl font-semibold">{shark.name}</h1>
              <p className="text-sm text-zinc-600">
                Managed by @{owner?.username ?? 'unknown'}
                {shark.shark_type && (
                  <> &middot; {shark.shark_type === 'baby' ? 'Baby Shark' : 'Pet Shark'}</>
                )}
              </p>
            </div>
          </div>
          {isOwner ? (
            <Link
              href={`/baby-sharks/${shark.id}/edit`}
              className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Edit Profile
            </Link>
          ) : (
            user && (
              <form action={isFollowing ? unfollowBabyShark : followBabyShark}>
                <input type="hidden" name="baby_shark_id" value={shark.id} />
                <SubmitButton className="rounded border px-4 py-2 text-sm hover:bg-zinc-50">
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </SubmitButton>
              </form>
            )
          )}
        </div>
        {shark.bio && <p className="text-zinc-700">{shark.bio}</p>}
        {shark.search_code && (
          <p className="text-sm text-zinc-500">
            Search code: <span className="font-mono font-semibold">{shark.search_code}</span>
          </p>
        )}
        <div className="flex gap-6 text-sm text-zinc-600">
          <span>{followerCount ?? 0} followers</span>
          <span>
            Season record: {wins}-{losses}
            {pushes > 0 ? `-${pushes}` : ''}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        {[...gamesByWeek.entries()].map(([week, weekGames]) => (
          <div key={week} className="flex flex-col gap-3">
            <h2 className="font-display text-lg text-navy">Week {week}</h2>
            <ul className="flex flex-col gap-3">
              {weekGames.map((game) => {
                const home = teamsById.get(game.home_team_id)
                const away = teamsById.get(game.away_team_id)
                const pick = picksByGameId.get(game.id)
                const kickoff = new Date(game.kickoff_at)
                const awayPicked = pick?.picked_team_id === game.away_team_id
                const homePicked = pick?.picked_team_id === game.home_team_id

                return (
                  <li
                    key={game.id}
                    className="rounded-2xl border border-fog bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div
                        className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-2 text-center ${awayPicked ? 'bg-sky/20' : ''}`}
                      >
                        <TeamLogo team={away} size={48} />
                        <span className="text-xs font-medium text-navy">{teamLabel(away)}</span>
                      </div>
                      <span className="font-display text-sm text-navy/40">@</span>
                      <div
                        className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-2 text-center ${homePicked ? 'bg-sky/20' : ''}`}
                      >
                        <TeamLogo team={home} size={48} />
                        <span className="text-xs font-medium text-navy">{teamLabel(home)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-xs text-navy/50">
                      {kickoff.toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>

                    {isOwner ? (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Link
                          href={`/baby-sharks/${shark.id}/tap-pick/${game.id}`}
                          className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue/90"
                        >
                          {pick ? '🖐️ Change Pick' : '🖐️ Tap to Pick'}
                        </Link>
                        {pick && (
                          <form action={deletePick}>
                            <input type="hidden" name="baby_shark_id" value={shark.id} />
                            <input type="hidden" name="game_id" value={game.id} />
                            <SubmitButton
                              pendingText="Removing…"
                              className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              Delete pick
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    ) : (
                      !pick && (
                        <p className="mt-3 text-center text-sm text-navy/50">No pick yet</p>
                      )
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <Link href="/" className="text-sm underline">
        Back home
      </Link>
    </div>
  )
}
