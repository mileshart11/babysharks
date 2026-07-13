import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TapPickScreen } from '@/components/tap-pick-screen'

export default async function TapPickPage(props: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id, gameId } = await props.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: shark }, { data: game }] = await Promise.all([
    supabase.from('baby_sharks').select('*').eq('id', id).single(),
    supabase.from('games').select('*').eq('id', gameId).single(),
  ])

  if (!shark || !game) notFound()
  if (shark.owner_id !== user.id) redirect(`/baby-sharks/${id}`)

  const [{ data: homeTeam }, { data: awayTeam }] = await Promise.all([
    supabase.from('nfl_teams').select('*').eq('id', game.home_team_id).single(),
    supabase.from('nfl_teams').select('*').eq('id', game.away_team_id).single(),
  ])

  if (!homeTeam || !awayTeam) notFound()

  return (
    <TapPickScreen babySharkId={id} gameId={gameId} homeTeam={homeTeam} awayTeam={awayTeam} />
  )
}
