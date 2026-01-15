"use client"

import { useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"

type Message = {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
  isSystemMessage?: boolean
}

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60">Start the conversation...</p>
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
                    <span className="text-sm font-medium text-foreground">{message.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
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
