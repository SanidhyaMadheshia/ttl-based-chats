"use client"

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">E</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Ephemeral</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground text-sm transition">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground text-sm transition">
              How it Works
            </a>
            <a href="#privacy" className="text-muted-foreground hover:text-foreground text-sm transition">
              Privacy
            </a>
          </nav>

          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            Start Chatting
          </button>
        </div>
      </div>
    </header>
  )
}
