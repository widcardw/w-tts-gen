package services

import (
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
	DefaultSaveDir  string `json:"defaultSaveDir"`
	Theme           string `json:"theme"`
	NativeAutoSlice bool   `json:"nativeAutoSlice"`
	NativeCompress  bool   `json:"nativeCompress"`
	EdgeAutoSlice   bool   `json:"edgeAutoSlice"`
}
