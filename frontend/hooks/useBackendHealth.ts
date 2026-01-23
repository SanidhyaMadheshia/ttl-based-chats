"use client"

import { useEffect, useState } from "react"

export function useBackendHealth() {
  const [ready, setReady] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const start = Date.now()

    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/health`,
          { cache: "no-store" }
        )

        if (res.ok) {
          setReady(true)
          clearInterval(interval)
          clearInterval(timer)
        }
      } catch {
        // backend still down → ignore
      }
    }, 2000) // poll every 2s

    return () => {
      clearInterval(interval)
      clearInterval(timer)
    }
  }, [])

  return { ready, seconds }
}
