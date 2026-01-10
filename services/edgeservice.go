package services

import (
	"crypto/md5"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/wujunwei928/edge-tts-go/edge_tts"
)

type EdgeTtsService struct{}

func (e *EdgeTtsService) ListVoices() ([]edge_tts.Voice, error) {
	return edge_tts.ListVoices("")
}

func (e *EdgeTtsService) GenerateSpeech(v edge_tts.Voice, r string, vo string, p string, outputPath string, content string) (string, error) {
	
	if info, err := os.Stat(outputPath); err == nil && info.IsDir() {
		// Generate a unique filename based on content hash, timestamp, and extension
		contentHash := fmt.Sprintf("%x", md5.Sum([]byte(content)))
		timestamp := time.Now().Format("20060102150405")
		filename := fmt.Sprintf("tts_%s_%s.mp3", contentHash[:8], timestamp)
		outputPath = filepath.Join(outputPath, filename)
	} else if err != nil && os.IsNotExist(err) {
		// Check if parent directory exists, if not create it
		parentDir := filepath.Dir(outputPath)
		if err := os.MkdirAll(parentDir, 0755); err != nil {
			return "", fmt.Errorf("failed to create parent directory: %w", err)
		}
	}
	
	var rate, volume, pitch = r, vo, p
	if rate == "" {
		rate = "+0%"
	}
	if volume == "" {
		volume = "+0%"
	}
	if pitch == "" {
		pitch = "+0Hz"
	}
	connOptions := []edge_tts.CommunicateOption{
		edge_tts.SetVoice(v.ShortName),
		edge_tts.SetRate(rate),
		edge_tts.SetVolume(volume),
		edge_tts.SetPitch(pitch),
		edge_tts.SetReceiveTimeout(20),
	}

	conn, err := edge_tts.NewCommunicate(
		content,
		connOptions...,
	)
	if err != nil {
		return "", err
	}

	audioData, err := conn.Stream()
	if err != nil {
		return "", err
	}
	writeMediaErr := os.WriteFile(outputPath, audioData, 0644)
	if writeMediaErr != nil {
		return "", writeMediaErr
	}
	return outputPath, nil
}
