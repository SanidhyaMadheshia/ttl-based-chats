"use client"

import { useState } from "react"
import { Users, AlertCircle, LogOut, MicOff, Trash2, Check, X, Mic, PhoneMissed, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RequestMember } from "@/lib/types"

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
  isVideoOn?: boolean
}

interface ChatSidebarProps {
  users: User[]
  voiceUsers: VoiceUser[]
  pendingRequests: number
  onRemoveUser: (userId: string) => void
  onMuteUser: (userId: string) => void
  onApproveRequest: (index: string) => void
  onRejectRequest: (index: string) => void
  onlineMembers: string[]
  requestMembers: RequestMember[]
  role: string
  isUserInVoice: boolean
  currentUserId: string
}

export function ChatSidebar({
  onlineMembers,
  requestMembers,
  role,
  users,
  voiceUsers,
  pendingRequests,
  onRemoveUser,
  onMuteUser,
  onApproveRequest,
  onRejectRequest,
  isUserInVoice,
  currentUserId,
}: ChatSidebarProps) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const isAdmin = role === "admin" ? true : false

  return (
    <aside className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
      {/* {isAdmin && pendingRequests > 0 && (
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
      )} */}
      {isAdmin && requestMembers.length > 0 && (
        <Card className="mb-4 bg-secondary/50 p-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              {requestMembers.length} Join Requests
            </h3>
          </div>

          <div className="space-y-2">
            {requestMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 text-xs"
              >
                <span className="flex-1 text-muted-foreground truncate">
                  {member.name}
                </span>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onApproveRequest(member.id)}
                >
                  <Check className="h-3 w-3 text-accent" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => onRejectRequest(member.id)}
                >
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
          <ul className="space-y-2">
            {voiceUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${user.isMuted ? "bg-destructive" : "bg-green-500 animate-pulse"}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground truncate">
                    {user.name}
                    {user.id === currentUserId && " (you)"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {user.isVideoOn && <Video className="h-3 w-3 text-accent" aria-label="camera on" />}
                  {user.isMuted && <MicOff className="h-3 w-3 text-destructive" aria-label="muted" />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onlineMembers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-semibold text-foreground">
              Online ({onlineMembers.length})
            </h2>
          </div>

          <div className="space-y-2">
            {onlineMembers.map((memberId) => {
              const member = users.find(u => u.id === memberId)

              return (
                <div
                  key={memberId}
                  className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2"
                >
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-foreground truncate">
                    {member?.name ?? "Unknown user"}
                  </span>
                </div>
              )
            })}
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
                  {/* <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => onMuteUser(user.id)}>
                    <MicOff className="h-3 w-3" />
                  </Button> */}
                  {/* <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => onRemoveUser(user.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button> */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
