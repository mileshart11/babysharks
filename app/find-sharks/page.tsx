import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { followBabyShark, unfollowBabyShark } from '@/app/baby-sharks/actions'
import { SubmitButton } from '@/components/submit-button'
import type { BabyShark } from '@/lib/supabase/types'

export default async function FindSharksPage(props: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await props.searchParams
  const query = (q ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let results: BabyShark[] = []
  if (query) {
    const [{ data: byCode }, { data: byName }] = await Promise.all([
      supabase.from('baby_sharks').select('*').ilike('search_code', query),
      supabase.from('baby_sharks').select('*').ilike('name', `%${query}%`),
    ])
    const byId = new Map<string, BabyShark>()
    for (const shark of [...(byCode ?? []), ...(byName ?? [])]) {
      byId.set(shark.id, shark)
    }
    results = Array.from(byId.values())
  }

  let followingIds = new Set<string>()
  if (user && results.length > 0) {
    const { data: myFollows } = await supabase
      .from('follows')
      .select('baby_shark_id')
      .eq('follower_id', user.id)
      .in(
        'baby_shark_id',
        results.map((s) => s.id)
      )
    followingIds = new Set((myFollows ?? []).map((f) => f.baby_shark_id))
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="font-display text-2xl text-navy">Find Sharks</h1>
      <p className="text-sm text-navy/60">
        Search by name, or enter someone&apos;s search code for an exact match.
      </p>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Name or search code"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white hover:bg-blue/90"
        >
          Search
        </button>
      </form>

      {query && (
        <ul className="flex flex-col gap-3">
          {results.map((shark) => (
            <li
              key={shark.id}
              className="flex items-center justify-between rounded-xl border border-fog p-4"
            >
              <div>
                <Link
                  href={`/baby-sharks/${shark.id}`}
                  className="font-display text-navy hover:underline"
                >
                  {shark.name}
                </Link>
                <p className="text-xs text-navy/50">Code: {shark.search_code}</p>
              </div>
              {user && shark.owner_id !== user.id && (
                <form action={followingIds.has(shark.id) ? unfollowBabyShark : followBabyShark}>
                  <input type="hidden" name="baby_shark_id" value={shark.id} />
                  <SubmitButton className="rounded-full border border-blue px-4 py-1.5 text-sm font-semibold text-blue hover:bg-blue/5">
                    {followingIds.has(shark.id) ? 'Unfollow' : 'Follow'}
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
          {results.length === 0 && (
            <p className="text-sm text-navy/60">No Baby Sharks found for &quot;{query}&quot;.</p>
          )}
        </ul>
      )}
    </div>
  )
}
