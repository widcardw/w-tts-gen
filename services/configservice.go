package services

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v3/pkg/application"
	"gopkg.in/yaml.v3"
)

type ConfigService struct{}

var Config = &AppConfig{
	Theme:           "auto",
	NativeAutoSlice: false,
	NativeCompress:  true,
	EdgeAutoSlice:   false,
}

func GetPath(path string) string {
	if !filepath.IsAbs(path) {
		path = filepath.Join(Env.BasePath, path)
	}
	return filepath.ToSlash(filepath.Clean(path))
}

func (c *ConfigService) ReadConfig() *AppConfig {
	configPath := GetPath("W-TTS/config.yml")
	b, err := os.ReadFile(configPath)
	if err == nil {
		yaml.Unmarshal(b, &Config)
	}
	return Config
}

func createConfigDir() string {
	confDir := GetPath("W-TTS")
	if _, err := os.Stat(confDir); err != nil && os.IsNotExist(err) {
		fmt.Printf("No dir %s, %v", confDir, err)
		os.MkdirAll(confDir, os.ModePerm)
	} else if err != nil {
		fmt.Printf("Error %v", err)
	}
	return confDir
}
func (c *ConfigService) WriteConfig(conf *AppConfig) (string, error) {
	Config.NativeCompress = conf.NativeCompress
	Config.NativeAutoSlice = conf.NativeAutoSlice
	Config.EdgeAutoSlice = conf.EdgeAutoSlice
	Config.EdgeSelectedLocale = conf.EdgeSelectedLocale
	Config.EdgeSelectedVoice = conf.EdgeSelectedVoice

	Config.DefaultSaveDir = conf.DefaultSaveDir
	Config.Theme = conf.Theme
	yBytes, err := yaml.Marshal(&Config)
	if err != nil {
		log.Printf("Failed to encode config into yaml, %s", err)
		return "", err
	}
	createConfigDir()
	confPath := GetPath("W-TTS/config.yml")
	if err := os.WriteFile(confPath, yBytes, os.ModePerm); err != nil {
		log.Printf("Failed to write config to file, %s", err)
		return "", err
	}
	return confPath, nil
}

func (c *ConfigService) OpenConfigDir() error {
	confDir := createConfigDir()

	app := application.Get()
	return app.Env.OpenFileManager(confDir, false)
}

func (c *ConfigService) OpenDevTools() error {
	app := application.Get()
	window := app.Window.Current()
	if window != nil {
		window.OpenDevTools()
		return nil
	}
	return fmt.Errorf("Cannot find current Window!")
}

// CheckFFmpegAvailable 检查 FFmpeg 是否可用
func (c *ConfigService) CheckFFmpegAvailable() bool {
	// macOS 不需要 FFmpeg，使用系统的 afconvert
	if runtime.GOOS == "darwin" {
		return true
	}

	// Windows 和 Linux 需要 FFmpeg
	_, err := exec.LookPath("ffmpeg")
	return err == nil
}

// CreateRecoveryTask 创建新的恢复任务
func (c *ConfigService) CreateRecoveryTask(taskType, text, voice, locale, outputPath string, autoSlice bool, totalChunks int) *TaskRecovery {
	task := &TaskRecovery{
		TaskID:      uuid.NewString(),
		TaskType:    taskType,
		Text:        text,
		Voice:       voice,
		Locale:      locale,
		OutputPath:  outputPath,
		AutoSlice:   autoSlice,
		TotalChunks: totalChunks,
		Completed:   0,
		Timestamp:   time.Now().Unix(),
	}
	c.SaveRecoveryTask(task)
	return task
}

// SaveRecoveryTask 保存恢复任务
func (c *ConfigService) SaveRecoveryTask(task *TaskRecovery) error {
	createConfigDir()
	recoveryPath := GetPath("W-TTS/recovery.yml")
	yBytes, err := yaml.Marshal(task)
	if err != nil {
		log.Printf("Failed to encode recovery task into yaml, %s", err)
		return err
	}
	if err := os.WriteFile(recoveryPath, yBytes, os.ModePerm); err != nil {
		log.Printf("Failed to write recovery task to file, %s", err)
		return err
	}
	return nil
}

// GetRecoveryTask 获取恢复任务
func (c *ConfigService) GetRecoveryTask() *TaskRecovery {
	recoveryPath := GetPath("W-TTS/recovery.yml")
	b, err := os.ReadFile(recoveryPath)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("Failed to read recovery task file, %s", err)
		}
		return &TaskRecovery{}
	}
	var task TaskRecovery
	if err := yaml.Unmarshal(b, &task); err != nil {
		log.Printf("Failed to decode recovery task, %s", err)
		return &TaskRecovery{}
	}
	return &task
}

// UpdateRecoveryProgress 更新任务进度
func (c *ConfigService) UpdateRecoveryProgress(completed int) error {
	task := c.GetRecoveryTask()
	if task.TaskID == "" {
		return nil
	}
	task.Completed = completed
	return c.SaveRecoveryTask(task)
}

// ClearRecoveryTask 清除恢复任务
func (c *ConfigService) ClearRecoveryTask() error {
	recoveryPath := GetPath("W-TTS/recovery.yml")
	if _, err := os.Stat(recoveryPath); err == nil {
		return os.Remove(recoveryPath)
	}
	return nil
}

// CheckUnfinishedTask 启动时检查是否有未完成的任务
func (c *ConfigService) CheckUnfinishedTask() *TaskRecovery {
	task := c.GetRecoveryTask()
	if task.HasUnfinishedTask() {
		return task
	}
	return nil
}
