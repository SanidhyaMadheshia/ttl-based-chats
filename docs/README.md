# Architecture Docs: WebSocket, Goroutines, WebRTC, and Scaling

These docs explain this project from the inside out: how a message moves through goroutines and channels, how the WebSocket hub works, how the WebRTC signaling server sets up peer-to-peer voice/video, and how you would scale the same design to millions of users. Every non-trivial flow has a Mermaid `sequenceDiagram` (79 diagrams in total, all render-checked with `mermaid-cli`).

The docs are honest about the code. Where the implementation has bugs or gaps, they say so, show the failure as a sequence diagram, and give the fix. Those sections are the most useful interview material.

## Reading order

| # | Doc | What you'll be able to explain afterwards |
|---|-----|-------------------------------------------|
| 01 | [System overview](./01-system-overview.md) | Components, HTTP API, auth model, Redis data model, room/TTL lifecycle (as the code really works), end-to-end message flow, frontend bootstrap |
| 02 | [WebSocket architecture](./02-websocket-architecture.md) | Upgrade handshake, frames, masking, ping/pong, close codes, hub pattern, reader/writer pair, fan-out, slow consumers, reconnects, CSWSH, WS auth strategies, full event table |
| 03 | [Goroutines and concurrency](./03-goroutines-and-concurrency.md) | G-M-P scheduler, netpoller, goroutine and channel inventory, lock usage, 6 concurrency hazards with repros and fixes, a single-owner Manager reference design, memory math for 1M connections |
| 04 | [WebRTC signaling](./04-webrtc-signaling.md) | SDP, JSEP, NAT, ICE/STUN/TURN, DTLS-SRTP, this app's signaling protocol, glare and perfect negotiation, camera toggle with `replaceTrack`, mesh vs SFU vs MCU, ICE restart, ephemeral TURN credentials |
| 05 | [Scaling to millions](./05-scaling-to-millions.md) | Capacity math, stateless gateways, pub/sub backbones (Redis/NATS/Kafka), room sharding, ordering and delivery guarantees, reconnect storms, multi-region, SFU and TURN fleets, phased migration roadmap |
| 06 | [Interview guide](./06-interview-guide.md) | Project pitch, full system-design walkthrough, 60+ Q&A, gotcha questions, cheat-sheet numbers, whiteboard drills |

Short on time? Read 02 §8–11, 03 §2–6, 04 §10–13, then 06.

## Source map

| Concern | Where in the code |
|---|---|
| HTTP routes and wiring | `backend/internal/app/app.go` |
| HTTP handlers / auth middleware | `backend/internal/handler/handler.go`, `backend/internal/middlewares/middleware.go` |
| Redis data access | `backend/internal/service/ChatService.go` |
| WebSocket hub, fan-out | `backend/internal/websocket/manager.go` |
| Per-connection reader/writer goroutines | `backend/internal/websocket/client.go` |
| Chat event handler | `backend/internal/websocket/event.go` |
| WebRTC signaling server | `backend/internal/websocket/voice.go` (+ `voice_test.go`) |
| WebRTC client (mesh, transceivers) | `frontend/hooks/useVoiceChat.ts` |
| Chat page / WS client | `frontend/app/chat/[roomId]/page.tsx` |
| Media rendering | `frontend/components/chat/video-grid.tsx`, `voice-audio.tsx` |

## Known issues, at a glance

| Issue | Where | Explained in |
|---|---|---|
| `/ws` trusts `userId`/`roomId` query params (no key check) | `ServeWS` | 02 §15 |
| Origin check is a prefix match and fails open | `checkOrigin` | 02 §14 |
| Message list never expires (`LPOP` deletes the key, so `EXPIRE` is a no-op) | `CreateChatRoom`, `SaveRoomMessage` | 01 §7 |
| TTL starts at room creation, not at first message as the root README says | `CreateChatRoom` | 01 §7 |
| Hub sends to its own `broadcast` channel and can block on itself | `addClient`/`removeClient` | 03 §6.1 |
| `RemoveUserFromRoom` returns while holding the lock (latent, not called yet) | `manager.go` | 03 §6.2 |
| Slow-consumer eviction doesn't close the connection | `BroadcastToRoom` | 03 §6 |
| In-memory state (rooms, voice, admins) lost on restart, no client reconnect | `Manager`, `page.tsx` | 01 §14, 05 §1 |
| TURN credentials exposed via `NEXT_PUBLIC_*` | `useVoiceChat.ts` | 04 §20 |
