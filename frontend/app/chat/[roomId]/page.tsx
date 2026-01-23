"use client"

import { useState, useEffect, use, useRef } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { VoiceModal } from "@/components/chat/voice-modal"
import axios from "axios"
import { RequestJoinModal } from "@/components/requestJoinModal"
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/app-sidebar"

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
  userName?: string
  content: string
  isSystemMessage?: boolean
}


interface RoleRequest {
  role: string;
}
interface roomExists {
  exists: boolean
  roomName: string
}


// const requestMembers: RequestMember[] = [
//   { id: "euw8NixO", name: "sanidhya" }
// ]

import { useRouter } from "next/navigation"
import { RequestMember } from "@/lib/types"
import { membersParser, messageParser } from "@/lib/wsEventParser"
// import { Sidebar } from "lucide-react"


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
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  const pendingMessagesRef = useRef<any[]>([])
  const [roomName, setRoomName] = useState<string>("");
  const usersRef = useRef<User[]>([])
  const usersRefMap = useRef<Map<string, User>>(new Map())

  const [roomReady, setRoomReady] = useState<boolean>(false)
  const router = useRouter()


  var ws;

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
        const roomRes = await axios.get<roomExists>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/roomExists`,
          { params: { roomId } }
        )

        console.log(roomRes);


        if (!roomRes.data?.exists) {
          router.replace(`/chat/${roomId}/not-found`)
          return
        }

        setRoomName(roomRes.data.roomName);

        console.log("roomName : ", roomRes.data.roomName)
        setRoomReady(true)

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
    getChats()
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
      if (!res.data) return
      usersRef.current = res.data
      const map = new Map<string, User>()
      res.data.forEach(u => map.set(u.id, u))

      usersRefMap.current = map
      // setUsers(res.data)

      setUsers(res.data)
    }
    getTtl()
    async function getChats() {
      interface resChat {
        userId: string,
        payload: string
      }

      const res = await axios.post<resChat[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/getChats`,
        {
          roomId: roomId,
          userId,
          userKey: key
        }
      )
      if (!res.data) return;
      const messages: Message[] = res.data.map((chat, id) => ({
        id: id.toString(),
        userId: chat.userId,
        content: chat.payload,
        isSystemMessage: false
      }))


      setMessages(messages)

    }

    async function getTtl() {
      const ttlRes = await axios.post<{
        TTL: string
      }>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/getTTL`, {
        roomId: roomId,
        userId,
        userKey: key
      });
      if (!ttlRes.data) return;
      const ttlR = parseTTL(ttlRes.data.TTL)
      setTtl(ttlR!);
      console.log(ttlR);
    }

  }, [role])

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(ttl);
      setTtl((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)

  }, [ttl])

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
      const data = JSON.parse(event.data)
      if (usersRef.current.length === 0) {
        pendingMessagesRef.current.push(data)
        return
      }

      console.log(data)
      // setMessages((prev) => [...prev, messageParser(data.payload)])
      handleWsEvent(data)
    }

    ws.onerror = (err) => {
      console.error("WebSocket error", err)
    }

    ws.onclose = () => {
      console.log("WebSocket closed")
      router.push(`${roomId}/not-found`);
      
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [role, userId, roomId])

  function handleWsEvent(data: any) {
    switch (data.type) {
      case "message":
        const msg = messageParser(data.payload, usersRefMap.current)
        if (msg.userId !== userId) {
          setMessages(prev => [...prev, msg])
        }
        break

      case "room_members":
        membersParser(data.payload, setOnlineMembers)
        break

      case "room_users_updated":
        const users = JSON.parse(data.payload)
        console.log("room user update : ", users)
        usersRef.current = users
        const map = new Map<string, User>()
        users.forEach((u: User) => map.set(u.id, u))

        usersRefMap.current = map
        // setUsers(users)


        setUsers(users)
        break
      case "REQUEST_TO_JOIN":
        // request to join 
        console.log("request to join !!")
        const payload =
          typeof data.payload === "string"
            ? JSON.parse(data.payload)
            : data.payload
        const newRequest: RequestMember = {
          id: payload.userId,
          name: payload.username,
        }

        setRequestMembers(prev => {
          // prevent duplicates (refresh / reconnect safety)
          if (prev.some(m => m.id === newRequest.id)) return prev
          return [...prev, newRequest]
        });

      case "removed_room_member": {
        const payload = data.payload

        const removedUserId = payload

        // 1️⃣ If *current user* is removed → kick / redirect
        if (removedUserId === userId) {
          console.warn("You were removed from the room")

          wsRef.current?.close()
          router.replace("/") // or /kicked / lobby
          return
        }

        // 2️⃣ Remove from users list
        setUsers(prev => prev.filter(u => u.id !== removedUserId))

        // 3️⃣ Remove from online members
        setOnlineMembers(prev =>
          prev.filter(m => m !== removedUserId)
        )

        // 4️⃣ Update refs (VERY IMPORTANT)
        usersRef.current = usersRef.current.filter(
          u => u.id !== removedUserId
        )

        usersRefMap.current.delete(removedUserId)

        break
      }

    }
  }

  useEffect(() => {
    if (users.length === 0) return

    const queue = pendingMessagesRef.current
    pendingMessagesRef.current = []

    queue.forEach(handleWsEvent)
  }, [users])

  useEffect(() => {
    if (usersRefMap.current.size === 0) return

    setMessages(prev =>
      prev.map(msg => {
        if (msg.isSystemMessage) return msg
        if (msg.userName) return msg   // already resolved

        return {
          ...msg,
          userName: usersRefMap.current.get(msg.userId)?.name ?? "unknown",
        }
      })
    )
  }, [users])

  const parseTTL = (ttl: string): number | null => {
    if (!ttl) return null

    if (ttl === "no expiry" || ttl === "key does not exist") {
      return null
    }

    let seconds = 0

    const h = ttl.match(/(\d+)h/)
    const m = ttl.match(/(\d+)m/)
    const s = ttl.match(/(\d+)s/)

    if (h) seconds += Number(h[1]) * 3600
    if (m) seconds += Number(m[1]) * 60
    if (s) seconds += Number(s[1])

    return seconds
  }

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
    async function removeUser(removeUserId: string) {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/removeUser`, {
        roomId,
        adminId: userId,
        adminKey: key,
        removeUserId: removeUserId
      });


    }
    removeUser(userId)
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

    setRequestMembers((RMembers) => {
      return RMembers.filter((val) => {
        return val.id != index
      })
    });


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
    wsRef.current?.send(
      JSON.stringify({
        type: "message",
        roomId,
        payload: content
      })
    )
    console.log("sendig ..", content)

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        userId: userId,
        userName: usersRefMap.current.get(userId)?.name ?? "You",
        content,
      }
      ,
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

  // return (
  //   <SidebarProvider>
  //     <div className="h-screen w-screen bg-background overflow-hidden">

  //       {/* CHAT UI */}
  //       <div
  //         className={`flex h-full flex-col transition-all ${showRequestModal ? "pointer-events-none blur-sm" : ""
  //           }`}
  //       >
  //         {roomReady && <ChatHeader roomId={roomId} roomName={roomName} ttl={ttl} formattedTime={formatTime(ttl)} />}

  //         <div className="flex flex-1 overflow-hidden">
  //           {/* <SidebarTrigger /> */}
  //           <Sidebar className="overflow-hidden">
  //             <SidebarContent className="h-full overflow-y-auto overflow-x-hidden">


  //               <ChatSidebar
  //                 onlineMembers={onlineMembers}
  //                 requestMembers={requestMembers}
  //                 users={users}
  //                 role={role}
  //                 voiceUsers={voiceUsers}
  //                 pendingRequests={pendingRequests}
  //                 onRemoveUser={handleRemoveUser}
  //                 onMuteUser={handleMuteUser}
  //                 onApproveRequest={handleApproveRequest}
  //                 onRejectRequest={handleRejectRequest}
  //                 onMuteVoiceUser={handleMuteVoiceUser}
  //                 onRemoveVoiceUser={handleRemoveVoiceUser}
  //                 isUserInVoice={isUserInVoice}
  //               />
  //             </SidebarContent>
  //           </Sidebar>

  //           <div className="flex flex-1 flex-col overflow-hidden">
  //             <ChatMessages
  //               messages={messages}
  //               // isAdmin={role==="admin" ? true : false}
  //               userId={userId}

  //             />
  //             <ChatInput
  //               onSendMessage={handleSendMessage}
  //               isMuted={isMuted}
  //               onJoinVoice={handleJoinVoice}
  //               isUserInVoice={false}
  //               onLeaveVoice={handleLeaveVoice}
  //             />
  //           </div>
  //         </div>
  //       </div>

  //       {/* REQUEST MODAL */}
  //       {showRequestModal && (
  //         <RequestJoinModal
  //           roomId={roomId}
  //           onRequestSent={() => {
  //             router.push(`${roomId}/waiting`)
  //           }}
  //         />
  //       )}
  //     </div>
  //   </SidebarProvider>
  // )
  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-background overflow-hidden">

        {/* CHAT UI */}
        <div
          className={`flex h-full flex-col ${showRequestModal ? "pointer-events-none blur-sm" : ""
            }`}
        >
          <div className="flex flex-1 overflow-hidden">

            {/* SIDEBAR */}
            <Sidebar className="overflow-hidden">
              <SidebarContent className="h-full overflow-y-auto overflow-x-hidden">
                <ChatSidebar
                  onlineMembers={onlineMembers}
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
              </SidebarContent>
            </Sidebar>

            {/* MAIN AREA (HEADER + CHAT) */}
            <SidebarInset className="flex flex-1 flex-col overflow-hidden">

              {/* HEADER — MUST BE HERE */}
              {roomReady && (
                <ChatHeader
                  roomId={roomId}
                  roomName={roomName}
                  ttl={ttl}
                  formattedTime={formatTime(ttl)}
                />
              )}

              {/* CHAT */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <ChatMessages
                    messages={messages}
                    userId={userId}
                  />
                </div>

                <ChatInput
                  onSendMessage={handleSendMessage}
                  isMuted={isMuted}
                  onJoinVoice={handleJoinVoice}
                  isUserInVoice={false}
                  onLeaveVoice={handleLeaveVoice}
                />
              </div>

            </SidebarInset>
          </div>
        </div>

        {/* REQUEST MODAL */}
        {showRequestModal && (
          <RequestJoinModal
            roomId={roomId}
            onRequestSent={() => {
              router.push(`${roomId}/waiting`)
            }}
          />
        )}
      </div>
    </SidebarProvider>
  )


}
