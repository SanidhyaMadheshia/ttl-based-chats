"use client"

import type React from "react"

import { useState } from "react"
import { Send, Smile, Mic, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isMuted: boolean
  onJoinVoice: () => void
  isUserInVoice: boolean
  onLeaveVoice: () => void
}

export function ChatInput({ onSendMessage, isMuted, onJoinVoice, isUserInVoice, onLeaveVoice }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    onSendMessage(message)
    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isMuted}
          className="flex-1"
        />
        <Button size="sm" variant="ghost" className="px-2" title="Emoji picker">
          <Smile className="h-5 w-5" />
        </Button>
        <Button size="sm" variant="ghost" className="px-2" title="Mic input">
          <Mic className="h-5 w-5" />
        </Button>
        <Button
          size="sm"
          variant={isUserInVoice ? "destructive" : "ghost"}
          className="px-2"
          onClick={isUserInVoice ? onLeaveVoice : onJoinVoice}
          title={isUserInVoice ? "Leave voice" : "Join voice"}
        >
          <Phone className={`h-5 w-5 ${isUserInVoice ? "" : ""}`} />
        </Button>
        <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="gap-2">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  )
}
