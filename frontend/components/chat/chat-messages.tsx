"use client"

import { useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type Message = {
  id: string
  userId: string
  userName?: string
  content: string
  // timestamp: number
  isSystemMessage?: boolean
}

interface ChatMessagesProps {
  messages: Message[]
  userId: string,
  roomId: string
  // isAdmin : boolean
}

export function ChatMessages({ messages, userId, roomId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const chatLink = `https://ttl-based-chats.vercel.app/chat/${roomId}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chatLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex-1 overflow-y-auto bg-background p-4">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60">Start the conversation by Copy and sharing the link...</p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                <span className="truncate max-w-[220px] sm:max-w-none">
                  {chatLink}
                </span>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 w-7"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {message.isSystemMessage ? (
                <div className="flex items-center justify-center py-2">
                  <div className="border-t border-border flex-1"></div>
                  <span className="px-3 text-xs text-muted-foreground">{message.content}</span>
                  <div className="border-t border-border flex-1"></div>
                </div>
              ) : (
                <div className="group">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">{userId === message.userId ? "you" : message.userName ?? "unknown"}
                    </span>
                    {/* <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span> */}
                  </div>
                  <div className="mt-1 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground">
                    {message.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
