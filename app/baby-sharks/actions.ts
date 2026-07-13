'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateSearchCode } from '@/lib/codes'

const UNIQUE_VIOLATION = '23505'

export async function createBabyShark(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!name) {
    redirect('/baby-sharks/new?error=' + encodeURIComponent('Name is required.'))
  }

  let data: { id: string } | null = null
  let error: { code?: string; message: string } | null = null

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await supabase
      .from('baby_sharks')
      .insert({ owner_id: user.id, name, bio: bio || null, search_code: generateSearchCode() })
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

export async function updateBabyShark(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!name) {
    redirect(`/baby-sharks/${id}/edit?error=` + encodeURIComponent('Name is required.'))
  }

  const { error } = await supabase
    .from('baby_sharks')
    .update({ name, bio: bio || null })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    redirect(`/baby-sharks/${id}/edit?error=` + encodeURIComponent(error.message))
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

export async function makePick(formData: FormData) {
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

  if (error) console.error('makePick error:', error)

  revalidatePath(`/baby-sharks/${babySharkId}`)
}
