package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/middlewares"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/service"
)

type CreateRoomRespose struct {
	ChatID   string `json:"chatID"`
	AdminKey string `json:"adminKey"`
}

type ChatHandler struct {
	chatService *service.ChatService
}
type SaveMessageRequest struct {
	RoomID   string  `json:"roomId"`
	Message  *string `json:"message"`
	Username string  `json:"username"`
	UserID   string  `json:"userId"`
}

func NewChatHandler(chatService *service.ChatService) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
	}
}

func (h *ChatHandler) HandleSaveMessage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	// chatID := r.URL.Query().Get("id")
	// ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req SaveMessageRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	err2 := h.chatService.SaveRoomMessage(ctx, req.RoomID, *req.Message, req.Username, req.UserID, time.Minute)

	if err2 != nil {
		http.Error(
			w,
			"failed ",
			500,
		)
	}
	w.WriteHeader(http.StatusOK)
	w.Write(
		[]byte("ok"),
	)

}

func (h *ChatHandler) HandleCreateRoom(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	adminName := r.URL.Query().Get("admin")
	roomName := r.URL.Query().Get("roomName")
	ttlRaw := r.URL.Query().Get("ttl")

	ttl, err := time.ParseDuration(ttlRaw)

	chatID, adminKey, err := h.chatService.CreateChatRoom(ctx, ttl, adminName, roomName)

	if err != nil {
		http.Error(
			w,
			"failed to create chat room",
			500,
		)
		return
	}
	// resJSon := `{"chatID":"` + chatID + `"}`

	res := &CreateRoomRespose{
		ChatID:   chatID,
		AdminKey: adminKey,
	}
	resJson, err := json.Marshal(res)
	if err != nil {
		http.Error(
			w,
			"failed to marshal response",
			500,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)

}

func (h *ChatHandler) HandleGetMessage(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req middlewares.AdminAuthRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	messages, err := h.chatService.GetChatRoomAllMessage(ctx, req.RoomID)

	if err != nil {
		http.Error(
			w,
			"failed to get messages",
			500,
		)
		return
	}

	resJson, err := json.Marshal(messages)
	if err != nil {
		http.Error(
			w,
			"failed to marshal response",
			500,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)

}

func (h *ChatHandler) HandleGetMembers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req middlewares.AdminAuthRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	members, err := h.chatService.GetChatRoomMembers(ctx, req.RoomID)

	if err != nil {
		http.Error(
			w,
			"failed to get members",
			500,
		)
		return
	}

	resJson, err := json.Marshal(members)
	if err != nil {
		http.Error(
			w,
			"failed to marshal response",
			500,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)
}

func (h *ChatHandler) HandleRequestToJoin(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		RoomID   string `json:"roomId"`
		Username string `json:"username"`
	}

	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	memberKey, err := h.chatService.AddRequestRoomMember(ctx, req.RoomID, req.Username)
	if err != nil {
		http.Error(
			w,
			"failed to add member",
			500,
		)
		return
	}

	res := struct {
		MemberKey string `json:"memberKey"`
	}{
		MemberKey: memberKey,
	}

	resJson, err := json.Marshal(res)
	if err != nil {
		http.Error(
			w,
			"failed to marshal response",
			500,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)

}

func (h *ChatHandler) HandleJoinRoom(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		RoomID    string `json:"roomId"`
		MemberKey string `json:"memberKey"`
	}

	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	err = h.chatService.ApproveRoomMember(ctx, req.RoomID, req.MemberKey)
	if err != nil {
		http.Error(
			w,
			"failed to add member",
			500,
		)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(
		[]byte("ok"),
	)
}
