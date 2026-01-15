"use client"

import { useState, useEffect, use } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { VoiceModal } from "@/components/chat/voice-modal"

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

type Message = {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: number
  isSystemMessage?: boolean
}

export default function ChatRoom({ params }: { params: Promise<{ roomId: string }> }) {
   const { roomId } = use(params)
  const [ttl, setTtl] = useState(3600)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "You", isAdmin: true },
    { id: "2", name: "Alice", isAdmin: false },
    { id: "3", name: "Bob", isAdmin: false },
  ])
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([
    { id: "2", name: "Alice", isAdmin: false, isMuted: false },
  ])
  const [pendingRequests, setPendingRequests] = useState(2)
  const [isMuted, setIsMuted] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [isUserInVoice, setIsUserInVoice] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTtl((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  const handleRemoveUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        userId: "system",
        userName: "System",
        content: `User ${users.find((u) => u.id === userId)?.name} was removed`,
        timestamp: Date.now(),
        isSystemMessage: true,
      },
    ])
  }

  const handleMuteUser = (userId: string) => {
    // Toggle mute state (UI only for demo)
  }

  const handleApproveRequest = (index: number) => {
    setPendingRequests((prev) => Math.max(0, prev - 1))
  }

  const handleRejectRequest = (index: number) => {
    setPendingRequests((prev) => Math.max(0, prev - 1))
  }

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        userId: "1",
        userName: "You",
        content,
        timestamp: Date.now(),
      },
    ])
  }

  const handleJoinVoice = () => {
    const currentUser = users.find((u) => u.id === "1")
    if (currentUser && !isUserInVoice) {
      setVoiceUsers((prev) => [
        ...prev,
        { id: currentUser.id, name: currentUser.name, isAdmin: currentUser.isAdmin, isMuted: false },
      ])
      setIsUserInVoice(true)
      setShowVoiceModal(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          userId: "system",
          userName: "System",
          content: `${currentUser.name} joined voice`,
          timestamp: Date.now(),
          isSystemMessage: true,
        },
      ])
    }
  }

  const handleLeaveVoice = () => {
    const currentUser = users.find((u) => u.id === "1")
    setVoiceUsers((prev) => prev.filter((u) => u.id !== "1"))
    setIsUserInVoice(false)
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        userId: "system",
        userName: "System",
        content: `${currentUser?.name} left voice`,
        timestamp: Date.now(),
        isSystemMessage: true,
      },
    ])
  }

  const handleMuteVoiceUser = (userId: string) => {
    setVoiceUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isMuted: !u.isMuted } : u)))
  }

  const handleRemoveVoiceUser = (userId: string) => {
    const user = voiceUsers.find((u) => u.id === userId)
    setVoiceUsers((prev) => prev.filter((u) => u.id !== userId))
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        userId: "system",
        userName: "System",
        content: `${user?.name} was removed from voice`,
        timestamp: Date.now(),
        isSystemMessage: true,
      },
    ])
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader roomId={roomId} ttl={ttl} formattedTime={formatTime(ttl)} />
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          users={users}
          voiceUsers={voiceUsers}
          pendingRequests={pendingRequests}
          onRemoveUser={handleRemoveUser}
          onMuteUser={handleMuteUser}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onMuteVoiceUser={handleMuteVoiceUser}
          onRemoveVoiceUser={handleRemoveVoiceUser}
          isUserInVoice={isUserInVoice}
        />
        <div className="flex flex-1 flex-col">
          <ChatMessages messages={messages} />
          <ChatInput
            onSendMessage={handleSendMessage}
            isMuted={isMuted}
            onJoinVoice={() => setShowVoiceModal(true)}
            isUserInVoice={isUserInVoice}
            onLeaveVoice={handleLeaveVoice}
          />
        </div>
      </div>
      {showVoiceModal && (
        <VoiceModal onJoin={handleJoinVoice} onClose={() => setShowVoiceModal(false)} voiceUsers={voiceUsers} />
      )}
    </div>
  )
}
