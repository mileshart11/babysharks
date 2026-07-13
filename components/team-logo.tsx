import type { NflTeam } from '@/lib/supabase/types'

export function TeamLogo({ team, size = 32 }: { team: NflTeam | undefined; size?: number }) {
  if (!team?.logo_url) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.3 }}
        className="flex shrink-0 items-center justify-center rounded-full bg-fog font-bold text-navy"
      >
        {team?.id ?? '?'}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.logo_url}
      alt={team.name}
      style={{ width: size, height: size }}
      className="shrink-0 object-contain"
    />
  )
}
