package services

import (
	// "crypto/md5"
	"fmt"
	"os"
	"path/filepath"

	// "time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wujunwei928/edge-tts-go/edge_tts"
	"gopkg.in/yaml.v3"
)

type EdgeTtsService struct{}

// StopGeneration 设置停止标志，停止当前正在进行的生成
func (e *EdgeTtsService) StopGeneration() {
	SetGenerationStop()
}

var edgeVoicesCache []edge_tts.Voice

func init() {
	// 启动时加载缓存的 voices
	confPath := GetPath("W-TTS/edge-voices.yml")
	b, err := os.ReadFile(confPath)
	if err == nil {
		var voicesConfig EdgeVoicesConfig
		if err := yaml.Unmarshal(b, &voicesConfig); err == nil {
			edgeVoicesCache = voicesConfig.Voices
		}
	}
}

func (e *EdgeTtsService) ListVoices(force bool) ([]edge_tts.Voice, error) {
	if force || len(edgeVoicesCache) == 0 {
		voices, err := edge_tts.ListVoices("")
		if err != nil {
			return nil, err
		}
		edgeVoicesCache = voices
		// 保存到独立文件
		if err := saveEdgeVoicesCache(); err != nil {
			fmt.Printf("Failed to save edge voices cache: %v\n", err)
		}
	}
	return edgeVoicesCache, nil
}

// saveEdgeVoicesCache 保存 voices 到独立文件
func saveEdgeVoicesCache() error {
	yBytes, err := yaml.Marshal(&EdgeVoicesConfig{Voices: edgeVoicesCache})
	if err != nil {
		return fmt.Errorf("failed to encode voices into yaml: %w", err)
	}

	confDir := GetPath("W-TTS")
	if _, err := os.Stat(confDir); err != nil && os.IsNotExist(err) {
		if err := os.MkdirAll(confDir, os.ModePerm); err != nil {
			return fmt.Errorf("failed to create config dir: %w", err)
		}
	}

	confPath := GetPath("W-TTS/edge-voices.yml")
	if err := os.WriteFile(confPath, yBytes, os.ModePerm); err != nil {
		return fmt.Errorf("failed to write edge-voices to file: %w", err)
	}
	return nil
}

func (e *EdgeTtsService) GenerateSpeech(v edge_tts.Voice, r string, vo string, p string, outputPath string, content string, autoSlice bool) (string, error) {
	configService := &ConfigService{}
	var segments []string
	var folderPath string

	// 如果启用了自动分割
	if autoSlice {
		segments = SplitText(content)
		app := application.Get()

		// 如果分割后有多个段落
		if len(segments) > 1 {
			// 确定输出文件夹路径
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

			// 创建恢复任务
			configService.CreateRecoveryTask("edge", content, v.ShortName, v.Locale, folderPath, autoSlice, len(segments))
			defer configService.ClearRecoveryTask() // 正常完成后清除任务
			defer ClearGenerationStop() // 确保最后清除停止标志

			// 逐个生成音频
			for i, segment := range segments {
				// 检查是否需要停止
				if IsGenerationStopped() {
					return folderPath, fmt.Errorf("generation stopped by user")
				}
				filename := GetSegmentFileName(i+1, segment) + ".mp3"
				segmentPath := filepath.Join(folderPath, filename)

				// 跳过已生成的片段
				if _, err := os.Stat(segmentPath); err == nil {
					app.Event.Emit("progress:edge", ProgressEvent{
						Finished: i + 1,
						Total:    len(segments),
					})
					continue
				}

				err := e.generateSingleSpeech(v, r, vo, p, segmentPath, segment)
				if err != nil {
					// 失败时更新进度
					configService.UpdateRecoveryProgress(i)
					return folderPath, fmt.Errorf("failed to generate segment %d: %w", i+1, err)
				}
				// 更新进度
				configService.UpdateRecoveryProgress(i + 1)
				app.Event.Emit("progress:edge", ProgressEvent{
					Finished: i + 1,
					Total:    len(segments),
				})
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
