package middlewares

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/service"
)

type AdminAuthRequest struct {
	RoomID   string `json:"roomId"`
	AdminKey string `json:"adminKey"`
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

		valid, err := c.chatService.ValidateAdminKey(ctx, req.RoomID, req.AdminKey)

		if !valid {
			http.Error(w, "invalid admin", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (c *ChatMiddleware) AuthRoomMemberMiddleware(next http.Handler) http.Handler {
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
		valid, err := c.chatService.ValidateRoomMember(ctx, req.RoomID, req.AdminKey)

		if !valid {
			http.Error(w, "invalid room member", http.StatusBadRequest)
			return
		}
		next.ServeHTTP(w, r)

	})
}
