"use client"

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Create or Join",
      description: "Generate a new room or join an existing one with just a Room ID and optional password.",
    },
    {
      number: "2",
      title: "Real-Time Chat",
      description: "Invite others and start messaging. Your session is saved locally—no login required.",
    },
    {
      number: "3",
      title: "Auto Expires",
      description: "When the TTL expires, the room, messages, and all user data are automatically deleted.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Three steps to ephemeral chat</h2>
          <p className="text-lg text-muted-foreground">Simple, stateless, and designed for privacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center mb-6 timer-glow">
                  <span className="text-2xl font-bold text-accent">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {idx < 2 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-px bg-gradient-to-r from-accent/50 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
