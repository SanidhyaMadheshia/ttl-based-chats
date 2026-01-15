"use client"

import { Clock, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen grid-pattern flex items-center justify-center overflow-hidden pt-16">
      {/* Gradient orbs for subtle visual interest */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 inline-block">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
            <Clock className="w-3 h-3" />
            TTL-Based Architecture
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          Chat that <span className="text-accent">disappears</span>.
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Real-time messaging with automatic expiration. No signup. No storage. Just ephemeral conversations that vanish
          by design.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition inline-flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Create a Room
          </button>
          <button className="px-6 py-3 rounded-lg border border-border bg-background hover:bg-secondary/10 text-foreground font-medium transition">
            View Docs
          </button>
        </div>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </div>
      </div>
    </section>
  )
}
