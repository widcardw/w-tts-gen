package services

import (
	"crypto/md5"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"time"

	ni "bridgetts/services/nativeinvocation"
)

type NativeTts struct{}

func (n *NativeTts) GetVoices() ([]ni.VoiceInfo, error) {
	goos := runtime.GOOS
	switch goos {
	case "darwin":
		{
			return ni.GetDarwinVoiceList()
		}
	case "windows":
		{
			return ni.GetWindowsVoiceList()
		}
	default:
		{
			return nil, fmt.Errorf("OS not supported.")
		}
	}
}

func (n *NativeTts) TryListening(v ni.VoiceInfo) error {
	goos := runtime.GOOS
	switch goos {
	case "darwin":
		{
			return ni.TryListeningDarwin(v)
		}
	case "windows":
		{
			return ni.TryListeningWindows(v)
		}
	default:
		{
			return fmt.Errorf("OS not supported.")
		}
	}
}

func (n *NativeTts) GenerateSpeech(v ni.VoiceInfo, s string, outputPath string) (string, error) {
	goos := runtime.GOOS

	// Check if outputPath is a directory
	if info, err := os.Stat(outputPath); err == nil && info.IsDir() {
		// Generate a unique filename based on content hash, timestamp, and extension
		contentHash := fmt.Sprintf("%x", md5.Sum([]byte(s)))
		timestamp := time.Now().Format("20060102150405")
		filename := fmt.Sprintf("tts_%s_%s.wav", contentHash[:8], timestamp)
		outputPath = filepath.Join(outputPath, filename)
	} else if err != nil && os.IsNotExist(err) {
		// Check if parent directory exists, if not create it
		parentDir := filepath.Dir(outputPath)
		if err := os.MkdirAll(parentDir, 0755); err != nil {
			return "", fmt.Errorf("failed to create parent directory: %w", err)
		}
	}

	switch goos {
	case "darwin":
		{
			return ni.DarwinGenerateTts(v, outputPath, s)
		}
	case "windows":
		{
			return ni.WindowsGenerateTts(v, outputPath, s)
		}
	default:
		{
			cmd := exec.Command("espeak", s, "-w", outputPath)
			if err := cmd.Run(); err != nil {
				return "", err
			}
			return outputPath, nil
		}
	}
}
