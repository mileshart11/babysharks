import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SharkAvatar } from '@/components/shark-avatar'

export default async function ManageSharksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sharks } = await supabase
    .from('baby_sharks')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-navy">Manage My Sharks</h1>
        <Link
          href="/baby-sharks/new"
          className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue/90"
        >
          + New Baby Shark
        </Link>
      </div>

      {sharks && sharks.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {sharks.map((shark) => (
            <li
              key={shark.id}
              className="flex flex-col gap-3 rounded-xl border border-fog p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <SharkAvatar name={shark.name} avatarUrl={shark.avatar_url} size={48} />
                <div>
                  <p className="font-display text-lg text-navy">{shark.name}</p>
                  {shark.bio && <p className="text-sm text-navy/60">{shark.bio}</p>}
                  {shark.search_code && (
                    <p className="text-xs text-navy/50">
                      Search code:{' '}
                      <span className="font-mono font-semibold">{shark.search_code}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 text-sm font-semibold">
                <Link
                  href={`/baby-sharks/${shark.id}`}
                  className="rounded-full border border-blue px-3 py-1.5 text-blue hover:bg-blue/5"
                >
                  Make Picks
                </Link>
                <Link
                  href={`/baby-sharks/${shark.id}/edit`}
                  className="rounded-full border border-navy/20 px-3 py-1.5 text-navy hover:bg-navy/5"
                >
                  Edit Profile
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-navy/60">
          You don&apos;t manage any Baby Sharks yet.{' '}
          <Link href="/baby-sharks/new" className="text-blue underline">
            Create one
          </Link>
          .
        </p>
      )}
    </div>
  )
}
