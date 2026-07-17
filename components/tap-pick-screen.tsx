'use client'

import { useState, useTransition } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  function choose(teamId: string) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('baby_shark_id', babySharkId)
      formData.set('game_id', gameId)
      formData.set('picked_team_id', teamId)
      const result = await makePick(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push(`/baby-sharks/${babySharkId}`)
    })
  }

  const awayColor = fadeColor(awayTeam.primary_color ?? '#0e3b6e')
  const homeColor = fadeColor(distinctTeamColor(homeTeam, awayTeam.primary_color ?? '#0e3b6e'))

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {error && (
        <p className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
          {error}
        </p>
      )}
      <div className="flex flex-1 overflow-hidden">
        {[
          { team: awayTeam, color: awayColor },
          { team: homeTeam, color: homeColor },
        ].map(({ team, color }) => (
          <button
            key={team.id}
            type="button"
            disabled={isPending}
            onClick={() => choose(team.id)}
            className="flex flex-1 flex-col items-center justify-center overflow-y-auto text-center text-navy transition-opacity active:opacity-80 disabled:opacity-60"
            style={{
              backgroundColor: color,
              gap: 'clamp(0.5rem, 3vmin, 1.5rem)',
              padding: 'clamp(0.75rem, 4vmin, 2rem)',
            }}
          >
            <span
              className="font-display"
              style={{ fontSize: 'clamp(1.1rem, 5vmin, 2.5rem)' }}
            >
              {team.city}
            </span>
            {team.logo_url && (
              <div
                className="flex shrink-0 items-center justify-center rounded-full bg-white shadow-lg"
                style={{
                  width: 'clamp(5.5rem, 24vmin, 15rem)',
                  height: 'clamp(5.5rem, 24vmin, 15rem)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="object-contain"
                  style={{ width: '78%', height: '78%' }}
                />
              </div>
            )}
            <span
              className="font-display leading-tight font-bold"
              style={{ fontSize: 'clamp(1.4rem, 7vmin, 3.5rem)' }}
            >
              {team.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
