package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	// "time"

	// "github.com/redis/go-redis/v9"
)

// package main

type Event struct {
	Type    string `json:"type"`
	Payload string `json:"payload"`
}

type EventHandler func(event Event, c *Client , m *Manager) error

const (
	EventSendMesage = "send_message"
)

type ChatMessage struct {
	UserID  string `json:"userId"`
	Message string `json:"payload"`
}


func SendMessage(event Event, c *Client, m *Manager) error {
	fmt.Println("Room Id : ", c.RoomID, "Client Id: ", c.UserID)

	// payload := event.Payload;
	res :=ChatMessage{
		UserID:  c.UserID,
		Message: event.Payload,
	}

	payload, _ := json.Marshal(res)

	SaveRoomMessage(
		m,
		c.RoomID,
		res,
	)	
	stringPayload := string(payload)
	
	roomEvent := Event{
		Type:    event.Type,
		Payload: stringPayload,
	}

	c.manager.broadcast <- RoomEvent{
		RoomID: c.RoomID,
		Event:  roomEvent,
	}
	fmt.Println(event.Payload)
	return nil
}

// func  SaveRoomMessage(
// 	// ctx context.Context,
// 	m *Manager,
// 	roomID string,
// 	message string,
// 	// username string,
// 	userID string,
// 	ttl time.Duration,
// ) error {

// 	streamKey := "room:messages:" + roomID
// 	now := time.Now().UnixMilli()

// 	_, err := m.rdb.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
// 		pipe.XAdd(ctx, &redis.XAddArgs{
// 			Stream: streamKey,
// 			Values: map[string]interface{}{
// 				"timestamp": now,
// 				"message":   message,
// 				// "username":  username,
// 				"userId":    userID,
// 			},
// 		})
// 		pipe.Expire(ctx, streamKey, ttl)
// 		return nil
// 	})

// 	return err
// }

func SaveRoomMessage(
	m *Manager,
	roomID string,
	msg ChatMessage,
	// ttl time.Duration,
) error {

	key := "room:messages:" + roomID

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	pipe := m.rdb.Client.Pipeline()
	pipe.RPush(context.Background(), key, data)
	// pipe.Expire(context.Background(), key, ttl)
	_, err = pipe.Exec(context.Background())

	return err
}
