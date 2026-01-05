package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type OsService struct{}

func (o *OsService) GetOs() string {
	return runtime.GOOS
}

func (o *OsService) OpenFile(path string) error {
	switch o.GetOs() {
	case "darwin":
		cmd := exec.Command("open", path)
		return cmd.Run()
	case "windows":
		cmd := exec.Command("explorer", "/select,", path)
		return cmd.Run()
	default:
		return fmt.Errorf("unsupported OS")
	}
}

func (o *OsService) OpenFolder(path string) error {
	if path == "" {
		return fmt.Errorf("path is empty")
	}

	pathToOpen := path
	if info, err := os.Stat(path); err == nil && !info.IsDir() {
		pathToOpen = filepath.Dir(path)
	} else if err != nil && os.IsNotExist(err) {
		return fmt.Errorf("path does not exist: %w", err)
	}

	switch o.GetOs() {
	case "darwin":
		cmd := exec.Command("open", pathToOpen)
		return cmd.Run()
	case "windows":
		cmd := exec.Command("explorer", pathToOpen)
		return cmd.Run()
	default:
		return fmt.Errorf("unsupported OS")
	}
}
