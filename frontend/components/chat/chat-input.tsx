"use client"

import type React from "react"

// import { useState } from "react"
import { Send, Smile, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import EmojiPicker, { EmojiClickData , Theme} from "emoji-picker-react"


interface ChatInputProps {
  onSendMessage: (message: string) => void
  isMuted: boolean
  onJoinVoice: () => void
  isUserInVoice: boolean
  onLeaveVoice: () => void
  isVoiceMuted: boolean
  onToggleVoiceMute: () => void
  isVideoOn: boolean
  onToggleVideo: () => void
}

export function ChatInput({
  onSendMessage,
  isMuted,
  onJoinVoice,
  isUserInVoice,
  onLeaveVoice,
  isVoiceMuted,
  onToggleVoiceMute,
  isVideoOn,
  onToggleVideo,
}: ChatInputProps) {
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
              className="absolute bottom-full right-0 mb-2 z-50 rounded-lg border bg-background shadow-lg max-w-[90vw]"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={320}
                width={280}
                theme={Theme.DARK}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>


        {isUserInVoice && (
          <Button
            size="sm"
            variant={isVideoOn ? "secondary" : "ghost"}
            className="px-2"
            onClick={onToggleVideo}
            title={isVideoOn ? "Turn camera off" : "Turn camera on"}
            aria-label={isVideoOn ? "Turn camera off" : "Turn camera on"}
            aria-pressed={isVideoOn}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        )}
        {isUserInVoice && (
          <Button
            size="sm"
            variant={isVoiceMuted ? "destructive" : "ghost"}
            className="px-2"
            onClick={onToggleVoiceMute}
            title={isVoiceMuted ? "Unmute microphone" : "Mute microphone"}
            aria-label={isVoiceMuted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={isVoiceMuted}
          >
            {isVoiceMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
        <Button
          size="sm"
          variant={isUserInVoice ? "destructive" : "ghost"}
          className="px-2"
          onClick={isUserInVoice ? onLeaveVoice : onJoinVoice}
          title={isUserInVoice ? "Leave voice" : "Join voice"}
          aria-label={isUserInVoice ? "Leave voice" : "Join voice"}
        >
          {isUserInVoice ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
        </Button>
        <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="gap-2">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  )
}
