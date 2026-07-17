'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateSearchCode } from '@/lib/codes'

const UNIQUE_VIOLATION = '23505'

export async function createBabyShark(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const sharkType = String(formData.get('shark_type') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!name) {
    redirect('/baby-sharks/new?error=' + encodeURIComponent('Name is required.'))
  }
  if (sharkType !== 'baby' && sharkType !== 'pet') {
    redirect('/baby-sharks/new?error=' + encodeURIComponent('Please choose Baby Shark or Pet Shark.'))
  }

  let data: { id: string } | null = null
  let error: { code?: string; message: string } | null = null

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await supabase
      .from('baby_sharks')
      .insert({
        owner_id: user.id,
        name,
        bio: bio || null,
        shark_type: sharkType,
        search_code: generateSearchCode(),
      })
      .select('id')
      .single()

    data = result.data
    error = result.error
    if (!error || error.code !== UNIQUE_VIOLATION) break
  }

  if (error || !data) {
    redirect(
      '/baby-sharks/new?error=' +
        encodeURIComponent(error?.message ?? 'Could not create profile.')
    )
  }

  revalidatePath('/')
  redirect(`/baby-sharks/${data.id}`)
}

const AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif']

export async function updateBabyShark(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const sharkType = String(formData.get('shark_type') ?? '')
  const avatar = formData.get('avatar')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!name) {
    redirect(`/baby-sharks/${id}/edit?error=` + encodeURIComponent('Name is required.'))
  }
  if (sharkType !== 'baby' && sharkType !== 'pet') {
    redirect(
      `/baby-sharks/${id}/edit?error=` +
        encodeURIComponent('Please choose Baby Shark or Pet Shark.')
    )
  }

  const update: Record<string, string | null> = { name, bio: bio || null, shark_type: sharkType }
  let oldAvatarPath: string | null = null

  if (avatar instanceof File && avatar.size > 0) {
    const rawExtension = avatar.name.split('.').pop()?.toLowerCase() ?? ''
    const extension = AVATAR_EXTENSIONS.includes(rawExtension) ? rawExtension : 'jpg'
    const path = `${id}/avatar-${Date.now()}.${extension}`

    // Grab the current avatar path before we overwrite it, so the old file
    // can be removed from storage once the new one is safely in place.
    const { data: existing } = await supabase
      .from('baby_sharks')
      .select('avatar_url')
      .eq('id', id)
      .single()
    oldAvatarPath = existing?.avatar_url?.split('/avatars/').pop() ?? null

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatar, { contentType: avatar.type })

    if (uploadError) {
      redirect(
        `/baby-sharks/${id}/edit?error=` +
          encodeURIComponent('Could not upload profile picture: ' + uploadError.message)
      )
    }

    update.avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }

  const { error } = await supabase
    .from('baby_sharks')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    redirect(`/baby-sharks/${id}/edit?error=` + encodeURIComponent(error.message))
  }

  if (oldAvatarPath) {
    const { error: removeError } = await supabase.storage.from('avatars').remove([oldAvatarPath])
    if (removeError) console.error('Failed to remove old avatar:', removeError)
  }

  revalidatePath(`/baby-sharks/${id}`)
  revalidatePath('/manage-sharks')
  redirect(`/baby-sharks/${id}`)
}

export async function followBabyShark(formData: FormData) {
  const babySharkId = String(formData.get('baby_shark_id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, baby_shark_id: babySharkId })

  if (error) console.error('followBabyShark error:', error)

  revalidatePath(`/baby-sharks/${babySharkId}`)
}

export async function unfollowBabyShark(formData: FormData) {
  const babySharkId = String(formData.get('baby_shark_id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('baby_shark_id', babySharkId)

  if (error) console.error('unfollowBabyShark error:', error)

  revalidatePath(`/baby-sharks/${babySharkId}`)
}

export async function makePick(formData: FormData): Promise<{ error?: string }> {
  const babySharkId = String(formData.get('baby_shark_id') ?? '')
  const gameId = String(formData.get('game_id') ?? '')
  const pickedTeamId = String(formData.get('picked_team_id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('picks')
    .upsert(
      { baby_shark_id: babySharkId, game_id: gameId, picked_team_id: pickedTeamId },
      { onConflict: 'baby_shark_id,game_id' }
    )

  // Returned (not redirected) since this is called directly from a client
  // component, not bound to a <form action>.
  if (error) return { error: error.message }

  revalidatePath(`/baby-sharks/${babySharkId}`)
  return {}
}

export async function deletePick(formData: FormData) {
  const babySharkId = String(formData.get('baby_shark_id') ?? '')
  const gameId = String(formData.get('game_id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('picks')
    .delete()
    .eq('baby_shark_id', babySharkId)
    .eq('game_id', gameId)

  if (error) {
    redirect(`/baby-sharks/${babySharkId}?error=` + encodeURIComponent(error.message))
  }

  revalidatePath(`/baby-sharks/${babySharkId}`)
}
