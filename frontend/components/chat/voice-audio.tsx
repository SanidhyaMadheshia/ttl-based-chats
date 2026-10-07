"use client"

import { useEffect, useRef } from "react"

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.srcObject = stream
    // Joining voice is a user gesture, so autoplay is normally allowed.
    el.play().catch((err) => console.warn("voice: audio playback blocked", err))
    return () => {
      el.srcObject = null
    }
  }, [stream])

  return <audio ref={ref} autoPlay playsInline />
}

/** Invisible audio sinks for every remote peer's stream. */
export function VoiceAudio({ streams }: { streams: Record<string, MediaStream> }) {
  return (
    <div className="hidden" aria-hidden="true">
      {Object.entries(streams).map(([peerId, stream]) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}
    </div>
  )
}
