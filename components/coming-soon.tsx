import Link from 'next/link'

export function ComingSoon({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <h1 className="font-display text-3xl font-semibold text-navy">{title}</h1>
      <p className="text-navy/60">{description}</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white hover:bg-blue/90"
      >
        Back home
      </Link>
    </div>
  )
}
