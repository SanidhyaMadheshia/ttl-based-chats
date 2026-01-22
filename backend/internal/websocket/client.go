package websocket

// package main

import (
	// "bytes"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	// "golang.org/x/text/message"
)

var (
	pongWait     = 10 * time.Second
	pingInterval = (pongWait * 9) / 10
)

type ClientList map[string]*Client // r

type Client struct {
	ID     string
	UserID string
	RoomID string

	connection *websocket.Conn
	manager    *Manager

	// egress is used to avoid the concurrent writes on the websocket connection

	// egress chan []byte
	egress   chan Event
	JoinedAt time.Time
}

func NewClient(conn *websocket.Conn, manager *Manager, userId string, roomId string) *Client {
	log.Println("new Cloien room :", roomId)
	return &Client{
		ID:         uuid.NewString(),
		UserID:     userId,
		RoomID:     roomId,
		connection: conn,
		manager:    manager,
		// egress:     make(chan []byte),
		egress:   make(chan Event, 64),
		JoinedAt: time.Now(),
	}
}

func (c *Client) ReadMessages() {
	// defer func() {
	// 	c.connection.Close()
	// 	c.manager.removeClient(c)

	// }()
	
	fmt.Println("read message for client :", c.UserID)
	defer func() { // added
		c.manager.unregister <- c
		c.connection.Close()
	}()
	if err := c.connection.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Println(err)
		return

	}

	c.connection.SetPongHandler(c.pongHandler)

	c.connection.SetReadLimit(512) // jumbo frames ..

	for {
		// log.Println("hello bhai")
		_, payload, err := c.connection.ReadMessage()

		if err != nil {
			log.Println(err)
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading messages : %v", err)
			}
			break
		}

		// for wsclient := range c.manager.clients {
		// 	wsclient.egress <- payload
		// }

		// log.Println(messageType)

		// log.Println(string(payload))
		var request Event

		// if err := json.Unmarshal(payload, &request); err != nil {
		// 	log.Printf("error marshelliung event %v", err)
		// 	break

		// }
		if err := json.Unmarshal(payload, &request); err != nil {
			log.Println("invalid event payload:", err)
			continue //  do NOT break
		}

		//

		if err := c.manager.RouteEvent(request, c); err != nil {
			log.Println("error handling error : ", err)
		}

	}
}

func (c *Client) WriteMessages() {
	// defer func() {
	// 	c.manager.removeClient(c)

	// }()
	fmt.Println("write message for client :", c.UserID)
	defer c.connection.Close() // added

	ticker := time.NewTicker(pingInterval)
	defer ticker.Stop()
	for {
		select {
		case message, ok := <-c.egress:
			if !ok {
				if err := c.connection.WriteMessage(websocket.CloseMessage, nil); err != nil {
					log.Println("conection closed : ", err)
				}
				return

			}

			data, err := json.Marshal(message)

			if err != nil {
				log.Println(err)

			}
			// fmt.Println("event sent .....",string(data))
			if err := c.connection.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Println("failed to send the message !!", err)
				return
			}
			log.Println("message sent !!")

		case <-ticker.C:
			log.Println("Ping")
			//send the ping to the client
			if err := c.connection.WriteMessage(websocket.PingMessage, []byte("")); err != nil {
				log.Println("ping write err :", err)
				return
			}
		}
	}
}		

func (c *Client) pongHandler(pongMsg string) error {
	log.Println("pong ")
	return c.connection.SetReadDeadline(time.Now().Add(pongWait))
}
