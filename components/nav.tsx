import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import { SubmitButton } from '@/components/submit-button'

const BASE_NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/how-it-works', label: 'How It Works' },
]

export async function Nav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let username: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    username = profile?.username ?? null
  }

  const navLinks = user
    ? [
        BASE_NAV_LINKS[0],
        { href: '/manage-sharks', label: 'Manage My Sharks' },
        { href: '/following', label: 'Following' },
        ...BASE_NAV_LINKS.slice(1),
      ]
    : BASE_NAV_LINKS

  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-nav.png"
            alt="Baby Sharks"
            width={202}
            height={80}
            priority
            className="h-20 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-navy md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-navy/70 sm:inline">
                Hi, {username ?? user.email}
              </span>
              <form action={signOut}>
                <SubmitButton
                  pendingText="Logging out…"
                  className="rounded-full border border-blue px-4 py-1.5 text-sm font-semibold text-blue hover:bg-blue/5"
                >
                  Log out
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-blue px-4 py-1.5 text-sm font-semibold text-blue hover:bg-blue/5"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue/90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
