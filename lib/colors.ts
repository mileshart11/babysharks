function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function colorDistance(hexA: string, hexB: string) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

const MIN_DISTINCT_DISTANCE = 80

// Picks a color for `team` that's visually distinct from `otherColor`,
// falling back to the secondary color when the primaries are too close
// (e.g. New England and Seattle share almost the same navy).
export function distinctTeamColor(
  team: { primary_color: string | null; secondary_color: string | null },
  otherColor: string
) {
  const primary = team.primary_color ?? '#0e3b6e'
  if (colorDistance(primary, otherColor) >= MIN_DISTINCT_DISTANCE) return primary
  return team.secondary_color ?? primary
}

// Blends a color toward white so it still reads as "that team's color"
// without being so saturated that dark-outlined logos disappear into it.
export function fadeColor(hex: string, amount = 0.55) {
  const { r, g, b } = hexToRgb(hex)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}
