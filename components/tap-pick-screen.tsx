'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { makePick } from '@/app/baby-sharks/actions'
import { distinctTeamColor, fadeColor } from '@/lib/colors'
import type { NflTeam } from '@/lib/supabase/types'

export function TapPickScreen({
  babySharkId,
  gameId,
  homeTeam,
  awayTeam,
}: {
  babySharkId: string
  gameId: string
  homeTeam: NflTeam
  awayTeam: NflTeam
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function choose(teamId: string) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('baby_shark_id', babySharkId)
      formData.set('game_id', gameId)
      formData.set('picked_team_id', teamId)
      await makePick(formData)
      router.push(`/baby-sharks/${babySharkId}`)
    })
  }

  const awayColor = fadeColor(awayTeam.primary_color ?? '#0e3b6e')
  const homeColor = fadeColor(distinctTeamColor(homeTeam, awayTeam.primary_color ?? '#0e3b6e'))

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      {[
        { team: awayTeam, color: awayColor },
        { team: homeTeam, color: homeColor },
      ].map(({ team, color }) => (
        <button
          key={team.id}
          type="button"
          disabled={isPending}
          onClick={() => choose(team.id)}
          className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center text-navy transition-opacity active:opacity-80 disabled:opacity-60 sm:gap-6"
          style={{ backgroundColor: color }}
        >
          <span className="font-display text-2xl sm:text-4xl">{team.city}</span>
          {team.logo_url && (
            <div className="flex h-44 w-44 items-center justify-center rounded-full bg-white shadow-lg sm:h-64 sm:w-64 md:h-72 md:w-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.logo_url}
                alt={team.name}
                className="h-36 w-36 object-contain sm:h-52 sm:w-52 md:h-60 md:w-60"
              />
            </div>
          )}
          <span className="font-display text-3xl leading-tight font-bold sm:text-5xl">
            {team.name}
          </span>
        </button>
      ))}
    </div>
  )
}
