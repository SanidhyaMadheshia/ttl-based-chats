package app

import (
	"log"
	"net/http"
	"os"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/handler"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/middlewares"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/service"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/websocket"
	"github.com/joho/godotenv"
	// "honnef.co/go/tools/config"
)

// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/handler"
// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/repository"
// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"

func Run() {
	// repo := repository.NewTodoRepository()
	// service := service.NewTodoService(repo)
	// handler := handler.NewTodoHandler(service)
	godotenv.Load()

	// cfg := config.Load()
	redis := db.NewRedisClient()

	chatService := service.NewChatService(redis)

	WSmanager := websocket.NewManager(redis)

	handler := handler.NewChatHandler(chatService , WSmanager)
	middleware := middlewares.NewChatMiddleware(chatService)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", handler.HandleHealth)
	mux.HandleFunc("/send", handler.HandleSaveMessage)

	mux.HandleFunc("/createRoom", handler.HandleCreateRoom)

	mux.Handle("/getChatAdmin", middleware.AuthAdminMiddleware(http.HandlerFunc(handler.HandleGetMessage)))
	mux.Handle("/getChats", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleGetMessage)))
	mux.Handle("/saveMessage", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleSaveMessage)))
	mux.HandleFunc("/requestToJoin", handler.HandleRequestToJoin)
	mux.Handle("/joinRoomMember", middleware.AuthAdminMiddleware(http.HandlerFunc(handler.HandleJoinRoom)))
	mux.Handle("/getRequestMembers", middleware.AuthAdminMiddleware(http.HandlerFunc(handler.HandleGetRequestMembers)))
	mux.Handle("/getRoomMembers", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleGetMembers)))
	mux.Handle("/validateRole", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleGetRole)))
	mux.Handle("/getTTL", middleware.AuthRoomMemberMiddleware(http.HandlerFunc(handler.HandleGetTTL)) )
	mux.Handle("/removeUser" , middleware.AuthAdminMiddleware(http.HandlerFunc(handler.HandleRemoveUser)))
	mux.Handle("/roomExists", http.HandlerFunc(handler.HandleGetRoomExits))
	mux.HandleFunc("/ws", WSmanager.ServeWS)
	// mux.Handle()
	// mux.Handle("/system-status",http.HandlerFunc(handler))
	// mux.HandleFunc("/bkcd", handler.HancheckOrigindleCrash)
	corsHandler := middlewares.CORS(mux)
	go WSmanager.Run() // Added

	// http.ListenAndServe(":8080", corsHandler)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // local fallback
	}
	log.Println("Server listening on port", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
	// return &http.Server{
	// 	Addr:    ":8080",
	// 	Handler: mux,
	// }
}
