# W-TTS 语音合成应用

## 技术栈

- **后端框架**: Wails V3 (https://v3alpha.wails.io/)
- **前端框架**: SolidJS
- **编程语言**: Go + TypeScript

## 项目结构

```
├── main.go          # 应用入口
├── services/        # 服务层（前端可调用的 Go 方法）
│   ├── osservice.go          # 操作系统相关服务
│   ├── configservice.go      # 配置管理服务
│   ├── edgeservice.go        # Edge TTS 服务
│   ├── nativetts.go          # 系统原生 TTS 服务
│   ├── app.go                # 应用基础服务
│   └── nativeinvocation/     # 平台相关原生调用实现
├── frontend/        # SolidJS 前端代码
│   ├── src/
│   │   ├── components/  # 公共组件
│   │   ├── pages/       # 页面组件
│   │   ├── stores/      # 状态管理
│   │   └── types/       # TypeScript 类型定义
│   └── wailsjs/     # Wails 自动生成的类型和服务绑定
├── build/           # 构建产物目录
├── bin/             # 可执行文件输出目录
└── wails.json       # Wails 项目配置
```

## 已注册服务（可直接在前端调用）

| 服务名 | 功能说明 | 所在文件 |
|--------|----------|----------|
| `OsService` | 操作系统相关操作 | `services/osservice.go` |
| `NativeTts` | 系统原生语音合成 | `services/nativetts.go` |
| `ConfigService` | 应用配置管理 | `services/configservice.go` |
| `EdgeTtsService` | Edge TTS 云端合成 | `services/edgeservice.go` |

## 核心开发指南

### 1. 前后端通信（Go 服务调用）

后端服务定义在 `services/` 目录下，所有注册到 Wails 应用的服务都可以在前端直接调用。

#### 后端定义服务
```go
// services/tts_service.go
package services

type TTSService struct{}

func (t *TTSService) GenerateSpeech(text string, voice string) ([]byte, error) {
    // 语音合成逻辑
    return audioData, nil
}
```

#### 注册服务到 Wails
```go
// main.go
app := application.New(application.Options{
    Services: []application.Service{
        application.NewService(&services.TTSService{}), // 注册服务
    },
})
```

#### 前端调用服务
```typescript
import { TTSService } from '#/wails/services'

async function synthesizeSpeech(text: string, voice: string) {
    const audioData = await TTSService.GenerateSpeech(text, voice)
    return audioData
}
```

### 2. 事件系统（后端主动通知前端）

#### 已定义事件

| 事件名 | 数据类型 | 说明 |
|--------|----------|------|
| `time` | string | 每秒发送当前时间 |
| `progress:edge` | `ProgressEvent{finished: int, total: int}` | Edge TTS 合成进度 |

#### 后端发送事件
```go
import "github.com/wailsapp/wails/v3/pkg/application"
import "bridgetts/services"

func sendProgress(finished int, total int) {
    app := application.Get()
    app.Event.Emit("progress:edge", services.ProgressEvent{
        Finished: finished,
        Total: total,
    })
}
```

#### 前端监听事件
```typescript
import { Events } from '@wailsio/runtime'

// 监听 Edge TTS 合成进度
const cleanup = Events.On('progress:edge', (event) => {
    const { finished, total } = event.data
    console.log(`合成进度: ${finished}/${total}`)
})

// 组件卸载时清理监听
onCleanup(cleanup)
```

### 3. 对话框使用

#### 后端对话框（Go）
```go
app := application.Get()

// 确认对话框
dialog := app.Dialog.Question().
    SetTitle("确认操作").
    SetMessage("是否要生成该语音文件？")

confirmBtn := dialog.AddButton("生成")
confirmBtn.OnClick(func() {
    // 执行生成逻辑
})

cancelBtn := dialog.AddButton("取消")
dialog.SetDefaultButton(cancelBtn)
dialog.SetCancelButton(cancelBtn)
dialog.Show()
```

#### 前端对话框（TypeScript）
```typescript
import { Dialogs } from '@wailsio/runtime'

async function showConfirmDialog() {
  const result = await Dialogs.Question({
    Title: '确认操作',
    Message: '是否要生成该语音文件？',
    Buttons: [
      { Label: '生成', IsDefault: false, IsCancel: false },
      { Label: '取消', IsDefault: true, IsCancel: true }
    ],
  })
  
  if (result === '生成') {
    // 执行生成逻辑
  }
}
```

### 4. 打开外部链接
```go
app := application.Get()
err := app.Browser.OpenURL("https://github.com/your/repo")
if err != nil {
    app.Logger.Error("打开链接失败", "error", err)
}
```

### 5. 日志使用
```go
app := application.Get()
app.Logger.Info("语音合成开始", "text", text, "voice", voice)
app.Logger.Error("合成失败", "error", err)
app.Logger.Debug("调试信息", "data", debugData)
```

## 开发命令

### 启动开发服务器
```sh
wails3 dev
```
开发模式下支持热重载，修改前端或后端代码都会自动重新构建。

### 生产构建
```sh
# 构建可执行文件
wails3 build

# 打包为安装包（dmg/exe/deb）
wails3 package
```

## 常见开发场景

### 新增一个后端服务
1. 在 `services/` 目录下创建新的服务文件
2. 定义服务结构体和方法
3. 在 `main.go` 的 `Services` 数组中注册服务
4. 前端直接从 `#/bridgetts` 导入使用（类型会自动生成）

### 新增前端页面
1. 在 `frontend/src/pages/` 目录下创建页面组件
2. 在路由配置中添加页面路由
3. 按需导入 Wails 服务和 runtime 能力

### 类型同步
Wails 会自动为所有注册的 Go 服务生成 TypeScript 类型定义，保存在 `frontend/bindings/` 目录下。开发过程中类型会自动更新，无需手动维护。

## 注意事项

1. 所有 Go 服务方法的参数和返回值必须是可序列化的类型
2. 前端调用 Go 方法默认是异步的，需要使用 `async/await`
3. 事件监听需要在组件卸载时手动清理，避免内存泄漏
4. 大文件传输建议通过事件分片传递，避免单次调用负载过大
