"use client"

import { useState } from "react"
import { Users, AlertCircle, LogOut, MicOff, Trash2, Check, X, Mic, PhoneMissed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type User = {
  id: string
  name: string
  isAdmin: boolean
}

type VoiceUser = {
  id: string
  name: string
  isAdmin: boolean
  isMuted: boolean
}

interface ChatSidebarProps {
  users: User[]
  voiceUsers: VoiceUser[]
  pendingRequests: number
  onRemoveUser: (userId: string) => void
  onMuteUser: (userId: string) => void
  onApproveRequest: (index: number) => void
  onRejectRequest: (index: number) => void
  onMuteVoiceUser: (userId: string) => void
  onRemoveVoiceUser: (userId: string) => void
  isUserInVoice: boolean
}

export function ChatSidebar({
  users,
  voiceUsers,
  pendingRequests,
  onRemoveUser,
  onMuteUser,
  onApproveRequest,
  onRejectRequest,
  onMuteVoiceUser,
  onRemoveVoiceUser,
  isUserInVoice,
}: ChatSidebarProps) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const isAdmin = true

  return (
    <aside className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
      {isAdmin && pendingRequests > 0 && (
        <Card className="mb-4 bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">{pendingRequests} Join Requests</h3>
          </div>
          <div className="space-y-2">
            {Array.from({ length: pendingRequests }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-muted-foreground truncate">User_{i + 1}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onApproveRequest(i)}>
                  <Check className="h-3 w-3 text-accent" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onRejectRequest(i)}>
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {voiceUsers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">In Voice ({voiceUsers.length})</h2>
          </div>
          <div className="space-y-2">
            {voiceUsers.map((user) => (
              <div
                key={user.id}
                className="group flex items-center justify-between rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 transition-colors hover:bg-green-500/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-2 w-2 rounded-full ${user.isMuted ? "bg-destructive" : "bg-green-500 animate-pulse"}`}
                  ></div>
                  <span className="text-sm text-foreground truncate">{user.name}</span>
                  {user.isMuted && <span className="text-xs text-destructive">muted</span>}
                </div>
                {isAdmin && user.id !== "1" && (
                  <div className="hidden gap-1 group-hover:flex">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => onMuteVoiceUser(user.id)}
                      title={user.isMuted ? "Unmute" : "Mute"}
                    >
                      <MicOff className={`h-3 w-3 ${user.isMuted ? "text-destructive" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => onRemoveVoiceUser(user.id)}
                      title="Remove from voice"
                    >
                      <PhoneMissed className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Users ({users.length})</h2>
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="group flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full bg-accent"></div>
                <span className="text-sm text-foreground truncate">{user.name}</span>
                {user.isAdmin && <span className="text-xs text-accent">(admin)</span>}
              </div>
              {isAdmin && !user.isAdmin && (
                <div className="hidden gap-1 group-hover:flex">
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => onMuteUser(user.id)}>
                    <MicOff className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => onRemoveUser(user.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full bg-transparent" size="sm">
        <LogOut className="h-4 w-4 mr-2" />
        Leave Chat
      </Button>
    </aside>
  )
}
