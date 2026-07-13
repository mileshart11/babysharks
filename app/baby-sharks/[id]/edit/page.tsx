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
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">Type</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="shark_type"
              value="baby"
              required
              defaultChecked={shark.shark_type === 'baby'}
            />
            Baby Shark (a child, under 12)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="shark_type"
              value="pet"
              required
              defaultChecked={shark.shark_type === 'pet'}
            />
            Pet Shark (a pet)
          </label>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm">
          Profile picture
          {shark.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shark.avatar_url}
              alt={shark.name}
              className="mb-1 h-20 w-20 rounded-full object-cover"
            />
          )}
          <input name="avatar" type="file" accept="image/*" className="text-sm" />
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
