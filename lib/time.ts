const LOCK_MINUTES_BEFORE_KICKOFF = 10

export function isPickLocked(kickoffAtIso: string) {
  return Date.now() >= new Date(kickoffAtIso).getTime() - LOCK_MINUTES_BEFORE_KICKOFF * 60_000
}

export function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
