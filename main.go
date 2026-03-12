package main

import (
	"bridgetts/services"
	"embed"
	_ "embed"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	// Register a custom event whose associated data type is string.
	// This is not required, but the binding generator will pick up registered events
	// and provide a strongly typed JS/TS API for them.
	application.RegisterEvent[string]("time")
}

// main function serves as the application's entry point. It initializes the application, creates a window,
// and starts a goroutine that emits a time-based event every second. It subsequently runs the application and
// logs any error that might occur.
func main() {

	if configPath, err := os.UserConfigDir(); err == nil {
		services.Env.BasePath = configPath
	}

	// Create a new Wails application by providing the necessary options.
	// Variables 'Name' and 'Description' are for application metadata.
	// 'Assets' configures the asset server with the 'FS' variable pointing to the frontend files.
	// 'Bind' is a list of Go struct instances. The frontend has access to the methods of these instances.
	// 'Mac' options tailor the application when running an macOS.
	app := application.New(application.Options{
		Name:        "W-TTS",
		Description: "A TTS tool using wails v3",
		Services: []application.Service{
			application.NewService(&services.OsService{}),
			application.NewService(&services.NativeTts{}),
			application.NewService(&services.ConfigService{}),
			application.NewService(&services.EdgeTtsService{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Create a new window with the necessary options.
	// 'Title' is the title of the window.
	// 'Mac' options tailor the window when running on macOS.
	// 'BackgroundColour' is the background colour of the window.
	// 'URL' is the URL that will be loaded into the webview.
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "W-TTS",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 40,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		MinWidth:         800,
		MinHeight:        600,
	})

	// 启动时检查是否有未完成的任务
	configService := &services.ConfigService{}
	unfinishedTask := configService.CheckUnfinishedTask()
	if unfinishedTask != nil {
		// 显示恢复任务对话框
		dialog := app.Dialog.Question().
			SetTitle("检测到未完成的任务").
			SetMessage(fmt.Sprintf("发现上次未完成的语音合成任务（进度：%d/%d），是否恢复？",
				unfinishedTask.Completed, unfinishedTask.TotalChunks))

		recoverBtn := dialog.AddButton("恢复任务")
		recoverBtn.OnClick(func() {
			// 发送恢复任务事件到前端
			app.Event.Emit("task:recover", unfinishedTask)
		})

		cancelBtn := dialog.AddButton("取消")
		cancelBtn.OnClick(func() {
			// 清除任务
			configService.ClearRecoveryTask()
		})

		dialog.SetDefaultButton(recoverBtn)
		dialog.SetCancelButton(cancelBtn)
		// 等待对话框关闭后再显示窗口
		dialog.Show()
	}

	// Create a goroutine that emits an event containing the current time every second.
	// The frontend can listen to this event and update the UI accordingly.
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Run the application. This blocks until the application has been exited.
	err := app.Run()

	// If an error occurred while running the application, log it and exit.
	if err != nil {
		log.Fatal(err)
	}
}
