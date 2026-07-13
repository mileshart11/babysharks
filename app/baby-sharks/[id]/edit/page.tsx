import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateBabyShark } from '@/app/baby-sharks/actions'
import { SubmitButton } from '@/components/submit-button'

export default async function EditBabySharkPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await props.params
  const { error } = await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shark } = await supabase.from('baby_sharks').select('*').eq('id', id).single()
  if (!shark) notFound()
  if (shark.owner_id !== user.id) redirect(`/baby-sharks/${id}`)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="font-display text-2xl text-navy">Edit {shark.name}</h1>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form action={updateBabyShark} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={shark.id} />
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="name"
            type="text"
            required
            defaultValue={shark.name}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Bio
          <textarea
            name="bio"
            rows={3}
            defaultValue={shark.bio ?? ''}
            className="rounded border px-3 py-2"
          />
        </label>
        <SubmitButton
          pendingText="Saving…"
          className="rounded-full bg-blue px-4 py-2 font-semibold text-white hover:bg-blue/90"
        >
          Save changes
        </SubmitButton>
      </form>
    </div>
  )
}
