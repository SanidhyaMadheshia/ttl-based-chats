package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/middlewares"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/service"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/websocket"
)

type CreateRoomRespose struct {
	ChatID  string `json:"chatID"`
	UserKey string `json:"userKey"`
	UserId  string `json:"userId"`
}

type ChatHandler struct {
	chatService *service.ChatService
	wsManager   *websocket.Manager
}
type SaveMessageRequest struct {
	RoomID   string  `json:"roomId"`
	Message  *string `json:"message"`
	Username string  `json:"username"`
	UserID   string  `json:"userId"`
}

func NewChatHandler(chatService *service.ChatService, wsManager *websocket.Manager) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
		wsManager:   wsManager,
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

	err2 := h.chatService.SaveRoomMessage(ctx, req.RoomID, *req.Message, req.UserID, time.Minute)

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
	fmt.Println("validate handler called")
	ctx := r.Context()

	adminName := r.URL.Query().Get("admin")
	roomName := r.URL.Query().Get("roomName")
	ttlRaw := r.URL.Query().Get("ttl")

	ttl, err := time.ParseDuration(ttlRaw)

	chatID, adminKey, adminId, err := h.chatService.CreateChatRoom(ctx, ttl, adminName, roomName)

	if err != nil {
		http.Error(
			w,
			"failed to create chat room",
			500,
		)
		return
	}
	// resJSon := `{"chatID":"` + chatID + `"}`

	h.wsManager.SetRoomAdmin(chatID, adminId)
	res := &CreateRoomRespose{
		ChatID:  chatID,
		UserKey: adminKey,
		UserId:  adminId,
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

	var req middlewares.RoomMemberAuthRequest
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

	var req middlewares.MemberAuthRequest
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
func (h *ChatHandler) HandleGetRequestMembers(w http.ResponseWriter, r *http.Request) {
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
	members, err := h.chatService.GetChatRoomRequestMembers(ctx, req.RoomID)

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
	fmt.Println("request to join called")
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

	fmt.Printf("Requesting to join room: %s with username: %s\n", req.RoomID, req.Username)

	memberId, memberKey, err := h.chatService.AddRequestRoomMember(ctx, req.RoomID, req.Username)
	if err != nil {
		http.Error(
			w,
			"failed to add member",
			500,
		)
		return
	}
	payloadBytes, err := json.Marshal(struct {
		Username string `json:"username"`
		UserID   string `json:"userId"`
	}{
		Username: req.Username,
		UserID:   memberId,
	})

	if err != nil {
		log.Println("failed to marshal payload:", err)
		return
	}
	h.wsManager.SendToAdmin(req.RoomID, websocket.Event{
		Type:    "REQUEST_TO_JOIN",
		Payload: string(payloadBytes),
	})
	res := struct {
		MemberKey string `json:"userKey"`
		MemberId  string `json:"userId"`
	}{
		MemberKey: memberKey,
		MemberId:  memberId,
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

	users, err2 := h.chatService.GetChatRoomMembers(ctx, req.RoomID)

	if err2 != nil {
		http.Error(w, "failed to fetch users", http.StatusInternalServerError)
		return
	}
	payload, _ := json.Marshal(users)

	h.wsManager.BroadcastToRoom(req.RoomID, websocket.Event{
		Type:    "room_users_updated",
		Payload: string(payload),
	})

	w.WriteHeader(http.StatusOK)
	w.Write(
		[]byte("ok"),
	)
}

func (h *ChatHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)

	resJson := `{"status":"iski mausi ka tun tun chal gya !!"}`
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(resJson))
	//
	// w.Write([]byte("healthy"))
}

func (h *ChatHandler) HandleGetRole(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		RoomID  string `json:"roomId"`
		UserKey string `json:"userKey"`
		UserId  string `json:"userId"`
	}

	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	role, err := h.chatService.GetRole(ctx, req.RoomID, req.UserId)

	if role == "" {
		http.Error(w, "user is not in this room ", http.StatusBadRequest)
	}
	res := struct {
		Role string `json:"role"`
	}{
		Role: role,
	}

	resJson, err := json.Marshal(res)
	w.Header().Set("Content-Type", "application/json")
	// w.Write([]byte(resJson))
	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)

}

func (h *ChatHandler) HandleGetRoomExits(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	roomId := r.URL.Query().Get("roomId")

	exists, roomName, err := h.chatService.GetRoomExists(ctx, roomId)

	if err != nil {
		fmt.Println("error in roomExists", err)

	}
	res := struct {
		Exists   bool   `json:"exists"`
		RoomName string `json:"roomName"`
	}{
		Exists:   exists,
		RoomName: roomName,
	}

	resJson, _ := json.Marshal(res)
	w.Header().Set("Content-Type", "application/json")
	// w.Write([]byte(resJson))
	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)
}

func (h *ChatHandler) HandleGetTTL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		RoomID string `json:"roomId"`
		// MemberKey string `json:"memberKey"`
	}

	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	ttl, _ := h.chatService.GetTTL(ctx, req.RoomID)

	fmt.Println("ttl time --------------> ", ttl)

	res := struct {
		TTL string `json:"TTL"`
	}{
		TTL: ttl,
	}

	resJson, _ := json.Marshal(res)
	w.Header().Set("Content-Type", "application/json")
	// w.Write([]byte(resJson))

	w.WriteHeader(http.StatusOK)
	w.Write(
		resJson,
	)

}

func (h *ChatHandler) HandleRemoveUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req struct {
		RoomID       string `json:"roomId"`
		RemoveUserId string `json:"removeUserId"`
		// MemberKey string `json:"memberKey"`
	}

	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		fmt.Println("json Identified !!")
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	err2 := h.chatService.RemoveUser(ctx, req.RoomID, req.RemoveUserId)

	if err2 != nil {
		fmt.Println("json Identified  2!!")
		http.Error(w, "user Not exists", http.StatusBadRequest)
	}
	// w.Write()
	res := struct {
		OK string `json:"ok"`
	}{
		OK: "ok",
	}

	resJson, _ := json.Marshal(res)
	w.Header().Set("Content-Type", "application/json")
	// w.Write([]byte(resJson))
	
	w.WriteHeader(http.StatusOK)
	w.Write(resJson)
	// w.Write(
	// 	resJson,
	// )
}
