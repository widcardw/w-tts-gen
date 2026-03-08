package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	ni "bridgetts/services/nativeinvocation"

	"github.com/wailsapp/wails/v3/pkg/application"
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

func (n *NativeTts) GenerateSpeech(v ni.VoiceInfo, s string, outputPath string, autoSlice bool, compress bool) (string, error) {
	goos := runtime.GOOS

	app := application.Get()

	// 如果启用了自动分割
	if autoSlice {
		segments := SplitText(s)

		// 如果分割后有多个段落
		if len(segments) > 1 {
			// 确定输出文件夹路径
			var folderPath string
			if info, err := os.Stat(outputPath); err == nil && info.IsDir() {
				// outputPath 是目录，在其下创建子文件夹
				folderPath = filepath.Join(outputPath, GetFolderName(s))
			} else {
				// outputPath 是文件或不存在，使用其所在目录创建文件夹
				parentDir := filepath.Dir(outputPath)
				folderPath = filepath.Join(parentDir, GetFolderName(s))
			}

			// 创建文件夹
			if err := os.MkdirAll(folderPath, 0755); err != nil {
				return "", fmt.Errorf("failed to create output folder: %w", err)
			}

			// 逐个生成音频
			for i, segment := range segments {
				filename := GetSegmentFileName(i+1, segment)
				segmentPath := filepath.Join(folderPath, filename)

				_, err := n.generateSingleSpeech(goos, v, segment, segmentPath, compress)
				if err != nil {
					// 即使有错误也返回 folderPath，因为可能只是转换失败但文件已生成
					return folderPath, err
				}
				app.Event.Emit("progress:native", ProgressEvent{
					finished: i + 1,
					total:    len(segments),
				})
			}

			return folderPath, nil
		}

		// 分割后只有一段，按不分割处理
		if len(segments) == 1 {
			s = segments[0]
		}
	}

	// 不分割或分割后只有一段的情况
	// Check if outputPath is a directory
	if info, err := os.Stat(outputPath); err == nil && info.IsDir() {
		// Generate a unique filename based on content hash, timestamp, and extension
		filename := GetFileName(s)
		outputPath = filepath.Join(outputPath, filename)
	} else if err != nil && os.IsNotExist(err) {
		// Check if parent directory exists, if not create it
		parentDir := filepath.Dir(outputPath)
		if err := os.MkdirAll(parentDir, 0755); err != nil {
			return "", fmt.Errorf("failed to create parent directory: %w", err)
		}
	}

	return n.generateSingleSpeech(goos, v, s, outputPath, compress)
}

// CheckFFmpegAvailable 检查 FFmpeg 是否可用
func (n *NativeTts) CheckFFmpegAvailable() bool {
	// macOS 不需要 FFmpeg，使用系统的 afconvert
	if runtime.GOOS == "darwin" {
		return true
	}

	// Windows 和 Linux 需要 FFmpeg
	_, err := exec.LookPath("ffmpeg")
	return err == nil
}

// generateSingleSpeech 生成单个音频文件
func (n *NativeTts) generateSingleSpeech(goos string, v ni.VoiceInfo, s string, outputPath string, compress bool) (string, error) {
	switch goos {
	case "darwin":
		return ni.DarwinGenerateTts(v, outputPath, s, compress)
	case "windows":
		return ni.WindowsGenerateTts(v, outputPath, s, compress)
	default:
		cmd := exec.Command("espeak", s, "-w", outputPath)
		if err := cmd.Run(); err != nil {
			return "", err
		}
		return outputPath, nil
	}
}
