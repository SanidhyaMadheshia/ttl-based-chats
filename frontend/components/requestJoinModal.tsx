"use client"

import { useState } from "react"
import axios from "axios"

interface RequestToJoin {
  userKey: string;
  userId: string;
}
export function RequestJoinModal({
  roomId,
  onRequestSent,
}: {
  roomId: string
  onRequestSent: () => void
}) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRequest = async () => {
    if (!name.trim()) return

    // const userId = localStorage.getItem("userId")
    // const userKey = localStorage.getItem("userKey")

    try {
      setLoading(true)
      const res = await axios.post<RequestToJoin>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/requestToJoin`,
        { roomId, username: name }
      )

      if(res.data.userId && res.data.userKey) {
        localStorage.setItem("userId" , res.data.userId!)
        localStorage.setItem("userKey", res.data.userKey!)
        alert("now reload !!")
      }


      // alert("Request sent to admin , Now Keep reloading , until admin accepts !!")
      // onRequestSent()
    } catch {
      alert("Failed to send request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Request to Join</h2>

        <input
          className="mb-4 w-full rounded border p-2"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleRequest}
          disabled={loading}
          className="w-full rounded bg-blue-600 p-2 text-white"
        >
          {loading ? "Sending..." : "Request Join"}
        </button>
      </div>
    </div>
  )
}
