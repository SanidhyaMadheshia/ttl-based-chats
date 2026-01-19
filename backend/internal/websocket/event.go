package websocket

import "fmt"

// package main

type Event struct {
	Type    string `json:"type"`
	Payload string `json:"payload"`
}

type EventHandler func(event Event, c *Client) error

const (
	EventSendMesage = "send_message"
)



type SendMessageEvent struct {
	Message string `json:"message"`
	From    string `json:"from"`
}




func SendMessage(event Event, c *Client) error {
	fmt.Println(event)
	return nil
}

