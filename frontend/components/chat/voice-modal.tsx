"use client"

import { X, Mic, Users, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type VoiceUser = {
  id: string
  name: string
  isAdmin: boolean
  isMuted: boolean
  isVideoOn?: boolean
}

interface VoiceModalProps {
  onJoin: (opts: { video: boolean }) => void
  onClose: () => void
  voiceUsers: VoiceUser[]
  isConnecting?: boolean
  error?: string | null
}

export function VoiceModal({ onJoin, onClose, voiceUsers, isConnecting = false, error }: VoiceModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" role="dialog" aria-modal="true" aria-labelledby="voice-modal-title">
      <Card className="w-full max-w-md bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-accent" />
            <h2 id="voice-modal-title" className="text-lg font-semibold text-foreground">Join Call</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0" aria-label="Close">
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
                    {user.isVideoOn && <Video className="h-3 w-3 text-accent" aria-label="camera on" />}
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

        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button onClick={() => onJoin({ video: false })} variant="secondary" className="flex-1 gap-2" disabled={isConnecting}>
            <Mic className="h-4 w-4" />
            {isConnecting ? "Connecting..." : "Voice"}
          </Button>
          <Button onClick={() => onJoin({ video: true })} className="flex-1 gap-2" disabled={isConnecting}>
            <Video className="h-4 w-4" />
            {isConnecting ? "Connecting..." : "Video"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
