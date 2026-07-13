export function SharkAvatar({
  name,
  avatarUrl,
  size = 44,
}: {
  name: string
  avatarUrl: string | null
  size?: number
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-blue font-display text-white"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
