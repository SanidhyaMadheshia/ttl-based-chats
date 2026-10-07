"use client"

// WebRTC voice + video chat (full mesh) using the existing chat WebSocket for signaling.
//
// Flow:
//   1. join(): getUserMedia (mic, optionally camera) -> send "voice_join"
//   2. server replies "voice_joined" with peers already in the call; we send each an offer
//   3. existing peers receive the offer via "voice_signal", answer it
//   4. ICE candidates are trickled through "voice_signal"
//   5. "voice_user_left" closes the matching RTCPeerConnection
//
// Every peer connection always negotiates one audio and one video transceiver.
// Turning the camera on/off only swaps the video sender's track (replaceTrack),
// so no renegotiation is ever needed. Only the joiner creates offers, so two
// peers never offer to each other at once.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

export type VoiceParticipant = {
  userId: string
  muted: boolean
  video: boolean
}

type SignalData =
  | { type: "offer" | "answer"; sdp: string }
  | { type: "candidate"; candidate: RTCIceCandidateInit }

type Peer = {
  pc: RTCPeerConnection
  // Candidates that arrive before the remote description is set.
  pendingCandidates: RTCIceCandidateInit[]
  videoSender: RTCRtpSender | null
  remoteTracks: MediaStreamTrack[]
}

type WsEvent = { type: string; payload: string }

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }]
  // A TURN server is needed for users behind symmetric NATs / strict firewalls.
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    })
  }
  return servers
}

const ICE_SERVERS = buildIceServers()

// Modest defaults: in a full mesh every user uploads one copy per peer.
const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 640 },
  height: { ideal: 360 },
  frameRate: { ideal: 24, max: 30 },
  facingMode: "user",
}
const VIDEO_MAX_BITRATE = 500_000 // bps per peer

function mediaErrorMessage(err: unknown, kind: "microphone" | "camera"): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
        return `${kind === "camera" ? "Camera" : "Microphone"} permission denied`
      case "NotFoundError":
        return `No ${kind} found`
      case "NotReadableError":
        return `Your ${kind} is in use by another application`
    }
  }
  return err instanceof Error ? err.message : `Could not access ${kind}`
}

async function limitVideoBitrate(sender: RTCRtpSender) {
  try {
    const params = sender.getParameters()
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}]
    params.encodings[0].maxBitrate = VIDEO_MAX_BITRATE
    await sender.setParameters(params)
  } catch {
    // Not supported in every browser before negotiation completes; best effort.
  }
}

export function useVoiceChat(wsRef: RefObject<WebSocket | null>, userId: string) {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [isInVoice, setIsInVoice] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null)

  const audioTrackRef = useRef<MediaStreamTrack | null>(null)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const peersRef = useRef<Map<string, Peer>>(new Map())
  const inVoiceRef = useRef(false)
  const userIdRef = useRef(userId)
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const send = useCallback(
    (type: string, payload: unknown) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return false
      ws.send(
        JSON.stringify({
          type,
          payload: typeof payload === "string" ? payload : JSON.stringify(payload),
        })
      )
      return true
    },
    [wsRef]
  )

  const sendSignal = useCallback(
    (to: string, data: SignalData) => send("voice_signal", { to, data }),
    [send]
  )

  const closePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId)
    if (!peer) return
    peer.pc.onicecandidate = null
    peer.pc.ontrack = null
    peer.pc.onconnectionstatechange = null
    peer.pc.close()
    peersRef.current.delete(peerId)
    setRemoteStreams((prev) => {
      if (!(peerId in prev)) return prev
      const next = { ...prev }
      delete next[peerId]
      return next
    })
  }, [])

  const createPeer = useCallback(
    (peerId: string): Peer => {
      closePeer(peerId) // replace any stale connection to the same user

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      const peer: Peer = { pc, pendingCandidates: [], videoSender: null, remoteTracks: [] }
      peersRef.current.set(peerId, peer)

      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal(peerId, { type: "candidate", candidate: e.candidate.toJSON() })
      }
      pc.ontrack = (e) => {
        // Tracks from addTransceiver/replaceTrack carry no stream, so build our own.
        // A fresh MediaStream object makes media elements re-bind to the new track set.
        peer.remoteTracks = [...peer.remoteTracks.filter((t) => t.kind !== e.track.kind), e.track]
        setRemoteStreams((prev) => ({ ...prev, [peerId]: new MediaStream(peer.remoteTracks) }))
      }
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          console.warn(`voice: connection to ${peerId} failed (a TURN server may be required)`)
        }
      }
      return peer
    },
    [closePeer, sendSignal]
  )

  const flushCandidates = async (peer: Peer) => {
    const queued = peer.pendingCandidates
    peer.pendingCandidates = []
    for (const c of queued) {
      await peer.pc.addIceCandidate(c).catch((err) => console.warn("voice: addIceCandidate", err))
    }
  }

  const callPeer = useCallback(
    async (peerId: string) => {
      const peer = createPeer(peerId)
      const { pc } = peer

      pc.addTransceiver(audioTrackRef.current ?? "audio", { direction: "sendrecv" })
      const videoTx = pc.addTransceiver(videoTrackRef.current ?? "video", { direction: "sendrecv" })
      peer.videoSender = videoTx.sender

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignal(peerId, { type: "offer", sdp: offer.sdp ?? "" })
      void limitVideoBitrate(videoTx.sender)
    },
    [createPeer, sendSignal]
  )

  const handleSignal = useCallback(
    async (from: string, data: SignalData) => {
      if (!inVoiceRef.current) return

      if (data.type === "offer") {
        const peer = createPeer(from)
        const { pc } = peer
        await pc.setRemoteDescription({ type: "offer", sdp: data.sdp })

        // The offer created one transceiver per m-line; attach our local tracks to them.
        for (const tx of pc.getTransceivers()) {
          const kind = tx.receiver.track.kind
          tx.direction = "sendrecv"
          if (kind === "audio") {
            await tx.sender.replaceTrack(audioTrackRef.current)
          } else if (kind === "video") {
            await tx.sender.replaceTrack(videoTrackRef.current)
            peer.videoSender = tx.sender
          }
        }

        await flushCandidates(peer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal(from, { type: "answer", sdp: answer.sdp ?? "" })
        if (peer.videoSender) void limitVideoBitrate(peer.videoSender)
        return
      }

      const peer = peersRef.current.get(from)
      if (!peer) return

      if (data.type === "answer") {
        if (peer.pc.signalingState !== "have-local-offer") return
        await peer.pc.setRemoteDescription({ type: "answer", sdp: data.sdp })
        await flushCandidates(peer)
      } else if (data.type === "candidate") {
        if (!peer.pc.remoteDescription) {
          peer.pendingCandidates.push(data.candidate)
        } else {
          await peer.pc.addIceCandidate(data.candidate)
        }
      }
    },
    [createPeer, sendSignal]
  )

  /** Swap the outgoing video track on every peer connection (null = camera off). */
  const setOutgoingVideo = useCallback(async (track: MediaStreamTrack | null) => {
    await Promise.all(
      Array.from(peersRef.current.values()).map((peer) =>
        peer.videoSender?.replaceTrack(track).catch((err) => console.warn("voice: replaceTrack", err))
      )
    )
  }, [])

  const stopCamera = useCallback(() => {
    videoTrackRef.current?.stop()
    videoTrackRef.current = null
    setLocalVideoStream(null)
    setIsVideoOn(false)
  }, [])

  /** Tear down all local call state (does not notify the server). */
  const cleanup = useCallback(() => {
    inVoiceRef.current = false
    Array.from(peersRef.current.keys()).forEach(closePeer)
    audioTrackRef.current?.stop()
    audioTrackRef.current = null
    stopCamera()
    setRemoteStreams({})
    setIsInVoice(false)
    setIsMuted(false)
  }, [closePeer, stopCamera])

  const startCamera = async (): Promise<MediaStreamTrack> => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: false })
    const track = stream.getVideoTracks()[0]
    // contentHint helps the encoder favour smooth motion for faces.
    track.contentHint = "motion"
    // If the camera is unplugged / revoked, reflect it everywhere.
    track.onended = () => {
      if (videoTrackRef.current !== track) return
      void setOutgoingVideo(null)
      stopCamera()
      send("voice_video", "false")
    }
    videoTrackRef.current = track
    setLocalVideoStream(new MediaStream([track]))
    setIsVideoOn(true)
    return track
  }

  const join = useCallback(
    async ({ video = false }: { video?: boolean } = {}): Promise<boolean> => {
      if (inVoiceRef.current) return true
      setError(null)
      setIsConnecting(true)
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Microphone/camera access requires HTTPS (or localhost)")
        }

        let mic: MediaStream
        try {
          mic = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
          })
        } catch (err) {
          throw new Error(mediaErrorMessage(err, "microphone"))
        }
        audioTrackRef.current = mic.getAudioTracks()[0]

        if (video) {
          try {
            await startCamera()
          } catch (err) {
            // Still join with audio; just report the camera problem.
            setError(mediaErrorMessage(err, "camera"))
          }
        }

        inVoiceRef.current = true
        if (!send("voice_join", "")) {
          throw new Error("Not connected to the chat server")
        }
        // Server processes events in order, so this applies after the join.
        if (videoTrackRef.current) send("voice_video", "true")

        setIsMuted(false)
        setIsInVoice(true)
        return true
      } catch (err) {
        cleanup()
        setError(err instanceof Error ? err.message : "Could not join call")
        return false
      } finally {
        setIsConnecting(false)
      }
    },
    // startCamera only uses refs/stable callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [send, cleanup]
  )

  const leave = useCallback(() => {
    if (!inVoiceRef.current) return
    send("voice_leave", "")
    cleanup()
  }, [send, cleanup])

  const toggleMute = useCallback(() => {
    const track = audioTrackRef.current
    if (!track) return
    track.enabled = !track.enabled
    const muted = !track.enabled
    setIsMuted(muted)
    send("voice_mute", muted ? "true" : "false")
  }, [send])

  const toggleVideo = useCallback(async () => {
    if (!inVoiceRef.current) return
    setError(null)

    if (videoTrackRef.current) {
      await setOutgoingVideo(null)
      stopCamera()
      send("voice_video", "false")
      return
    }

    try {
      const track = await startCamera()
      await setOutgoingVideo(track)
      send("voice_video", "true")
    } catch (err) {
      stopCamera()
      setError(mediaErrorMessage(err, "camera"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [send, setOutgoingVideo, stopCamera])

  /**
   * Feed WebSocket events here. Returns true if the event was a voice event.
   * Stable identity, safe to call from a WebSocket onmessage closure.
   */
  const handleVoiceEvent = useCallback(
    (event: WsEvent): boolean => {
      switch (event.type) {
        case "voice_participants":
          setParticipants(JSON.parse(event.payload) ?? [])
          return true

        case "voice_joined": {
          if (!inVoiceRef.current) return true
          const peers: VoiceParticipant[] = JSON.parse(event.payload) ?? []
          peers.forEach((p) => {
            callPeer(p.userId).catch((err) => console.error("voice: offer failed", err))
          })
          return true
        }

        case "voice_signal": {
          const { from, data } = JSON.parse(event.payload) as { from: string; data: SignalData }
          handleSignal(from, data).catch((err) => console.error("voice: signal failed", err))
          return true
        }

        case "voice_user_left":
          if (event.payload === userIdRef.current) {
            // Server dropped our session (e.g. we reconnected elsewhere).
            cleanup()
          } else {
            closePeer(event.payload)
          }
          return true

        case "voice_error":
          cleanup()
          setError(event.payload)
          return true

        default:
          return false
      }
    },
    [callPeer, handleSignal, closePeer, cleanup]
  )

  // Release mic/camera and peer connections when leaving the page.
  useEffect(() => cleanup, [cleanup])

  return {
    participants,
    isInVoice,
    isMuted,
    isVideoOn,
    isConnecting,
    error,
    clearError: () => setError(null),
    remoteStreams,
    localVideoStream,
    join,
    leave,
    toggleMute,
    toggleVideo,
    handleVoiceEvent,
  }
}
