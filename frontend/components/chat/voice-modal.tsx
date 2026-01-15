"use client"

import { X, Mic, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type VoiceUser = {
  id: string
  name: string
  isAdmin: boolean
  isMuted: boolean
}

interface VoiceModalProps {
  onJoin: () => void
  onClose: () => void
  voiceUsers: VoiceUser[]
}

export function VoiceModal({ onJoin, onClose, voiceUsers }: VoiceModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <Card className="w-full max-w-md bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Join Voice</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 rounded-lg bg-secondary/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-accent" />
            <p className="text-sm font-medium text-foreground">In Voice ({voiceUsers.length})</p>
          </div>
          {voiceUsers.length > 0 ? (
            <div className="space-y-2">
              {voiceUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{user.name}</span>
                  <div className="flex items-center gap-1">
                    {user.isMuted && <span className="text-destructive">muted</span>}
                    <div
                      className={`h-2 w-2 rounded-full ${
                        user.isMuted ? "bg-destructive" : "bg-green-500 animate-pulse"
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No one in voice yet</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button onClick={onJoin} className="flex-1 gap-2">
            <Mic className="h-4 w-4" />
            Join Voice
          </Button>
        </div>
      </Card>
    </div>
  )
}
