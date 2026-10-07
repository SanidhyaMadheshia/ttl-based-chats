"use client"

import { useEffect, useRef } from "react"
import { MicOff } from "lucide-react"

export type VideoTile = {
  id: string
  name: string
  stream: MediaStream | null
  videoOn: boolean
  muted: boolean
  isLocal?: boolean
}

function Tile({ tile }: { tile: VideoTile }) {
  const ref = useRef<HTMLVideoElement>(null)
  const showVideo = tile.videoOn && tile.stream !== null

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.srcObject = showVideo ? tile.stream : null
    if (showVideo) el.play().catch(() => {})
  }, [tile.stream, showVideo])

  const initials = tile.name.trim().slice(0, 2).toUpperCase() || "?"

  return (
    <figure className="relative aspect-video overflow-hidden rounded-lg border border-border bg-secondary/40">
      {/* Always muted: remote audio is played by <VoiceAudio>, local audio must not echo. */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${showVideo ? "" : "hidden"} ${tile.isLocal ? "-scale-x-100" : ""}`}
      />
      {!showVideo && (
        <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-semibold text-accent">
            {initials}
          </div>
        </div>
      )}
      <figcaption className="absolute bottom-1 left-1 flex max-w-[90%] items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        <span className="truncate">
          {tile.name}
          {tile.isLocal && " (you)"}
        </span>
        {tile.muted && <MicOff className="h-3 w-3 shrink-0 text-red-400" aria-label="muted" />}
      </figcaption>
    </figure>
  )
}

/** Call stage shown while the user is in a call and at least one camera is on. */
export function VideoGrid({ tiles, error }: { tiles: VideoTile[]; error?: string | null }) {
  const anyVideo = tiles.some((t) => t.videoOn)
  if (!anyVideo && !error) return null

  return (
    <section aria-label="Video call" className="border-b border-border bg-card p-2">
      {error && (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {anyVideo && (
        <div className="grid max-h-[45vh] grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3 xl:grid-cols-4">
          {tiles.map((tile) => (
            <Tile key={tile.id} tile={tile} />
          ))}
        </div>
      )}
    </section>
  )
}
