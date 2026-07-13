import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { rankSharks } from '@/lib/records'
import { SharkAvatar } from '@/components/shark-avatar'
import type { BabyShark } from '@/lib/supabase/types'

function LeaderboardSection({
  title,
  ranked,
}: {
  title: string
  ranked: ReturnType<typeof rankSharks<BabyShark>>
}) {
  return (
    <section className="rounded-2xl border border-fog p-5">
      <h2 className="font-display text-lg text-navy">{title}</h2>
      {ranked.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-3">
          {ranked.map((entry, i) => (
            <li key={entry.shark.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                  {i + 1}
                </span>
                <SharkAvatar name={entry.shark.name} avatarUrl={entry.shark.avatar_url} size={32} />
                <Link
                  href={`/baby-sharks/${entry.shark.id}`}
                  className="font-medium text-navy hover:underline"
                >
                  {entry.shark.name}
                </Link>
              </div>
              <span className="text-sm text-navy/60">
                {entry.wins}-{entry.losses}
                {entry.pushes > 0 ? `-${entry.pushes}` : ''}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-navy/50">No Baby Sharks here yet.</p>
      )}
    </section>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const [{ data: sharks }, { data: picks }, { data: games }] = await Promise.all([
    supabase.from('baby_sharks').select('*'),
    supabase.from('picks').select('*'),
    supabase.from('games').select('*'),
  ])

  const all = rankSharks(sharks ?? [], picks ?? [], games ?? [])
  const babyOnly = rankSharks(
    (sharks ?? []).filter((s) => s.shark_type === 'baby'),
    picks ?? [],
    games ?? []
  )
  const petOnly = rankSharks(
    (sharks ?? []).filter((s) => s.shark_type === 'pet'),
    picks ?? [],
    games ?? []
  )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="font-display text-2xl text-navy">Leaderboard</h1>
      <LeaderboardSection title="Overall" ranked={all} />
      <LeaderboardSection title="Baby Sharks" ranked={babyOnly} />
      <LeaderboardSection title="Pet Sharks" ranked={petOnly} />
    </div>
  )
}
