package app

import (
	"net/http"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/handler"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/middlewares"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/service"
)

// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/handler"
// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/repository"
// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"

func Run() {
	// repo := repository.NewTodoRepository()
	// service := service.NewTodoService(repo)
	// handler := handler.NewTodoHandler(service)
	redis := db.NewRedisClient()

	chatService := service.NewChatService(redis)

	handler := handler.NewChatHandler(chatService)
	middleware := middlewares.NewChatMiddleware(chatService)
	mux := http.NewServeMux()
	mux.HandleFunc("/send", handler.HandleSaveMessage)

	mux.HandleFunc("/createRoom", handler.HandleCreateRoom)

	mux.Handle("/getChatAdmin", middleware.AuthAdminMiddleware(http.HandlerFunc(handler.HandleGetMessage)))
	mux.Handle("/getChats", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleGetMessage)))
	mux.Handle("/saveMessage", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleSaveMessage)))
	mux.HandleFunc("/requestToJoin", handler.HandleRequestToJoin)
	mux.Handle("/joinRoomMember", middleware.AuthAdminMiddleware(http.HandlerFunc(handler.HandleJoinRoom)))
	mux.Handle("/getRoomMembers", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleGetMembers)))
	
	http.ListenAndServe(":8080", mux)
	// return &http.Server{
	// 	Addr:    ":8080",
	// 	Handler: mux,
	// }
}
