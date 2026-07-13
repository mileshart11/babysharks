import Link from 'next/link'
import { signIn } from '@/app/auth/actions'
import { PasswordInput } from '@/components/password-input'
import { SubmitButton } from '@/components/submit-button'

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Log in</h1>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form action={signIn} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <PasswordInput name="password" required />
        </label>
        <SubmitButton
          pendingText="Logging in…"
          className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          Log in
        </SubmitButton>
      </form>
      <p className="text-sm text-zinc-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
