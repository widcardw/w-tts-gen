package services

import (
	// "crypto/md5"
	"fmt"
	"os"
	"path/filepath"
	// "time"

	"github.com/wujunwei928/edge-tts-go/edge_tts"
)

type EdgeTtsService struct{}

func (e *EdgeTtsService) ListVoices() ([]edge_tts.Voice, error) {
	return edge_tts.ListVoices("")
}

func (e *EdgeTtsService) GenerateSpeech(v edge_tts.Voice, r string, vo string, p string, outputPath string, content string, autoSlice bool) (string, error) {
	// 如果启用了自动分割
	if autoSlice {
		segments := SplitText(content)

		// 如果分割后有多个段落
		if len(segments) > 1 {
			// 确定输出文件夹路径
			var folderPath string
			if info, err := os.Stat(outputPath); err == nil && info.IsDir() {
				// outputPath 是目录，在其下创建子文件夹
				folderPath = filepath.Join(outputPath, GetFolderName(content))
			} else {
				// outputPath 是文件或不存在，使用其所在目录创建文件夹
				parentDir := filepath.Dir(outputPath)
				folderPath = filepath.Join(parentDir, GetFolderName(content))
			}

			// 创建文件夹
			if err := os.MkdirAll(folderPath, 0755); err != nil {
				return "", fmt.Errorf("failed to create output folder: %w", err)
			}

			// 逐个生成音频
			for i, segment := range segments {
				filename := GetSegmentFileName(i+1, segment) + ".mp3"
				segmentPath := filepath.Join(folderPath, filename)

				err := e.generateSingleSpeech(v, r, vo, p, segmentPath, segment)
				if err != nil {
					return folderPath, fmt.Errorf("failed to generate segment %d: %w", i+1, err)
				}
			}

			return folderPath, nil
		}

		// 分割后只有一段，按不分割处理
		if len(segments) == 1 {
			content = segments[0]
		}
	}

	// 不分割或分割后只有一段的情况
	if info, err := os.Stat(outputPath); err == nil && info.IsDir() {
		// Generate a unique filename based on content hash, timestamp, and extension
		filename := GetFileName(content) + ".mp3"
		outputPath = filepath.Join(outputPath, filename)
	} else if err != nil && os.IsNotExist(err) {
		// Check if parent directory exists, if not create it
		parentDir := filepath.Dir(outputPath)
		if err := os.MkdirAll(parentDir, 0755); err != nil {
			return "", fmt.Errorf("failed to create parent directory: %w", err)
		}
	}

	return outputPath, e.generateSingleSpeech(v, r, vo, p, outputPath, content)
}

// generateSingleSpeech 生成单个音频文件
func (e *EdgeTtsService) generateSingleSpeech(v edge_tts.Voice, r string, vo string, p string, outputPath string, content string) error {
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
		return err
	}

	audioData, err := conn.Stream()
	if err != nil {
		return err
	}
	writeMediaErr := os.WriteFile(outputPath, audioData, 0644)
	if writeMediaErr != nil {
		return writeMediaErr
	}
	return nil
}
