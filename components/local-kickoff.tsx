'use client'

// Server-rendered dates would show in the server's timezone for every
// visitor. This renders in the browser's own timezone (the viewer's actual
// location) instead — the resulting SSR/CSR text mismatch is expected and
// deliberately suppressed, per React's guidance for date/time content.
export function LocalKickoff({ iso }: { iso: string }) {
  const text = new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return <span suppressHydrationWarning>{text}</span>
}
