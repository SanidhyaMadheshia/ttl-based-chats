import { Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatHeaderProps {
  roomId: string
  ttl: number
  formattedTime: string
}

export function ChatHeader({ roomId, ttl, formattedTime }: ChatHeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">Room {roomId.slice(0, 8)}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary ${ttl < 300 ? "timer-glow" : ""}`}>
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm font-mono text-foreground">{formattedTime}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
