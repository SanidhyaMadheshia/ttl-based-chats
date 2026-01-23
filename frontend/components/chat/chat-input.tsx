"use client"

import type React from "react"

// import { useState } from "react"
import { Send, Smile, Mic, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"


interface ChatInputProps {
  onSendMessage: (message: string) => void
  isMuted: boolean
  onJoinVoice: () => void
  isUserInVoice: boolean
  onLeaveVoice: () => void
}

export function ChatInput({ onSendMessage, isMuted, onJoinVoice, isUserInVoice, onLeaveVoice }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [openEmoji, setOpenEmoji] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    onSendMessage(message)

    setMessage("")
  }
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setOpenEmoji(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  const handleEmojiClick = (emoji: EmojiClickData) => {
    setMessage(prev => prev + emoji.emoji)
    setOpenEmoji(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-card p-2 pb-safe">
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isMuted}
          className="flex-1"
        />
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="px-2"
            title="Emoji picker"
            onClick={() => setOpenEmoji(prev => !prev)}
          >
            <Smile className="h-5 w-5" />
          </Button>

          {openEmoji && (
            <div
              ref={emojiRef}
              className="absolute bottom-12 left-0 z-50"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={300}
                width={280}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>

        {/* <Button size="sm" variant="ghost" className="px-2" title="Mic input">
          <Mic className="h-5 w-5" />
        </Button> */}
        {/* <Button
          size="sm"
          variant={isUserInVoice ? "destructive" : "ghost"}
          className="px-2"
          onClick={isUserInVoice ? onLeaveVoice : onJoinVoice}
          title={isUserInVoice ? "Leave voice" : "Join voice"}
        > */}
        {/* <Phone className={`h-5 w-5 ${isUserInVoice ? "" : ""}`} /> */}
        {/* </Button> */}
        <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="gap-2">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  )
}
