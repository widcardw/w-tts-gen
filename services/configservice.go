package services

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"
	"gopkg.in/yaml.v3"
)

type ConfigService struct{}

var Config = &AppConfig{
	Compress: false,
	Theme:    "auto",
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
	Config.Compress = conf.Compress
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
