package service
import (
	// "context"
	// // "crypto/rand"
	// "fmt"
	// // "math/rand/v2"
	// "time"

	"github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/db"
	// "github.com/SanidhyaMadheshia/ttl-based-chats/backend/internal/lib"
	// "github.com/redis/go-redis/v9"
	// "github.com/redis/go-redis/v9"
)

type VoiceService struct {
	rdb *db.RedisClient
}

func NewVoiceService(rdb *db.RedisClient) *ChatService {
	return &ChatService{rdb: rdb}
}
