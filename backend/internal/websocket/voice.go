package websocket

// WebRTC voice signaling.
//
// Audio flows peer-to-peer (full mesh) between browsers; the server only:
//   - tracks who is currently in a room's voice channel (in memory, never persisted)
//   - relays SDP offers/answers and ICE candidates between participants
//
// Client -> server events:
//   voice_join    payload: ""                          join the room's voice channel
//   voice_leave   payload: ""                          leave the voice channel
//   voice_mute    payload: "true" | "false"            update own mute state
//   voice_video   payload: "true" | "false"            update own camera state
//   voice_signal  payload: {"to": userId, "data": {}}  relay SDP/ICE to a peer
//
// Server -> client events:
//   voice_joined        payload: [VoiceParticipant]    (to joiner) peers to call
//   voice_participants  payload: [VoiceParticipant]    (room) current voice roster
//   voice_user_left     payload: userId                (room) close peer connection
//   voice_signal        payload: {"from": userId, "data": {}}
//   voice_error         payload: string                (to sender)

import (
	"encoding/json"
	"errors"
	"log"
	"sort"
)

const (
	EventVoiceJoin         = "voice_join"
	EventVoiceLeave        = "voice_leave"
	EventVoiceMute         = "voice_mute"
	EventVoiceVideo        = "voice_video"
	EventVoiceSignal       = "voice_signal"
	EventVoiceJoined       = "voice_joined"
	EventVoiceParticipants = "voice_participants"
	EventVoiceUserLeft     = "voice_user_left"
	EventVoiceError        = "voice_error"
)

// Full-mesh audio scales as O(n^2) connections; keep rooms small.
const maxVoiceParticipants = 8

type VoiceParticipant struct {
	UserID string `json:"userId"`
	Muted  bool   `json:"muted"`
	Video  bool   `json:"video"`
}

// voiceMember ties a voice session to the exact websocket connection that
// joined, so a stale connection can't tear down a newer session (and vice versa).
type voiceMember struct {
	client *Client
	muted  bool
	video  bool
}

type voiceSignalIn struct {
	To   string          `json:"to"`
	Data json.RawMessage `json:"data"`
}

type voiceSignalOut struct {
	From string          `json:"from"`
	Data json.RawMessage `json:"data"`
}

func mustJSON(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		log.Println("voice: marshal error:", err)
		return "null"
	}
	return string(b)
}

// voiceParticipantsLocked returns a stable, sorted roster. Caller must hold m's lock.
func (m *Manager) voiceParticipantsLocked(roomID string) []VoiceParticipant {
	room := m.voice[roomID]
	list := make([]VoiceParticipant, 0, len(room))
	for id, member := range room {
		list = append(list, VoiceParticipant{UserID: id, Muted: member.muted, Video: member.video})
	}
	sort.Slice(list, func(i, j int) bool { return list[i].UserID < list[j].UserID })
	return list
}

// removeVoiceMemberLocked removes userID from the room's voice channel if its
// session belongs to client c (or c is nil = any session). Caller must hold m's lock.
func (m *Manager) removeVoiceMemberLocked(roomID, userID string, c *Client) bool {
	room, ok := m.voice[roomID]
	if !ok {
		return false
	}
	member, ok := room[userID]
	if !ok || (c != nil && member.client != c) {
		return false
	}
	delete(room, userID)
	if len(room) == 0 {
		delete(m.voice, roomID)
	}
	return true
}

// sendToClient delivers an event to one connection without blocking.
func (m *Manager) sendToClient(c *Client, event Event) {
	m.RLock()
	defer m.RUnlock()

	// Only send to connections still registered; egress may be closed otherwise.
	if current, ok := m.rooms[c.RoomID][c.UserID]; !ok || current != c {
		return
	}
	select {
	case c.egress <- event:
	default:
		log.Println("voice: egress full, dropping event for", c.UserID)
	}
}

func (m *Manager) broadcastVoiceRoster(roomID string, participants []VoiceParticipant) {
	m.broadcast <- RoomEvent{
		RoomID: roomID,
		Event:  Event{Type: EventVoiceParticipants, Payload: mustJSON(participants)},
	}
}

func (m *Manager) broadcastVoiceLeft(roomID, userID string, participants []VoiceParticipant) {
	m.broadcast <- RoomEvent{
		RoomID: roomID,
		Event:  Event{Type: EventVoiceUserLeft, Payload: userID},
	}
	m.broadcastVoiceRoster(roomID, participants)
}

func VoiceJoin(event Event, c *Client, m *Manager) error {
	m.Lock()
	if current, ok := m.rooms[c.RoomID][c.UserID]; !ok || current != c {
		m.Unlock()
		return errors.New("voice_join: connection is not active in room")
	}

	room := m.voice[c.RoomID]
	if room == nil {
		room = make(map[string]*voiceMember)
		m.voice[c.RoomID] = room
	}

	if _, already := room[c.UserID]; !already && len(room) >= maxVoiceParticipants {
		m.Unlock()
		m.sendToClient(c, Event{Type: EventVoiceError, Payload: "Voice channel is full"})
		return nil
	}

	// Peers that were already present; the joiner sends offers to each of them.
	// Because this is decided under the lock, two simultaneous joiners never
	// both offer to each other (no glare).
	peers := make([]VoiceParticipant, 0, len(room))
	for id, member := range room {
		if id != c.UserID {
			peers = append(peers, VoiceParticipant{UserID: id, Muted: member.muted, Video: member.video})
		}
	}
	room[c.UserID] = &voiceMember{client: c}
	roster := m.voiceParticipantsLocked(c.RoomID)
	m.Unlock()

	m.sendToClient(c, Event{Type: EventVoiceJoined, Payload: mustJSON(peers)})
	m.broadcastVoiceRoster(c.RoomID, roster)
	return nil
}

func VoiceLeave(event Event, c *Client, m *Manager) error {
	m.Lock()
	removed := m.removeVoiceMemberLocked(c.RoomID, c.UserID, c)
	roster := m.voiceParticipantsLocked(c.RoomID)
	m.Unlock()

	if removed {
		m.broadcastVoiceLeft(c.RoomID, c.UserID, roster)
	}
	return nil
}

func VoiceMute(event Event, c *Client, m *Manager) error {
	return setVoiceFlag(event, c, m, func(v *voiceMember, on bool) { v.muted = on })
}

// VoiceVideo updates whether the user's camera is on, so peers know to show a video tile.
func VoiceVideo(event Event, c *Client, m *Manager) error {
	return setVoiceFlag(event, c, m, func(v *voiceMember, on bool) { v.video = on })
}

func setVoiceFlag(event Event, c *Client, m *Manager, apply func(*voiceMember, bool)) error {
	var on bool
	switch event.Payload {
	case "true":
		on = true
	case "false":
		on = false
	default:
		return errors.New(event.Type + ": payload must be \"true\" or \"false\"")
	}

	m.Lock()
	member, ok := m.voice[c.RoomID][c.UserID]
	if !ok || member.client != c {
		m.Unlock()
		return errors.New(event.Type + ": not in voice")
	}
	apply(member, on)
	roster := m.voiceParticipantsLocked(c.RoomID)
	m.Unlock()

	m.broadcastVoiceRoster(c.RoomID, roster)
	return nil
}

func VoiceSignal(event Event, c *Client, m *Manager) error {
	var in voiceSignalIn
	if err := json.Unmarshal([]byte(event.Payload), &in); err != nil {
		return errors.New("voice_signal: invalid payload")
	}
	if in.To == "" || in.To == c.UserID || len(in.Data) == 0 {
		return errors.New("voice_signal: missing or invalid target/data")
	}

	// Only relay between two members of the same room's voice channel.
	m.RLock()
	room := m.voice[c.RoomID]
	sender, senderOK := room[c.UserID]
	target, targetOK := room[in.To]
	var targetClient *Client
	if senderOK && targetOK && sender.client == c {
		targetClient = target.client
	}
	m.RUnlock()

	if targetClient == nil {
		return errors.New("voice_signal: sender or target not in voice")
	}

	// "from" is set by the server so clients can't spoof another user.
	m.sendToClient(targetClient, Event{
		Type:    EventVoiceSignal,
		Payload: mustJSON(voiceSignalOut{From: c.UserID, Data: in.Data}),
	})
	return nil
}
