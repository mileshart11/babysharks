import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  followBabyShark,
  unfollowBabyShark,
  makePick,
} from '@/app/baby-sharks/actions'
import { computeRecord } from '@/lib/records'
import { SubmitButton } from '@/components/submit-button'
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
          <div>
            <h1 className="text-2xl font-semibold">{shark.name}</h1>
            <p className="text-sm text-zinc-600">
              Managed by @{owner?.username ?? 'unknown'}
            </p>
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
            <h2 className="text-lg font-semibold">Week {week}</h2>
            <ul className="flex flex-col gap-3">
              {weekGames.map((game) => {
                const home = teamsById.get(game.home_team_id)
                const away = teamsById.get(game.away_team_id)
                const pick = picksByGameId.get(game.id)
                const kickoff = new Date(game.kickoff_at)

                return (
                  <li key={game.id} className="rounded border p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {teamLabel(away)} @ {teamLabel(home)}
                      </span>
                      <span className="text-zinc-500">
                        {kickoff.toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {isOwner ? (
                      <form
                        action={makePick}
                        className="mt-3 flex items-center gap-3 text-sm"
                      >
                        <input type="hidden" name="baby_shark_id" value={shark.id} />
                        <input type="hidden" name="game_id" value={game.id} />
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="picked_team_id"
                            value={game.away_team_id}
                            defaultChecked={pick?.picked_team_id === game.away_team_id}
                            required
                          />
                          {teamLabel(away)}
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="picked_team_id"
                            value={game.home_team_id}
                            defaultChecked={pick?.picked_team_id === game.home_team_id}
                            required
                          />
                          {teamLabel(home)}
                        </label>
                        <SubmitButton
                          pendingText="Saving…"
                          className="rounded bg-black px-3 py-1.5 text-white hover:bg-zinc-800"
                        >
                          {pick ? 'Update pick' : 'Pick'}
                        </SubmitButton>
                      </form>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-600">
                        Pick:{' '}
                        {pick
                          ? teamLabel(teamsById.get(pick.picked_team_id))
                          : 'No pick yet'}
                      </p>
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
