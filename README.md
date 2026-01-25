# W-TTS-Gen - Cross-platform Text-to-Speech Application

A cross-platform text-to-speech application built with Wails3 + Go + SolidJS, supporting audio file generation on Windows and macOS (Linux support is not tested yet).

## Tech Stack

### Backend
- **Go**
- **Wails3** (Cross-platform desktop application framework)

### Frontend
- **SolidJS** with [ark-ui](https://ark-ui.com/)
- **TypeScript**
- **UnoCSS** (Atomic CSS framework)
- **Iconify (Remix Icons)**

## Quick Start (Dev)

### Prerequisites

- Go 1.20+ (recommended)
- Node.js 18+ (recommended)
- Wails3 CLI (installation instructions below)

### Install Wails3 CLI

```bash
# Install Wails3 CLI using Go
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

### Development Mode

1. Clone the project locally:

```bash
gh repo clone widcardw/w-tts-gen
cd w-tts-gen
```

2. Install frontend dependencies:

```bash
cd frontend
pnpm install
```

3. Return to the project root directory and start the development server:

```bash
wails3 dev
```

### Production Build

```bash
wails3 build
```

After building, the executable will be generated in the `build` directory.

For distribution, you can use `wails3 package` to create installers for different platforms.

> On Windows, you should install [NSIS](https://nsis.sourceforge.io/) to create installers in `msi` format.

## Project Structure

```
├── frontend/             # Frontend code directory
│   ├── src/              # Source code
│   │   ├── components/   # Components
│   │   ├── pages/        # Pages
│   │   ├── styles/       # Style files
│   │   └── index.tsx     # Frontend entry
│   ├── public/           # Static resources
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
├── services/             # Go services
├── main.go               # Go backend entry
├── go.mod                # Go dependencies
└── README.md             # Project documentation
```

## Usage

> Linux users need to pre-install the `espeak` speech synthesis engine.

1. Enter the text to convert in the text box
2. Click the "Choose" button to select the audio file save path
3. Click the "Generate" button to generate the audio file
4. After generation, the audio file will be saved to the specified path

## License

MIT License