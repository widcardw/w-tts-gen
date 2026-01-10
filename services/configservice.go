package services

import (
	"log"
	"os"
	"path/filepath"

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
	configPath := GetPath("data/config.yml")
	b, err := os.ReadFile(configPath)
	if err == nil {
		yaml.Unmarshal(b, &Config)
	}
	return Config
}

func createConfigDir() string {
	confDir := GetPath("data")
	if _, err := os.Stat(confDir); err != nil && os.IsNotExist(err) {
		os.MkdirAll(confDir, os.ModePerm)
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
	confPath := GetPath("data/config.yml")
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
