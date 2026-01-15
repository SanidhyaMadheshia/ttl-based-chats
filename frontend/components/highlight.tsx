"use client"

import { Terminal } from "lucide-react"

export function Highlight() {
  return (
    <section id="privacy" className="py-24 border-t border-border">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Privacy by architecture</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Traditional chat apps store everything forever. We store nothing permanently. Your conversations are
              managed entirely in Redis with automatic TTL-based cleanup.
            </p>
            <ul className="space-y-4">
              {[
                "Messages purged after room TTL expires",
                "No permanent user accounts or databases",
                "Session data stored only locally",
                "Stateless backend—truly ephemeral",
                "GDPR-compliant by default",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border border-border bg-secondary/30 font-mono text-sm">
            <div className="flex items-center gap-2 mb-4 text-accent">
              <Terminal className="w-4 h-4" />
              <span className="text-xs">redis-cli</span>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <div>
                <span className="text-accent">{">"}</span> SETEX room:xyz 3600 {"{...}"}
              </div>
              <div className="text-muted-foreground/50">OK</div>
              <div className="mt-4">
                <span className="text-accent">{">"}</span> LPUSH messages:xyz {"{...}"}
              </div>
              <div className="text-muted-foreground/50">1</div>
              <div className="mt-4 text-muted-foreground/70"># After 3600s, all data is gone</div>
              <div className="mt-4">
                <span className="text-accent">{">"}</span> GET room:xyz
              </div>
              <div className="text-muted-foreground/50">(nil)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
