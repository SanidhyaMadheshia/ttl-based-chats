"use client"

import { useState, useEffect, use, useRef } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { VoiceModal } from "@/components/chat/voice-modal"
import axios from "axios"
import { RequestJoinModal } from "@/components/requestJoinModal"

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

interface RoleRequest {
  role: string;
}
interface roomExists {
  exists: boolean
}


// const requestMembers: RequestMember[] = [
//   { id: "euw8NixO", name: "sanidhya" }
// ]

import { useRouter } from "next/navigation"
import { RequestMember } from "@/lib/types"


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
  // const [roomId , setRoomId]= useState<string>("");

  const [userId, setUserId] = useState<string>("")
  const [key, setKey] = useState<string>("")
  const [role, setRole] = useState<string>("")
  const wsRef = useRef<WebSocket | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestMembers, setRequestMembers] = useState<RequestMember[]>([])



  const router = useRouter()


  var ws;
  // useEffect(() => {
  //   const uid = localStorage.getItem("userId")
  //   const userKey = localStorage.getItem("userKey")

  //   if (!uid || !userKey) {
  //     console.log(uid, userKey)
  //     setShowRequestModal(true)
  //     return
  //   }
  //   var exists = false ;

  //   setUserId(uid)
  //   async function roomExists() {
  //     const res = await axios.get<roomExists>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roomExists?roomId=${roomId}`)
  //     console.log(res.data)
  //     if(!res.data) {
  //       return false 
  //     }
  //     if(!res.data.exists)  {
  //       console.log("not exits")
  //       router.replace(`/chat/${roomId}/not-found`)
  //       // return res.data.exists
  //     } 
  //     exists= res.data.exists
  //     console.log(exists)
  //   }

  //   async function validateRole() {
  //     try {
  //       const res = await axios.post<RoleRequest>(
  //         `${process.env.NEXT_PUBLIC_BACKEND_URL}/validateRole`,
  //         {
  //           userId: uid,
  //           userKey,
  //           roomId
  //         }
  //       )
  //       console.log(res.data)
  //       if (!res.data.role) {
  //         setShowRequestModal(true)
  //         setRole("")
  //         return
  //       }
  //       console.log(userId, role, userKey)
  //       if (res.data.role === "memberPending") {
  //         console.log("hello redirect ")
  //         router.replace(`/chat/${roomId}/waiting`)
  //         return
  //       }

  //       setRole(res.data.role)
  //       setShowRequestModal(false)
  //     } catch (err) {
  //       setShowRequestModal(true)
  //       // console.error("Role validation failed")
  //       return 
  //     }
  //   }
  //   roomExists()
  //   console.log(exists)
  //   if (!exists) {
  //     console.log("before validate ")
  //     return 
  //   }
  //   console.log("just before validate ")
  //   validateRole()
  // }, [roomId])

  useEffect(() => {
    if (!roomId) return

    const uid = localStorage.getItem("userId")
    const userKey = localStorage.getItem("userKey")

    if (!uid || !userKey) {
      setShowRequestModal(true)
      return
    }

    setUserId(uid)
    setKey(userKey)

    const init = async () => {
      try {
        // 1️⃣ Check room existence
        const roomRes = await axios.get<roomExists>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/roomExists`,
          { params: { roomId } }
        )

        if (!roomRes.data?.exists) {
          router.replace(`/chat/${roomId}/not-found`)
          return
        }

        // 2️⃣ Validate role
        const roleRes = await axios.post<RoleRequest>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/validateRole`,
          {
            userId: uid,
            userKey,
            roomId,
          }
        )

        if (!roleRes.data.role) {
          setShowRequestModal(true)
          setRole("")
          return
        }

        if (roleRes.data.role === "memberPending") {
          router.replace(`/chat/${roomId}/waiting`)
          return
        }

        setRole(roleRes.data.role)
        setShowRequestModal(false)
      } catch (err: any) {
        setShowRequestModal(true)
        // console.error("Init failed:", err.response?.data || err.message)
      }
    }

    init()
  }, [roomId])
  useEffect(() => {
    if (!role) return;
    if (role === "admin") {
      getRequestMembers()
    }
    getMembers()
    async function getRequestMembers() {
      const res = await axios.post<RequestMember[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/getRequestMembers`,
        {
          roomId: roomId,
          adminId: userId,
          adminKey: key
        }
      )
      if (!res.data) return

      setRequestMembers(res.data)
    }

    async function getMembers() {
      const res = await axios.post<User[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/getRoomMembers`,
        {
          roomId: roomId,
          userId,
          userKey: key
        }
      )
      if (! res.data) return 
      
      setUsers(res.data)
    }



  }, [role])

  useEffect(() => {
    const interval = setInterval(() => {
      setTtl((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    // ws  = new WebSocket(process.env.NEXT_PUBLIC_BACKEND_URL! + "/ws?userId=" +userId + "&roomId" + roomId );
    // ws.onopen(())

    return () => clearInterval(interval)

  }, [])


  useEffect(() => {
    if (!userId || !roomId || !role) return
    if (role === "memberPending") return

    const wsUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL!.replace("http", "ws") +
      `/ws?userId=${userId}&roomId=${roomId}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data)
      setMessages((prev) => [...prev, msg])
    }

    ws.onerror = (err) => {
      console.error("WebSocket error", err)
    }

    ws.onclose = () => {
      console.log("WebSocket closed")
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [role , userId, roomId])


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

  const handleApproveRequest = (index: string) => {
    // setPendingRequests((prev) => Math.max(0, prev - 1))
    async function approveRequest(index: string) {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/joinRoomMember`, {
        roomId,
        adminId: userId,
        adminKey: key,
        memberKey: index
      })
    }
    approveRequest(index)

    requestMembers.filter((val, i) => {
      return val.id !== index;
    })


    console.log("approved his request :", index)
  }

  const handleRejectRequest = (index: string) => {
    // setPendingRequests((prev) => Math.max(0, prev - 1))
    console.log("rejecting  his request ")
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
    <div className="relative h-screen bg-background">

      {/* CHAT UI */}
      <div
        className={`flex h-full flex-col transition-all ${showRequestModal ? "pointer-events-none blur-sm" : ""
          }`}
      >
        <ChatHeader roomId={roomId} ttl={ttl} formattedTime={formatTime(ttl)} />

        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar
            requestMembers={requestMembers}
            users={users}
            role={role}
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
              onJoinVoice={handleJoinVoice}
              isUserInVoice={false}
              onLeaveVoice={handleLeaveVoice}
            />
          </div>
        </div>
      </div>

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <RequestJoinModal
          roomId={roomId}
          onRequestSent={() => { }}
        />
      )}
    </div>
  )

}
