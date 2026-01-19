package middlewares

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/service"
)

type AdminAuthRequest struct {
	RoomID   string `json:"roomId"`
	AdminKey string `json:"adminKey"`
	AdminId  string `json:"adminId"`
}
type MemberAuthRequest struct {
	RoomID  string `json:"roomId"`
	UserId  string `json:"userId"`
	UserKey string `json:"userKey"`
}

type RoomMemberAuthRequest struct {
	RoomID    string  `json:"roomId"`
	MemberKey string  `json:"memberKey"`
	Message   *string `json:"message"`
}

type ChatMiddleware struct {
	chatService *service.ChatService
}

func NewChatMiddleware(chatService *service.ChatService) *ChatMiddleware {
	return &ChatMiddleware{
		chatService: chatService,
	}
}

func (c *ChatMiddleware) AuthAdminMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		ctx := r.Context()

		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var req AdminAuthRequest
		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}

		valid, err := c.chatService.ValidateAdminKey(ctx, req.RoomID, req.AdminId, req.AdminKey)

		if !valid {
			http.Error(w, "invalid admin", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (c *ChatMiddleware) AuthRoomMemberMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("middleware starts !!")
		ctx := r.Context()

		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var req MemberAuthRequest

		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		valid, err := c.chatService.ValidateRoomMember(ctx, req.RoomID, req.UserId, req.UserKey)

		if !valid {
			http.Error(w, "invalid room member", http.StatusBadRequest)
			return
		}
		fmt.Println("middleware crossed")
		next.ServeHTTP(w, r)

	})
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Allow frontend origin
		w.Header().Set("Access-Control-Allow-Origin", "*")
		// or better:
		// w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// func (v *ChatMiddleware) ValidateWSConnection(userID string , roomId string) (bool ,  error) {

// }
