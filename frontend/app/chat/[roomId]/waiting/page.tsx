"use client"

import { use, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
// { params }: { params: Promise<{ roomId: string }> 
export default function WaitingPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter()
const { roomId } = use(params)
  useEffect(() => {
    const interval = setInterval(async () => {
      const userId = localStorage.getItem("userId")
      const userKey = localStorage.getItem("userKey")

      if (!userId || !userKey) return

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/validateRole`,
        { userId, userKey, roomId: roomId }
      )

      if (!res.data) {
        
        return 
      }

      if (res.data.role === "member") {
        router.replace(`/chat/${roomId}`)
        return 
      }
    }, 5000) // poll every 5 sec

    return () => clearInterval(interval)
  }, [roomId, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-xl font-semibold">
        Waiting for admin approval...
      </h1>
    </div>
  )
}
