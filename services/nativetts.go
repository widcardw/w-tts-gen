package services

import (
	"crypto/md5"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

type NativeTts struct{}

func (n *NativeTts) GenerateSpeech(s string, outputPath string) (string, error) {
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
			tmp := outputPath + ".aiff"
			cmd1 := exec.Command("say", "-o", tmp, s)
			if err := cmd1.Run(); err != nil {
				return "", err
			}

			cmd2 := exec.Command("afconvert", tmp, "-o", outputPath, "-f m4af -d aac")
			if err := cmd2.Run(); err != nil {
				return "", err
			}
			os.Remove(tmp)
			return outputPath, nil
		}
	case "windows":
		{
			script := fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile("%s")
$s.Speak("%s")
$s.SetOutputToDefaultAudioDevice()`, outputPath, s)
			cmd := exec.Command("powershell", "-Command", script)
			if err := cmd.Run(); err != nil {
				return "", err
			}
			return outputPath, nil
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
