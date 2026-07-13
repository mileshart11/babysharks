import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unfollowBabyShark } from '@/app/baby-sharks/actions'
import { SubmitButton } from '@/components/submit-button'
import type { BabyShark } from '@/lib/supabase/types'

export default async function FollowingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: followRows } = await supabase
    .from('follows')
    .select('baby_shark_id')
    .eq('follower_id', user.id)

  const followedIds = (followRows ?? []).map((row) => row.baby_shark_id)
  const { data: following } = followedIds.length
    ? await supabase.from('baby_sharks').select('*').in('id', followedIds)
    : { data: [] as BabyShark[] }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-navy">Following</h1>
        <Link
          href="/find-sharks"
          className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue/90"
        >
          Find Sharks to Follow
        </Link>
      </div>

      {following && following.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {following.map((shark) => (
            <li
              key={shark.id}
              className="flex items-center justify-between rounded-xl border border-fog p-4"
            >
              <Link
                href={`/baby-sharks/${shark.id}`}
                className="font-display text-navy hover:underline"
              >
                {shark.name}
              </Link>
              <form action={unfollowBabyShark}>
                <input type="hidden" name="baby_shark_id" value={shark.id} />
                <SubmitButton className="rounded-full border border-navy/20 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-navy/5">
                  Unfollow
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-navy/60">
          You&apos;re not following any Baby Sharks yet.{' '}
          <Link href="/find-sharks" className="text-blue underline">
            Find some
          </Link>
          .
        </p>
      )}
    </div>
  )
}
