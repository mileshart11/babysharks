import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createUserAsAdmin } from '@/app/admin/actions'
import { PasswordInput } from '@/components/password-input'
import { SubmitButton } from '@/components/submit-button'

export default async function AdminPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) notFound()

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Add a user</h1>
      <p className="text-sm text-zinc-600">
        Creates a fully confirmed account directly, no signup email required.
      </p>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
      )}
      <form action={createUserAsAdmin} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            name="username"
            type="text"
            required
            minLength={3}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Temporary password
          <PasswordInput name="password" required minLength={6} />
        </label>
        <SubmitButton
          pendingText="Creating…"
          className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          Create account
        </SubmitButton>
      </form>
    </div>
  )
}
