"use client"

import { Clock, Lock, Zap, Users, Key, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Ephemeral by Default",
    description: "Chat rooms automatically expire. Rooms, messages, and user data vanish after their TTL ends.",
  },
  {
    icon: Zap,
    title: "Real-Time WebSocket",
    description: "Sub-millisecond message delivery. Live presence indicators and instant notifications.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Zero permanent data storage. No databases for conversations. Everything is stateless.",
  },
  {
    icon: Users,
    title: "Admin Controls",
    description: "Room creators can manage participants. Approve/remove users with granular control.",
  },
  {
    icon: Key,
    title: "Simple Access",
    description: "Join with just a Room ID. Optional password protection for sensitive conversations.",
  },
  {
    icon: BarChart3,
    title: "High Performance",
    description: "Redis-backed auto-cleanup. Stateless backend scales infinitely. No maintenance needed.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Built for privacy and simplicity</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built architecture that prioritizes ephemerality, performance, and zero data retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card/50 hover:border-accent/50 hover:bg-card/80 transition-all group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
