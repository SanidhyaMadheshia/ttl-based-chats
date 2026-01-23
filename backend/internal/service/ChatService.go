// package service

// import (
// 	"context"
// 	// "crypto/rand"
// 	"fmt"
// 	// "math/rand/v2"
// 	"time"

// 	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
// 	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/lib"
// 	"github.com/redis/go-redis/v9"
// 	// "github.com/redis/go-redis/v9"
// )

// type ChatService struct {
// 	rdb *db.RedisClient
// }

// func NewChatService(rdb *db.RedisClient) *ChatService {
// 	return &ChatService{rdb: rdb}
// }

// // func (s *ChatService) temp()

// func (s *ChatService) SaveMessage(ctx context.Context, chatID string, msg string, ttl time.Duration) error {
// 	key := "chat:" + chatID
// 	fmt.Println("saving...")
// 	fmt.Printf("%s %s ", key, msg)

// 	return s.rdb.Client.Set(ctx, key, msg, ttl).Err()
// }

// func (s *ChatService) GetMessage(ctx context.Context, chatID string) (string, error) {
// 	return s.rdb.Client.Get(ctx, "chat:"+chatID).Result()
// }

// func (s *ChatService) CreateChatRoom(ctx context.Context, ttl time.Duration, adminName string, roomName string) (string, string, string, error) {
// 	roomID := fmt.Sprintf("%d", time.Now().UnixNano())

// 	key := "room:" + roomID
// 	adminKey := lib.RandomString(12)
// 	adminId := lib.RandomString(8)

// 	err := s.rdb.Client.HSet(
// 		ctx,
// 		key,
// 		map[string]interface{}{
// 			"adminId":  adminId,
// 			"admin":    adminName,
// 			"roomName": roomName,
// 			"adminKey": adminKey,
// 		}).Err()
// 	// save the adminId as a member in the room members set
// 	memberKey := "room:members:" + roomID

// 	err = s.rdb.Client.SAdd(ctx, memberKey, adminId).Err()
// 	if err != nil {
// 		return "", "", "", err
// 	}
// 	keyName := "room:membername:" + roomID + ":" + adminId
// 	err4 := s.rdb.Client.Set(ctx, keyName, adminName, ttl).Err()

// 	keyKey := "room:memberKey:" + roomID + ":" + adminId
// 	err5 := s.rdb.Client.Set(ctx, keyKey, adminKey, ttl).Err()

// 	if err4 != nil {
// 		return "", "", "", err4
// 	}
// 	if err5 != nil {
// 		return "", "", "", err4
// 	}

// 	err2 := s.rdb.Client.Expire(ctx, key, ttl).Err()
// 	if err2 != nil {
// 		return "", "", "", err2
// 	}

// 	err3 := s.rdb.Client.Expire(ctx, memberKey, ttl).Err()
// 	if err3 != nil {
// 		return "", "", "", err3
// 	}

// 	return roomID, adminKey, adminId, nil
// }

// func (s *ChatService) ValidateAdminKey(ctx context.Context, roomID string, adminKey string) (bool, error) {
// 	key := "room:" + roomID
// 	storedAdminKey, err := s.rdb.Client.HGet(ctx, key, "adminKey").Result()
// 	if err != nil {
// 		return false, err
// 	}

// 	return storedAdminKey == adminKey, nil

// }
// func (s *ChatService) ValidateRoomMember(ctx context.Context, roomID string, userId string, memberKey string) (bool, error) {
// 	key := "room:members:" + roomID
// 	exists, err := s.rdb.Client.SIsMember(ctx, key, userId).Result()

// 	if err != nil {
// 		fmt.Println(err)
// 		fmt.Println(roomID, " ", userId, " ", memberKey)
// 		return false, err
// 	}
// 	keyKey := "room:memberKey:" + roomID + ":" + userId
// 	userKey, err2 := s.rdb.Client.Get(ctx, keyKey).Result()

// 	if err2 != nil {
// 		fmt.Println(err2)
// 		fmt.Println(roomID, " ", userId, " ", memberKey)
// 		return false, err2
// 	}
// 	if userKey != memberKey {
// 		fmt.Println(roomID, " 3 ", userId, " ", memberKey, " ")
// 		// fmt.Println(userKey.String())
// 		return false, nil
// 	}
// 	return exists, nil
// }

// func (s *ChatService) GetChatRoomAllMessage(
// 	ctx context.Context,
// 	roomID string,
// ) ([]map[string]string, error) {

// 	streamKey := "room:messages:" + roomID

// 	entries, err := s.rdb.Client.XRange(
// 		ctx,
// 		streamKey,
// 		"-",
// 		"+",
// 	).Result()

// 	if err != nil {
// 		return nil, err
// 	}

// 	messages := make([]map[string]string, 0, len(entries))

// 	for _, entry := range entries {
// 		msg := make(map[string]string)
// 		msg["id"] = entry.ID

// 		for k, v := range entry.Values {
// 			msg[k] = v.(string)
// 		}

// 		messages = append(messages, msg)
// 	}

// 	return messages, nil
// }

// func (s *ChatService) SaveRoomMessage(
// 	ctx context.Context,
// 	roomID string,
// 	message string,
// 	uname string,
// 	userID string,
// 	ttl time.Duration,
// ) error {

// 	streamKey := "room:messages:" + roomID
// 	now := time.Now().UnixMilli()

// 	_, err := s.rdb.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {

// 		// 1️⃣ Add message to stream
// 		pipe.XAdd(ctx, &redis.XAddArgs{
// 			Stream: streamKey,
// 			Values: map[string]interface{}{
// 				"timestamp": now,
// 				"message":   message,
// 				"uname":     uname,
// 				"userId":    userID,
// 			},
// 		})

// 		// 2️⃣ Set / refresh TTL on stream key
// 		pipe.Expire(ctx, streamKey, ttl)

// 		return nil
// 	})

// 	return err
// }

// func (s *ChatService) AddRequestRoomMember(
// 	ctx context.Context,
// 	roomID string,
// 	memberName string,
// ) (string, string, error) {
// 	memberKey := lib.RandomString(12)
// 	memberId := lib.RandomString(8)
// 	// memberKey = memberKey
// 	key := "room:request:" + roomID
// 	keyName := "room:membername:" + roomID + ":" + memberId
// 	ttl := s.rdb.Client.TTL(ctx, "room:"+roomID).Val()
// 	keyKey := "room:memberKey:" + roomID + ":" + memberId

// 	err3 := s.rdb.Client.Set(ctx, keyKey, memberKey, ttl).Err()

// 	if err3 != nil {
// 		return "", "", err3
// 	}

// 	// // Set TTL on request set same as room TTL
// 	// s.rdb.Client.Expire(ctx, key, ttl)
// 	err := s.rdb.Client.SAdd(ctx, key, memberId).Err()
// 	if err != nil {
// 		return "", "", err
// 	}
// 	err2 := s.rdb.Client.Set(ctx, keyName, memberName, ttl).Err()

// 	if err2 != nil {
// 		return "", "", err2
// 	}

// 	return memberId, memberKey, nil
// }

// func (s *ChatService) ApproveRoomMember(
// 	ctx context.Context,
// 	roomID string,
// 	memberKey string,
// ) error {
// 	requestKey := "room:request:" + roomID
// 	memberSetKey := "room:members:" + roomID

// 	// Remove from request set
// 	err := s.rdb.Client.SRem(ctx, requestKey, memberKey).Err()
// 	if err != nil {
// 		return err
// 	}

// 	// Add to members set
// 	err = s.rdb.Client.SAdd(ctx, memberSetKey, memberKey).Err()
// 	if err != nil {
// 		return err
// 	}

// 	return nil
// }

// type MemberDetail struct {
// 	Name string `json:"name"`
// 	Key  string `json:"key"`
// }

// func (s *ChatService) GetChatRoomMembers(
// 	ctx context.Context,
// 	roomID string,
// ) ([]MemberDetail, error) {
// 	memberSetKey := "room:members:" + roomID
// 	members, err := s.rdb.Client.SMembers(ctx, memberSetKey).Result()
// 	memberList := make([]MemberDetail, 0, len(members))
// 	if err != nil {
// 		return nil, err
// 	}
// 	for _, memberKey := range members {
// 		keyName := "room:membername:" + roomID + ":" + memberKey
// 		memberName, err := s.rdb.Client.Get(ctx, keyName).Result()
// 		if err != nil {
// 			fmt.Println("hello errror")
// 			return nil, err
// 		}
// 		memberList = append(memberList, MemberDetail{
// 			Name: memberName,
// 			Key:  memberKey,
// 		})
// 	}

// 	return memberList, nil
// }

// func (s *ChatService) GetRole(
// 	ctx context.Context,
// 	roomID string,
// 	// userKey string,
// 	userID string,
// ) (string, error) {
// 	fmt.Println("check role !!")
// 	roomKey := "room:" + roomID

// 	// 1️⃣ Check admin
// 	adminId, err := s.rdb.Client.HGet(ctx, roomKey, "adminId").Result()

// 	if err == nil && adminId == userID {
// 		return "admin", nil
// 	}

// 	// 2️⃣ Check member
// 	memberKey := "room:members:" + roomID
// 	isMember, err := s.rdb.Client.SIsMember(ctx, memberKey, userID).Result()
// 	if err != nil {
// 		return "", err
// 	}
// 	if isMember {
// 		return "member", nil
// 	}

// 	// 3️⃣ Check pending request
// 	requestKey := "room:request:" + roomID
// 	isPending, err := s.rdb.Client.SIsMember(ctx, requestKey, userID).Result()
// 	if err != nil {
// 		return "", err
// 	}
// 	if isPending {
// 		return "memberPending", nil
// 	}

// 	return "", nil
// }

package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/lib"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/websocket"
	"github.com/redis/go-redis/v9"
)

type ChatService struct {
	rdb *db.RedisClient
}

func NewChatService(rdb *db.RedisClient) *ChatService {
	return &ChatService{rdb: rdb}
}

//
// ────────────────────────────────
// ROOM CREATION
// ────────────────────────────────
//

func (s *ChatService) CreateChatRoom(
	ctx context.Context,
	ttl time.Duration,
	adminName string,
	roomName string,
) (roomID string, adminKey string, adminID string, err error) {

	roomID = fmt.Sprintf("%d", time.Now().UnixNano())
	adminID = lib.RandomString(8)
	adminKey = lib.RandomString(12)

	roomKey := "room:" + roomID
	memberSetKey := "room:members:" + roomID
	adminKeyKey := "room:adminKey:" + roomID
	memberNameKey := "room:memberName:" + roomID + ":" + adminID
	memberKeyKey := "room:memberKey:" + roomID + ":" + adminID
	messageKey := "room:messages:" + roomID
	pipe := s.rdb.Client.TxPipeline()

	pipe.HSet(ctx, roomKey, map[string]interface{}{
		"roomName": roomName,
		"adminId":  adminID,
	})

	pipe.Set(ctx, adminKeyKey, adminKey, ttl)
	pipe.SAdd(ctx, memberSetKey, adminID)
	pipe.Set(ctx, memberNameKey, adminName, ttl)
	pipe.Set(ctx, memberKeyKey, adminKey, ttl)
	pipe.RPush(ctx, messageKey, "__init__")
	pipe.LPop(ctx, messageKey)
	pipe.Expire(ctx, messageKey, ttl)
	pipe.Expire(ctx, roomKey, ttl)
	pipe.Expire(ctx, memberSetKey, ttl)

	_, err = pipe.Exec(ctx)
	return
}

//
// ────────────────────────────────
// ROLE & AUTH
// ────────────────────────────────
//

func (s *ChatService) ValidateAdminKey(
	ctx context.Context,
	roomID string,
	adminId string,
	adminKey string,
) (bool, error) {

	storedKey, err := s.rdb.Client.Get(ctx, "room:memberKey:"+roomID+":"+adminId).Result()
	// Get(ctx, "room:adminKey:"+roomID).
	// Result()

	if err != nil {
		return false, err
	}

	return storedKey == adminKey, nil
}

func (s *ChatService) ValidateRoomMember(
	ctx context.Context,
	roomID string,
	userID string,
	userKey string,
) (bool, error) {

	memberSetKey := "room:members:" + roomID
	memberRequestSetKey := "room:request:" + roomID
	isMember, err := s.rdb.Client.SIsMember(ctx, memberSetKey, userID).Result()
	if err != nil || !isMember {
		isRequestMember, err2 := s.rdb.Client.SIsMember(ctx, memberRequestSetKey, userID).Result()

		if err2 != nil || !isRequestMember {
			return false, err
		}
		// return false, err
	}

	keyKey := "room:memberKey:" + roomID + ":" + userID
	storedKey, err := s.rdb.Client.Get(ctx, keyKey).Result()
	if err != nil {
		return false, err
	}

	return storedKey == userKey, nil
}

func (s *ChatService) GetRole(
	ctx context.Context,
	roomID string,
	userID string,
) (string, error) {

	roomKey := "room:" + roomID

	adminID, err := s.rdb.Client.HGet(ctx, roomKey, "adminId").Result()
	if err == nil && adminID == userID {
		return "admin", nil
	}

	memberSetKey := "room:members:" + roomID
	isMember, err := s.rdb.Client.SIsMember(ctx, memberSetKey, userID).Result()
	if err != nil {
		return "", err
	}
	if isMember {
		return "member", nil
	}

	requestKey := "room:request:" + roomID
	isPending, err := s.rdb.Client.SIsMember(ctx, requestKey, userID).Result()
	if err != nil {
		return "", err
	}
	if isPending {
		return "memberPending", nil
	}

	return "", nil
}

func (s *ChatService) GetRoomExists(
	ctx context.Context,
	roomId string,
) (bool, string, error) {
	key := "room:" + roomId

	exists, err := s.rdb.Client.Exists(ctx, key).Result()

	if err != nil {
		return false, "", err
	}
	roomName, err2 := s.rdb.Client.HGet(ctx, key, "roomName").Result()

	if err != nil {
		return false, "", err2
	}

	return exists == 1, roomName, nil
}

func (s *ChatService) GetTTL(
	ctx context.Context,
	roomID string,

) (string, error) {
	key := "room:" + roomID

	ttl, err := s.rdb.Client.TTL(ctx, key).Result()
	if err != nil {
		return "", err
	}

	// Key does not exist
	if ttl == -2 {
		return "key does not exist", nil
	}

	// Key exists but no expiry
	if ttl == -1 {
		return "no expiry", nil
	}

	// Return seconds as string
	return ttl.String(), nil
}

//
// ────────────────────────────────
// JOIN REQUEST FLOW
// ────────────────────────────────
//

func (s *ChatService) AddRequestRoomMember(
	ctx context.Context,
	roomID string,
	memberName string,
) (memberID string, memberKey string, err error) {

	ttlCmd := s.rdb.Client.TTL(ctx, "room:"+roomID)
	if ttlCmd.Err() != nil || ttlCmd.Val() <= 0 {
		return "", "", errors.New("room expired")
	}
	ttl := ttlCmd.Val()

	memberID = lib.RandomString(8)
	memberKey = lib.RandomString(12)

	requestKey := "room:request:" + roomID
	memberNameKey := "room:memberName:" + roomID + ":" + memberID
	memberKeyKey := "room:memberKey:" + roomID + ":" + memberID

	pipe := s.rdb.Client.TxPipeline()

	pipe.SAdd(ctx, requestKey, memberID)
	pipe.Set(ctx, memberNameKey, memberName, ttl)
	pipe.Set(ctx, memberKeyKey, memberKey, ttl)

	_, err = pipe.Exec(ctx)
	return
}

func (s *ChatService) ApproveRoomMember(
	ctx context.Context,
	roomID string,
	memberID string,
) error {

	requestKey := "room:request:" + roomID
	memberSetKey := "room:members:" + roomID

	pipe := s.rdb.Client.TxPipeline()
	pipe.SRem(ctx, requestKey, memberID)
	pipe.SAdd(ctx, memberSetKey, memberID)
	_, err := pipe.Exec(ctx)

	return err
}

//
// ────────────────────────────────
// MEMBERS
// ────────────────────────────────
//

type MemberDetail struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	IsAdmin bool   `json:"isAdmin"`
}

func (s *ChatService) GetChatRoomMembers(
	ctx context.Context,
	roomID string,
) ([]MemberDetail, error) {

	memberSetKey := "room:members:" + roomID
	members, err := s.rdb.Client.SMembers(ctx, memberSetKey).Result()
	if err != nil {
		return nil, err
	}
	key := "room:" + roomID
	adminKey, err := s.rdb.Client.HGet(ctx, key, "adminId").Result()

	result := make([]MemberDetail, 0, len(members))

	for _, memberID := range members {
		nameKey := "room:memberName:" + roomID + ":" + memberID
		name, err := s.rdb.Client.Get(ctx, nameKey).Result()
		if err != nil {
			continue
		}
		result = append(result, MemberDetail{
			ID:      memberID,
			Name:    name,
			IsAdmin: memberID == adminKey,
		})
	}

	return result, nil
}

// type MemberDetail struct {
// 	ID   string `json:"id"`
// 	Name string `json:"name"`
// }

func (s *ChatService) GetChatRoomRequestMembers(
	ctx context.Context,
	roomID string,
) ([]MemberDetail, error) {

	memberSetKey := "room:request:" + roomID
	members, err := s.rdb.Client.SMembers(ctx, memberSetKey).Result()
	if err != nil {
		return nil, err
	}

	result := make([]MemberDetail, 0, len(members))

	for _, memberID := range members {
		nameKey := "room:memberName:" + roomID + ":" + memberID
		name, err := s.rdb.Client.Get(ctx, nameKey).Result()
		if err != nil {
			continue
		}
		result = append(result, MemberDetail{
			ID:   memberID,
			Name: name,
		})
	}

	return result, nil
}

//
// ────────────────────────────────
// MESSAGES (REDIS STREAMS)
// ────────────────────────────────
//

func (s *ChatService) SaveRoomMessage(
	ctx context.Context,
	roomID string,
	message string,
	// username string,
	userID string,
	ttl time.Duration,
) error {

	streamKey := "room:messages:" + roomID
	now := time.Now().UnixMilli()

	_, err := s.rdb.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.XAdd(ctx, &redis.XAddArgs{
			Stream: streamKey,
			Values: map[string]interface{}{
				"timestamp": now,
				"message":   message,
				// "username":  username,
				"userId": userID,
			},
		})
		pipe.Expire(ctx, streamKey, ttl)
		return nil
	})

	return err
}

// func (s *ChatService) GetChatRoomAllMessage(
// 	ctx context.Context,
// 	roomID string,
// ) ([]map[string]string, error) {

// 	streamKey := "room:messages:" + roomID

// 	fmt.Println(streamKey)
// 	entries, err := s.rdb.Client.XRange(ctx, streamKey, "-", "+").Result()
// 	if err != nil {
// 		return nil, err
// 	}

// 	messages := make([]map[string]string, 0, len(entries))

// 	for _, entry := range entries {
// 		msg := map[string]string{
// 			"id": entry.ID,
// 		}
// 		for k, v := range entry.Values {
// 			msg[k] = fmt.Sprint(v)
// 		}
// 		messages = append(messages, msg)
// 	}

// 	return messages, nil
// }

func (s *ChatService) GetChatRoomAllMessage(
	ctx context.Context,
	roomID string,
) ([]websocket.ChatMessage, error) {

	key := "room:messages:" + roomID

	values, err := s.rdb.Client.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	messages := make([]websocket.ChatMessage, 0, len(values))

	for _, v := range values {
		var msg websocket.ChatMessage
		if err := json.Unmarshal([]byte(v), &msg); err != nil {
			continue // skip bad message
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// func (s *ChatService) RemoveUser(
// 	ctx context.Context,
// 	roomId string,
// 	removeUserId string,
// ) error {

// }

func (s *ChatService) RemoveUser(
	ctx context.Context,
	roomId string,
	removeUserId string,
) error {

	memberSetKey := "room:members:" + roomId
	requestSetKey := "room:request:" + roomId
	nameKey := "room:memberName:" + roomId + ":" + removeUserId
	// roomKey := "room:" + roomId
	fmt.Println("removing User--------------------> userId ", removeUserId)
	_, err := s.rdb.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {

		// Remove from active members
		pipe.SRem(ctx, memberSetKey, removeUserId)

		// Remove from request members (safe even if not exists)
		pipe.SRem(ctx, requestSetKey, removeUserId)

		// Remove stored name
		pipe.Del(ctx, nameKey)

		return nil
	})

	return err
}
