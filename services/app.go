package services

import (
	"github.com/wujunwei928/edge-tts-go/edge_tts"
	"runtime"
)

type EnvResult struct {
	IsStartup   bool   `json:"-"`
	FromTaskSch bool   `json:"-"`
	WebviewPath string `json:"-"`
	AppName     string `json:"appName"`
	AppVersion  string `json:"appVersion"`
	BasePath    string `json:"basePath"`
	OS          string `json:"os"`
	ARCH        string `json:"arch"`
}

var Env = &EnvResult{
	IsStartup:   true,
	FromTaskSch: false,
	WebviewPath: "",
	AppName:     "",
	AppVersion:  "v0.0.0",
	BasePath:    "",
	OS:          runtime.GOOS,
	ARCH:        runtime.GOARCH,
}

type AppConfig struct {
	DefaultSaveDir     string `json:"defaultSaveDir"`
	Theme              string `json:"theme"`
	NativeAutoSlice    bool   `json:"nativeAutoSlice"`
	NativeCompress     bool   `json:"nativeCompress"`
	EdgeAutoSlice      bool   `json:"edgeAutoSlice"`
	EdgeSelectedLocale string `json:"edgeSelectedLocale"`
	EdgeSelectedVoice  string `json:"edgeSelectedVoice"`
}

type EdgeVoicesConfig struct {
	Voices []edge_tts.Voice `json:"voices"`
}

// TaskRecovery 断点续传任务信息
type TaskRecovery struct {
	TaskID      string `json:"taskId" yaml:"taskId"`
	TaskType    string `json:"taskType" yaml:"taskType"` // "native" / "edge"
	Text        string `json:"text" yaml:"text"`
	Voice       string `json:"voice" yaml:"voice"`
	Locale      string `json:"locale" yaml:"locale"`
	OutputPath  string `json:"outputPath" yaml:"outputPath"`
	AutoSlice   bool   `json:"autoSlice" yaml:"autoSlice"`
	TotalChunks int    `json:"totalChunks" yaml:"totalChunks"`
	Completed   int    `json:"completed" yaml:"completed"`
	Timestamp   int64  `json:"timestamp" yaml:"timestamp"`
}

// HasUnfinishedTask 判断是否有未完成的任务
func (t *TaskRecovery) HasUnfinishedTask() bool {
	return t.TaskID != "" && t.Completed < t.TotalChunks
}
