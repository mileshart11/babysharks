'use server'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Gate of last resort even if someone guesses the route directly — 404s
// rather than redirecting to /login, so the page's existence isn't hinted
// at for anyone but an actual admin.
async function requireAdmin() {
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
  return user
}

export async function createUserAsAdmin(formData: FormData) {
  await requireAdmin()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const username = String(formData.get('username') ?? '').trim()

  if (!email || !password || !username) {
    redirect('/admin?error=' + encodeURIComponent('All fields are required.'))
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  })

  if (error) {
    redirect('/admin?error=' + encodeURIComponent(error.message))
  }

  redirect('/admin?success=' + encodeURIComponent(`Created ${data.user.email}.`))
}
