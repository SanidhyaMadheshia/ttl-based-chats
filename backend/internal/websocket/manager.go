package websocket

// package main

import (
	"errors"
	"fmt"

	// "fmt"
	"log"
	"net/http"
	"sync"

	// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/lib"
	// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/middlewares"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/gorilla/websocket"
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
	rooms      map[string]ClientList
	register   chan *Client
	unregister chan *Client
	broadcast  chan RoomEvent
	sync.RWMutex
	handlers map[string]EventHandler

	rdb *db.RedisClient
}

func NewManager(rdb *db.RedisClient) *Manager {

	m := &Manager{
		clients:  make(ClientList),
		rooms:    make(map[string]ClientList),
		handlers: make(map[string]EventHandler),
	}

	m.setupEventHadlers()

	return m
}

func (m *Manager) setupEventHadlers() {
	m.handlers[EventSendMesage] = SendMessage // placeholder for now


}

func (m *Manager) RouteEvent(event Event, c *Client) error {
	if handler, ok := m.handlers[event.Type]; ok {
		if err := handler(event, c); err != nil {
			return err
		}
		return nil
	} else {
		return errors.New("there is no such event type ")
	}
}


func (m *Manager) ServeWS(w http.ResponseWriter, r *http.Request) {
	log.Println("new connection")

	//upgrade http connection to websocket
	origin := r.Header.Get("Origin")
	if origin != "http://localhost:3000" {
		fmt.Println("origin is not same ")
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	userId := r.URL.Query().Get("userId")
	roomId := r.URL.Query().Get(("roomId"))

	if roomId == "" {
		fmt.Println("room is not present ")
		http.Error(w, "roomId is not there  ", http.StatusUnauthorized)
		return
	}

	if userId == "" {
		fmt.Println("userId is not present")
		http.Error(w, "userId is not there ", http.StatusUnauthorized)
		return
	}

	//  isValid , err := middlewares.ValidateWSConnection(userId , roomId )

	conn, err := websocketUpgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println("Upgrade error : ", err)
		return

	}
	client := NewClient(conn, m, userId, roomId) // client must be created before defer

	// m.addClient(client)
	// defer conn.Close()
	// defer func() {
	// 	m.removeClient(client)
	// 	conn.Close()
	// 	log.Println("connection closed:", userId)
	// }()

	// client := NewClient(conn, m)

	m.addClient(client)
	done := make(chan struct{})

	go client.ReadMessages()
	go client.WriteMessages()

	<-done
	m.removeClient(client)
	conn.Close()
	log.Println("connection closed:", userId)
}

func (m *Manager) addClient(c *Client) {
	m.Lock()
	defer m.Unlock()
	// if _ , ok := m.clients[c]; ok {
	// }
	m.clients[c.UserID] = c

}

func (m *Manager) removeClient(c *Client) {
	m.Lock()
	defer m.Unlock()

	if _, ok := m.clients[c.UserID]; ok {
		c.connection.Close()
		delete(m.clients, c.UserID)
	}
}

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")

	switch origin {
	case "http://localhost:3000":
		return true

	default:
		return false
	}
	// return false
}

// func (m *Manager) ValidateWSConnection()
