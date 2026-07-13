import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createBabyShark } from '@/app/baby-sharks/actions'
import { SubmitButton } from '@/components/submit-button'

export default async function NewBabySharkPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Create a Baby Shark</h1>
      <p className="text-sm text-zinc-600">
        A Baby Shark is a pick-making profile you manage &mdash; for a pet, a
        kid, yourself, whatever. It picks NFL games and builds its own
        record.
      </p>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form action={createBabyShark} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="name"
            type="text"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Bio (optional)
          <textarea name="bio" rows={3} className="rounded border px-3 py-2" />
        </label>
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">Type</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="shark_type" value="baby" required />
            Baby Shark (a child, under 12)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="shark_type" value="pet" required />
            Pet Shark (a pet)
          </label>
        </fieldset>
        <SubmitButton
          pendingText="Creating…"
          className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
        >
          Create
        </SubmitButton>
      </form>
    </div>
  )
}
