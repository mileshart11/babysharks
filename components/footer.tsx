export function Footer() {
  return (
    <footer className="relative mt-auto bg-navy pt-8 pb-6 text-white">
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute -top-[38px] left-0 h-10 w-full text-navy"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,32 C240,64 480,0 720,16 C960,32 1200,64 1440,32 L1440,60 L0,60 Z"
        />
      </svg>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg"
            aria-hidden="true"
          >
            🐠
          </span>
          <p className="text-sm text-white/80">
            Baby Sharks &copy; {new Date().getFullYear()} | Pick. Play. Win!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            aria-label="Instagram"
            className="text-white/80 transition-colors hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="Twitter"
            className="text-white/80 transition-colors hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4 4 0 0 0 1.3 5.5c-.6 0-1.3-.2-1.8-.5v.1a4.1 4.1 0 0 0 3.3 4 4.2 4.2 0 0 1-1.8.1 4.1 4.1 0 0 0 3.9 2.9A8.3 8.3 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1Z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="Discord"
            className="text-white/80 transition-colors hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.3 5.4A17.6 17.6 0 0 0 15.9 4l-.3.5c1.7.4 2.7 1 3.7 1.8a12.6 12.6 0 0 0-10.6 0c1-.8 2.1-1.4 3.7-1.8L12.1 4a17.6 17.6 0 0 0-4.4 1.4C4.9 9 4.1 12.5 4.5 16a17.7 17.7 0 0 0 5.1 2.6l.7-1.1a11 11 0 0 1-1.8-.9l.4-.3a12.6 12.6 0 0 0 10.2 0l.4.3c-.6.4-1.2.6-1.8.9l.7 1.1a17.6 17.6 0 0 0 5.1-2.6c.5-4-.6-7.4-3.2-10.6ZM9.7 14c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.5.7 1.4 1.6c0 .9-.6 1.6-1.4 1.6Zm5.6 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
