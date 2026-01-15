package lib

import (
	"math/rand"
	// "time"
)

// import "crypto/rand"



func RandomString(length int) string {
    rand.New(rand.NewSource(23))
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    result := make([]byte, length)
    for i := range result {
        result[i] = charset[rand.Intn(len(charset))]
    }
    return string(result)
}