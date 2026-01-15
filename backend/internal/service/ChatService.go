package service

import (
	"context"
	// "crypto/rand"
	"fmt"
	// "math/rand/v2"
	"time"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/lib"
	"github.com/redis/go-redis/v9"
	// "github.com/redis/go-redis/v9"
)

type ChatService struct {
	rdb *db.RedisClient
}

func NewChatService(rdb *db.RedisClient) *ChatService {
	return &ChatService{rdb: rdb}
}

// func (s *ChatService) temp()

func (s *ChatService) SaveMessage(ctx context.Context, chatID string, msg string, ttl time.Duration) error {
	key := "chat:" + chatID
	fmt.Println("saving...")
	fmt.Printf("%s %s ", key, msg)

	return s.rdb.Client.Set(ctx, key, msg, ttl).Err()
}

func (s *ChatService) GetMessage(ctx context.Context, chatID string) (string, error) {
	return s.rdb.Client.Get(ctx, "chat:"+chatID).Result()
}

func (s *ChatService) CreateChatRoom(ctx context.Context, ttl time.Duration, adminName string, roomName string) (string, string, error) {
	roomID := fmt.Sprintf("%d", time.Now().UnixNano())

	key := "room:" + roomID
	adminKey := lib.RandomString(12)
	adminId := lib.RandomString(8)

	err := s.rdb.Client.HSet(
		ctx,
		key,
		map[string]interface{}{
			"admin":    adminName,
			"roomName": roomName,
			"adminKey": adminKey,
		}).Err()
	// save the adminId as a member in the room members set
	memberKey := "room:members:" + roomID

	err = s.rdb.Client.SAdd(ctx, memberKey, adminId).Err()
	if err != nil {
		return "", "", err
	}

	err2 := s.rdb.Client.Expire(ctx, key, ttl).Err()
	if err2 != nil {
		return "", "", err2
	}

	err3 := s.rdb.Client.Expire(ctx, memberKey, ttl).Err()
	if err3 != nil {
		return "", "", err3
	}

	return roomID, adminKey, nil
}

func (s *ChatService) ValidateAdminKey(ctx context.Context, roomID string, adminKey string) (bool, error) {
	key := "room:" + roomID
	storedAdminKey, err := s.rdb.Client.HGet(ctx, key, "adminKey").Result()
	if err != nil {
		return false, err
	}

	return storedAdminKey == adminKey, nil

}
func (s *ChatService) ValidateRoomMember(ctx context.Context, roomID string, memberKey string) (bool, error) {
	key := "room:members:" + roomID
	exists, err := s.rdb.Client.SIsMember(ctx, key, memberKey).Result()

	if err != nil {
		return false, err
	}

	return exists, nil
}

func (s *ChatService) GetChatRoomAllMessage(
	ctx context.Context,
	roomID string,
) ([]map[string]string, error) {

	streamKey := "room:messages:" + roomID

	entries, err := s.rdb.Client.XRange(
		ctx,
		streamKey,
		"-",
		"+",
	).Result()

	if err != nil {
		return nil, err
	}

	messages := make([]map[string]string, 0, len(entries))

	for _, entry := range entries {
		msg := make(map[string]string)
		msg["id"] = entry.ID

		for k, v := range entry.Values {
			msg[k] = v.(string)
		}

		messages = append(messages, msg)
	}

	return messages, nil
}

func (s *ChatService) SaveRoomMessage(
	ctx context.Context,
	roomID string,
	message string,
	uname string,
	userID string,
	ttl time.Duration,
) error {

	streamKey := "room:messages:" + roomID
	now := time.Now().UnixMilli()

	_, err := s.rdb.Client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {

		// 1️⃣ Add message to stream
		pipe.XAdd(ctx, &redis.XAddArgs{
			Stream: streamKey,
			Values: map[string]interface{}{
				"timestamp": now,
				"message":   message,
				"uname":     uname,
				"userId":    userID,
			},
		})

		// 2️⃣ Set / refresh TTL on stream key
		pipe.Expire(ctx, streamKey, ttl)

		return nil
	})

	return err
}

func (s *ChatService) AddRequestRoomMember(
	ctx context.Context,
	roomID string,
	memberName string,
) (string, error) {

	memberKey := lib.RandomString(8)
	// memberKey = memberKey

	key := "room:request:" + roomID
	err := s.rdb.Client.SAdd(ctx, key, memberKey).Err()
	if err != nil {
		return "", err
	}

	return memberKey, nil
}

func (s *ChatService) ApproveRoomMember(
	ctx context.Context,
	roomID string,
	memberKey string,
) error {
	requestKey := "room:request:" + roomID
	memberSetKey := "room:members:" + roomID

	// Remove from request set
	err := s.rdb.Client.SRem(ctx, requestKey, memberKey).Err()
	if err != nil {
		return err
	}

	// Add to members set
	err = s.rdb.Client.SAdd(ctx, memberSetKey, memberKey).Err()
	if err != nil {
		return err
	}

	return nil
}

func (s *ChatService) GetChatRoomMembers(
	ctx context.Context,
	roomID string,
) ([]string, error) {
	memberSetKey := "room:members:" + roomID
	members, err := s.rdb.Client.SMembers(ctx, memberSetKey).Result()
	if err != nil {
		return nil, err
	}
	return members, nil
}
