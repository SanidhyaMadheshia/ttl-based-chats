package websocket

// package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	// "fmt"

	// "fmt"
	"log"
	"net/http"
	"sync"

	// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/lib"
	// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/middlewares"
	// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/gorilla/websocket"
	// "github.com/joho/godotenv"
)

var (
	websocketUpgrader = websocket.Upgrader{
		CheckOrigin:     checkOrigin,
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

type RoomEvent struct {
	RoomID string
	Event  Event
}

type Manager struct {
	clients    ClientList
	rooms      map[string]ClientList // roomId -> client[]
	admins     map[string]string
	register   chan *Client
	unregister chan *Client
	broadcast  chan RoomEvent
	sync.RWMutex
	handlers map[string]EventHandler

	rdb *db.RedisClient
}

func NewManager(rdb *db.RedisClient) *Manager {

	m := &Manager{
		rdb:        rdb,
		clients:    make(ClientList),
		register:   make(chan *Client, 64),
		unregister: make(chan *Client, 64),
		broadcast:  make(chan RoomEvent, 128),
		rooms:      make(map[string]ClientList),
		admins:     make(map[string]string),
		handlers:   make(map[string]EventHandler),
	}

	m.setupEventHadlers()

	return m
}

func (m *Manager) setupEventHadlers() {
	m.handlers[EventSendMesage] = SendMessage // placeholder for now
	m.handlers["message"] = SendMessage

}

func (m *Manager) RouteEvent(event Event, c *Client) error {
	if handler, ok := m.handlers[event.Type]; ok {
		if err := handler(event, c, m); err != nil {
			return err
		}
		return nil
	} else {
		return errors.New("there is no such event type ")
	}
}

// func (m *Manager) ServeWS(w http.ResponseWriter, r *http.Request) {
// 	log.Println("new connection")

// 	//upgrade http connection to websocket
// 	origin := r.Header.Get("Origin")
// 	if origin != "http://localhost:3000" {
// 		fmt.Println("origin is not same ")
// 		http.Error(w, "Forbidden", http.StatusForbidden)
// 		return
// 	}
// 	userId := r.URL.Query().Get("userId")
// 	roomId := r.URL.Query().Get(("roomId"))

// 	if roomId == "" {
// 		fmt.Println("room is not present ")
// 		http.Error(w, "roomId is not there  ", http.StatusUnauthorized)
// 		return
// 	}

// 	if userId == "" {
// 		fmt.Println("userId is not present")
// 		http.Error(w, "userId is not there ", http.StatusUnauthorized)
// 		return
// 	}

// 	//  isValid , err := middlewares.ValidateWSConnection(userId , roomId )

// 	conn, err := websocketUpgrader.Upgrade(w, r, nil)

// 	if err != nil {
// 		log.Println("Upgrade error : ", err)
// 		return

// 	}
// 	client := NewClient(conn, m, userId, roomId) // client must be created before defer

// 	// m.addClient(client)
// 	// defer conn.Close()
// 	// defer func() {
// 	// 	m.removeClient(client)
// 	// 	conn.Close()
// 	// 	log.Println("connection closed:", userId)
// 	// }()

// 	// client := NewClient(conn, m)

// 	m.addClient(client)
// 	done := make(chan struct{})
// 	go client.ReadMessages()
// 	go client.WriteMessages()

// 	go m.Run()// ADDED

// 	<-done
// 	m.removeClient(client)
// 	conn.Close()
// 	log.Println("connection closed:", userId)
// }

func (m *Manager) ServeWS(w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("userId")
	roomId := r.URL.Query().Get("roomId")

	if userId == "" || roomId == "" {
		http.Error(w, "missing params", http.StatusUnauthorized)
		return
	}

	conn, err := websocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade error:", err)
		return
	}

	client := NewClient(conn, m, userId, roomId)

	m.register <- client

	go client.ReadMessages()
	go client.WriteMessages()
}

func (m *Manager) Run() { // ADDED
	fmt.Println("run goroutine  is running !!")
	for {
		fmt.Println("inside for !!")
		select {
		case client := <-m.register:
			fmt.Println("REGISTER RECEIVED:", client.UserID)
			m.addClient(client)

		case client := <-m.unregister:
			fmt.Println("UNREGISTER RECEIVED:", client.UserID)
			m.removeClient(client)

		case msg := <-m.broadcast:
			m.BroadcastToRoom(msg.RoomID, msg.Event)
		}
	}
}

// func (m *Manager) addClient(c *Client) {
// 	m.Lock()
// 	defer m.Unlock()
// 	// if _ , ok := m.clients[c]; ok {
// 	// }
// 	m.clients[c.UserID] = c

// }
func (m *Manager) addClient(c *Client) {
	fmt.Println("ADD CLIENT ..............: ", c.UserID, " roomId : ", c.RoomID)

	m.Lock()

	if _, ok := m.rooms[c.RoomID]; !ok {
		m.rooms[c.RoomID] = make(ClientList)
	}

	m.rooms[c.RoomID][c.UserID] = c
	m.clients[c.UserID] = c
	fmt.Println("Event user joined")

	members := []string{}
	for userID := range m.rooms[c.RoomID] {
		// if userID != c.UserID {
		members = append(members, userID)
		// }
	}
	payloadBytes, _ := json.Marshal(members)
	m.Unlock()
	fmt.Println(members)
	fmt.Println("Broadcasting to all members : addClinet ")

	m.broadcast <- RoomEvent{
		RoomID: c.RoomID,
		Event: Event{
			Type:    "room_members",
			Payload: string(payloadBytes),
		},
	}
	// for notification !!
	m.broadcast <- RoomEvent{
		RoomID: c.RoomID,
		Event: Event{
			Type:    "user_joined",
			Payload: c.UserID,
		},
	}
}

// func (m *Manager) removeClient(c *Client) {
// 	m.Lock()
// 	defer m.Unlock()

//		if _, ok := m.clients[c.UserID]; ok {
//			c.connection.Close()
//			delete(m.clients, c.UserID)
//		}
//	}
func (m *Manager) removeClient(c *Client) {
	fmt.Println("REMOVE CLIENT ..............: ", c.UserID, " roomId : ", c.RoomID)

	m.Lock()

	delete(m.clients, c.UserID)
	fmt.Println("client disconnected : ", c.UserID)
	shouldBroadcast := false
	if room, ok := m.rooms[c.RoomID]; ok {
		delete(room, c.UserID)
		if len(room) == 0 {
			delete(m.rooms, c.RoomID)
		}

		shouldBroadcast = true
	}
	m.Unlock()

	if shouldBroadcast {
		members := []string{}
		for userID := range m.rooms[c.RoomID] {
			// if userID != c.UserID {
			members = append(members, userID)
			// }
		}
		payloadBytes, _ := json.Marshal(members)
		fmt.Println(members)
		fmt.Println("Broadcasting to all members : addClinet ")

		m.broadcast <- RoomEvent{
			RoomID: c.RoomID,
			Event: Event{
				Type:    "room_members",
				Payload: string(payloadBytes),
			},
		}
		m.broadcast <- RoomEvent{
			RoomID: c.RoomID,
			Event: Event{
				Type:    "user_left",
				Payload: c.UserID,
			},
		}
	}

}

func (m *Manager) BroadcastToRoom(roomID string, event Event) { // ADDED
	m.RLock()
	defer m.RUnlock()

	room, ok := m.rooms[roomID]
	if !ok {
		return
	}

	for _, client := range room {
		select {
		case client.egress <- event:
		default:
			// slow or dead client
			go m.removeClient(client)
		}
	}
}

// func (m *Manager) SendToAdmin()

func (m *Manager) getRoomMembers(roomID string) []string {
	m.RLock()
	defer m.RUnlock()

	members := []string{}
	if room, ok := m.rooms[roomID]; ok {
		for userID := range room {
			members = append(members, userID)
		}
	}
	return members
}

func checkOrigin(r *http.Request) bool {
	
	origin := r.Header.Get("Origin")
	frontendUrl := os.Getenv("FRONTEND_URL")
	
	switch origin {
	case "http://" + frontendUrl:
		return true

	default:
		return false
	}
	// return false
}

func (m *Manager) SetRoomAdmin(roomID, userID string) {
	m.Lock()
	defer m.Unlock()
	if m.admins == nil {
		m.admins = make(map[string]string)
	}
	m.admins[roomID] = userID
}

func (m *Manager) SendToAdmin(roomID string, event Event) {
	m.RLock()
	defer m.RUnlock()

	adminID, ok := m.admins[roomID]
	if !ok {
		log.Println("No admin for room:", roomID)
		return
	}

	client, ok := m.clients[adminID]
	if !ok {
		log.Println("Admin not connected:", adminID)
		return
	}

	select {
	case client.egress <- event:
		log.Println("Event sent to admin:", adminID)
	default:
		log.Println("Admin's egress full, dropping event")
	}
}

// func (m *Manager) ValidateWSConnection()
