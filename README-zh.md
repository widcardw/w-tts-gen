# W-TTS-Gen - 跨平台语音合成应用

一个基于 Wails3 + Go + SolidJS 开发的跨平台语音合成应用，支持在 Windows、macOS 上生成音频文件（Linux 上尚未测试）。

## 技术栈

### 后端
- **Go**
- **Wails3**（跨平台桌面应用框架）

### 前端
- **SolidJS** 配合 [ark-ui](https://ark-ui.com/)
- **TypeScript**
- **UnoCSS**（原子化 CSS 框架）
- **Iconify (Remix Icons)**

## 快速开始 (Dev)

### 前提条件

- Go 1.20+（推荐）
- Node.js 18+（推荐）
- Wails3 CLI（安装方法见下文）

### 安装 Wails3 CLI

```bash
# 使用 Go 安装 Wails3 CLI
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

### 开发模式

1. 克隆项目到本地：

```bash
gh repo clone widcardw/w-tts-gen
cd w-tts-gen
```

2. 安装前端依赖：

```bash
cd frontend
pnpm install
```

3. 返回项目根目录，启动开发服务器：

```bash
wails3 dev
```

### 生产构建

```bash
wails3 build
```

构建完成后，可执行文件将生成在 `build` 目录中。

对于分发，您可以使用 `wails3 package` 为不同平台创建安装程序。

> 在 Windows 上，您应该安装 [NSIS](https://nsis.sourceforge.io/) 来创建 `msi` 格式的安装程序。

## 项目结构

```
├── frontend/             # 前端代码目录
│   ├── src/              # 源代码
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── styles/       # 样式文件
│   │   └── index.tsx     # 前端入口
│   ├── public/           # 静态资源
│   ├── package.json      # 前端依赖
│   └── vite.config.ts    # Vite 配置
├── services/             # Go 服务
├── main.go               # Go 后端入口
├── go.mod                # Go 依赖
└── README.md             # 项目说明文档
```

## 使用说明

> Linux 用户需要预先安装 `espeak` 语音合成引擎。

1. 在文本框中输入要转换的文字
2. 点击「Choose」按钮选择音频文件的保存路径
3. 点击「Generate」按钮生成音频文件
4. 生成完成后，音频文件将保存在指定路径

## 许可证

MIT License