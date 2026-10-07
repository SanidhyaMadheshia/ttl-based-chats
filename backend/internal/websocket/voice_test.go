package websocket

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func startTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	m := NewManager(nil) // voice signaling never touches Redis
	go m.Run()
	srv := httptest.NewServer(http.HandlerFunc(m.ServeWS))
	t.Cleanup(srv.Close)
	return srv
}

func dial(t *testing.T, srv *httptest.Server, roomID, userID string) *websocket.Conn {
	t.Helper()
	url := "ws" + strings.TrimPrefix(srv.URL, "http") + "/ws?roomId=" + roomID + "&userId=" + userID
	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		t.Fatalf("dial %s: %v", userID, err)
	}
	t.Cleanup(func() { conn.Close() })
	return conn
}

func send(t *testing.T, conn *websocket.Conn, typ, payload string) {
	t.Helper()
	if err := conn.WriteJSON(Event{Type: typ, Payload: payload}); err != nil {
		t.Fatalf("write %s: %v", typ, err)
	}
}

// waitFor reads events until one of the given type arrives (others are skipped).
func waitFor(t *testing.T, conn *websocket.Conn, typ string) Event {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for {
		conn.SetReadDeadline(deadline)
		var ev Event
		if err := conn.ReadJSON(&ev); err != nil {
			t.Fatalf("waiting for %q: %v", typ, err)
		}
		if ev.Type == typ {
			return ev
		}
	}
}

// expectNone asserts no event of the given type arrives within d.
func expectNone(t *testing.T, conn *websocket.Conn, typ string, d time.Duration) {
	t.Helper()
	deadline := time.Now().Add(d)
	for {
		conn.SetReadDeadline(deadline)
		var ev Event
		if err := conn.ReadJSON(&ev); err != nil {
			return // timeout: nothing received
		}
		if ev.Type == typ {
			t.Fatalf("unexpected %q event: %s", typ, ev.Payload)
		}
	}
}

func TestVoiceSignalingFlow(t *testing.T) {
	srv := startTestServer(t)
	alice := dial(t, srv, "room1", "alice")
	waitFor(t, alice, EventVoiceParticipants) // initial roster on connect
	bob := dial(t, srv, "room1", "bob")
	waitFor(t, bob, EventVoiceParticipants)

	// Alice joins first: no peers to call.
	send(t, alice, EventVoiceJoin, "")
	var peers []VoiceParticipant
	json.Unmarshal([]byte(waitFor(t, alice, EventVoiceJoined).Payload), &peers)
	if len(peers) != 0 {
		t.Fatalf("alice peers = %v, want none", peers)
	}

	// Bob joins: must be told to call Alice.
	send(t, bob, EventVoiceJoin, "")
	json.Unmarshal([]byte(waitFor(t, bob, EventVoiceJoined).Payload), &peers)
	if len(peers) != 1 || peers[0].UserID != "alice" {
		t.Fatalf("bob peers = %v, want [alice]", peers)
	}

	// Bob's offer is relayed to Alice with a server-set "from".
	send(t, bob, EventVoiceSignal, `{"to":"alice","data":{"type":"offer","sdp":"v=0"}}`)
	var relayed voiceSignalOut
	json.Unmarshal([]byte(waitFor(t, alice, EventVoiceSignal).Payload), &relayed)
	if relayed.From != "bob" || !strings.Contains(string(relayed.Data), `"offer"`) {
		t.Fatalf("relayed = %+v", relayed)
	}

	// Mute updates the roster for everyone.
	send(t, alice, EventVoiceMute, "true")
	var roster []VoiceParticipant
	for {
		json.Unmarshal([]byte(waitFor(t, bob, EventVoiceParticipants).Payload), &roster)
		if len(roster) == 2 && roster[0].UserID == "alice" && roster[0].Muted {
			break
		}
	}

	// Bob disconnecting removes him from voice and notifies Alice.
	bob.Close()
	if ev := waitFor(t, alice, EventVoiceUserLeft); ev.Payload != "bob" {
		t.Fatalf("voice_user_left payload = %q, want bob", ev.Payload)
	}
}

func TestVoiceSignalRejectedForNonParticipants(t *testing.T) {
	srv := startTestServer(t)
	alice := dial(t, srv, "room1", "alice")
	waitFor(t, alice, EventVoiceParticipants)
	mallory := dial(t, srv, "room1", "mallory")
	outsider := dial(t, srv, "room2", "outsider")

	send(t, alice, EventVoiceJoin, "")
	waitFor(t, alice, EventVoiceJoined)

	// Not in voice -> cannot signal anyone in voice.
	send(t, mallory, EventVoiceSignal, `{"to":"alice","data":{"type":"offer","sdp":"x"}}`)
	// Different room, even after joining its own voice channel.
	send(t, outsider, EventVoiceJoin, "")
	waitFor(t, outsider, EventVoiceJoined)
	send(t, outsider, EventVoiceSignal, `{"to":"alice","data":{"type":"offer","sdp":"x"}}`)

	expectNone(t, alice, EventVoiceSignal, 500*time.Millisecond)
}

func TestVoiceRejectsWhenFull(t *testing.T) {
	srv := startTestServer(t)
	for i := 0; i < maxVoiceParticipants; i++ {
		c := dial(t, srv, "room1", string(rune('a'+i)))
		waitFor(t, c, EventVoiceParticipants)
		send(t, c, EventVoiceJoin, "")
		waitFor(t, c, EventVoiceJoined)
	}
	extra := dial(t, srv, "room1", "extra")
	waitFor(t, extra, EventVoiceParticipants)
	send(t, extra, EventVoiceJoin, "")
	if ev := waitFor(t, extra, EventVoiceError); ev.Payload == "" {
		t.Fatal("expected voice_error payload")
	}
}

func TestVoiceVideoToggleUpdatesRoster(t *testing.T) {
	srv := startTestServer(t)
	alice := dial(t, srv, "room1", "alice")
	waitFor(t, alice, EventVoiceParticipants)
	bob := dial(t, srv, "room1", "bob")
	waitFor(t, bob, EventVoiceParticipants)

	// Not in voice yet -> camera state is rejected (no roster change).
	send(t, alice, EventVoiceVideo, "true")
	send(t, alice, EventVoiceJoin, "")
	waitFor(t, alice, EventVoiceJoined)
	send(t, alice, EventVoiceVideo, "true")

	var roster []VoiceParticipant
	for {
		json.Unmarshal([]byte(waitFor(t, bob, EventVoiceParticipants).Payload), &roster)
		if len(roster) == 1 && roster[0].Video {
			break
		}
	}

	// A later joiner learns about existing cameras from voice_joined.
	send(t, bob, EventVoiceJoin, "")
	var peers []VoiceParticipant
	json.Unmarshal([]byte(waitFor(t, bob, EventVoiceJoined).Payload), &peers)
	if len(peers) != 1 || !peers[0].Video {
		t.Fatalf("bob peers = %+v, want alice with video", peers)
	}

	send(t, alice, EventVoiceVideo, "false")
	for {
		json.Unmarshal([]byte(waitFor(t, bob, EventVoiceParticipants).Payload), &roster)
		if len(roster) == 2 && roster[0].UserID == "alice" && !roster[0].Video {
			break
		}
	}
}

func TestLargeSDPWithinReadLimit(t *testing.T) {
	srv := startTestServer(t)
	alice := dial(t, srv, "room1", "alice")
	waitFor(t, alice, EventVoiceParticipants)
	bob := dial(t, srv, "room1", "bob")
	waitFor(t, bob, EventVoiceParticipants)
	send(t, alice, EventVoiceJoin, "")
	waitFor(t, alice, EventVoiceJoined)
	send(t, bob, EventVoiceJoin, "")
	waitFor(t, bob, EventVoiceJoined)

	sdp := strings.Repeat("a=candidate:x\\r\\n", 500) // ~8 KB, realistic upper range
	send(t, bob, EventVoiceSignal, `{"to":"alice","data":{"type":"offer","sdp":"`+sdp+`"}}`)
	waitFor(t, alice, EventVoiceSignal)
}
