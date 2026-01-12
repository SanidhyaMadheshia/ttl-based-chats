# TTL-Based Temporary Chat System – Architecture

This system implements **ephemeral, TTL-based chat rooms** using **Redis** as the primary datastore and **WebSockets** for real-time messaging.

All rooms, messages, and user memberships automatically expire after a configured TTL.

---

## High-Level Overview

* **Admin** creates a chat room
* A **Room ID** is generated and shared with participants
* Users join the room using the Room ID (and optional password)
* WebSocket connection is established for real-time messaging
* **TTL starts when admin starts chat or first message is sent**
* When TTL expires, **all room data is automatically deleted**

---

## Actors

* **Admin** – Creates and manages the room
* **Client/User** – Joins room and participates in chat
* **Redis** – Stores room metadata, messages, and members
* **WebSocket Server** – Handles real-time messaging

---

## API & Flow

### Step 1: Create Room (Admin)

**Endpoint**

```http
POST /createRoom
```

**Request Body**

```json
{
  "roomName": "string",
  "password": "string"
}
```

**Response**

```json
{
  "roomId": "string"
}
```

* Room is created without TTL initially
* TTL starts when admin starts chat or sends first message

---

### Step 2: Join Room (Client)

**Endpoint**

```http
POST /joinRoom
```

**Request Body**

```json
{
  "roomId": "string",
  "password": "string"
}
```

**Client-Side Session**

```json
{
  "sessionId": "string",
  "userId": "string"
}
```

* `userId` is generated based on username or UUID
* Stored in `localStorage` to persist across reloads

---

### Step 3: WebSocket Connection

**Endpoint**

```http
/ws
```

**Connection Metadata**

```json
{
  "sessionId": "string",
  "userId": "string",
  "socketId": "string"
}
```

* All messages flow through WebSocket
* Server validates room existence and TTL

---

## Redis Data Model

### 1. Room Metadata

```text
room:<roomId>  → HASH
```

```json
{
  "admin": "adminId",
  "roomName": "string",
  "ttl": "time"
}
```

**TTL**

```redis
EXPIRE room:<roomId> <ttl_in_seconds>
```

---

### 2. Room Messages

```text
room:messages:<roomId> → LIST
```

Each entry:

```json
{
  "message": "string",
  "timestamp": "DateTime",
  "userId": "string"
}
```

**TTL**

```redis
EXPIRE room:messages:<roomId> <ttl_in_seconds>
```

---

### 3. Room Members

```text
room:roomUser:<roomId> → SET
```

```text
[userId1, userId2, userId3, ...]
```

**TTL**

```redis
EXPIRE room:roomUser:<roomId> <ttl_in_seconds>
```

---

## TTL Lifecycle

* TTL is **not started at room creation**
* TTL starts when:

  * Admin clicks **Start Chat**, OR
  * First message is sent
* All related keys share the same TTL
* When TTL expires:

  * Room metadata is deleted
  * Messages are deleted
  * User membership is deleted
  * Room becomes inaccessible

---

## Admin Actions

### Delete Room Manually

```redis
DEL room:<roomId>
DEL room:messages:<roomId>
DEL room:roomUser:<roomId>
```

This immediately invalidates the room for all users.

---

## Client-Side Persistence

* `userId` stored in `localStorage`
* Allows session continuity across reloads
* No server-side authentication required (ephemeral design)

---

## Key Design Principles

* ⚡ **O(1) Redis access**
* 🧹 **Automatic cleanup via TTL**
* 🔒 **No permanent data storage**
* 🚀 **Real-time messaging with WebSockets**
* 🧠 **Simple, scalable, and stateless backend**

---
