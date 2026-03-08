package nativeinvocation

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func createPowerShellCmd(command string) *exec.Cmd {
	cmd := exec.Command("powershell", "-Command", command)
	cmd.SysProcAttr = CreateSysAttr()
	return cmd
}

func GetWindowsVoiceList() ([]VoiceInfo, error) {
	psCommand := `
Add-Type -AssemblyName System.Speech
$speech = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = @()
$speech.GetInstalledVoices() | ForEach-Object {
    $voice = $_.VoiceInfo
    $voiceObj = New-Object PSObject
    $voiceObj | Add-Member -NotePropertyName "name" -NotePropertyValue $voice.Name
    $voiceObj | Add-Member -NotePropertyName "lang" -NotePropertyValue $voice.Culture.Name
    $voiceObj | Add-Member -NotePropertyName "desc" -NotePropertyValue $voice.Description
    $voices += $voiceObj
}
ConvertTo-Json -InputObject $voices
`
	cmd := createPowerShellCmd(psCommand)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("Failed to get voices! %v", err)
	}

	var winVoices []VoiceInfo
	if err := json.Unmarshal(output, &winVoices); err != nil {
		return nil, fmt.Errorf("Failed to decode voices! %v", err)
	}
	return winVoices, nil
}

func TryListeningWindows(v VoiceInfo) error {
	var script string
	if v.Name == "" {
		script = fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Speak("%s")`, escapeForPowerShell("Hello, I am the default speaker."))
	} else {
		script = fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("%s")
$s.Speak("%s")`, escapeForPowerShell(v.Name), escapeForPowerShell(v.Desc))
	}
	cmd := createPowerShellCmd(script)
	return cmd.Run()
}

func WindowsGenerateTts(v VoiceInfo, outputPath string, s string, compress bool) (string, error) {
	// 确保输出路径是 WAV 格式
	var wavPath = outputPath
	if !strings.HasSuffix(strings.ToLower(wavPath), ".wav") {
		wavPath = wavPath + ".wav"
	}

	var script string
	if v.Name == "" {
		script = fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile("%s")
$s.Speak("%s")
$s.SetOutputToDefaultAudioDevice()`, escapeForPowerShell(wavPath), escapeForPowerShell(s))
	} else {
		script = fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("%s")
$s.SetOutputToWaveFile("%s")
$s.Speak("%s")
$s.SetOutputToDefaultAudioDevice()`, escapeForPowerShell(v.Name), escapeForPowerShell(wavPath), escapeForPowerShell(s))
	}
	cmd := createPowerShellCmd(script)
	if err := cmd.Run(); err != nil {
		return "", err
	}

	// 如果需要压缩为 AAC/M4A 格式
	if compress {
		return convertWavToM4a(wavPath)
	}

	return wavPath, nil
}

// convertWavToM4a 使用 FFmpeg 将 WAV 转换为 M4A (AAC) 格式
func convertWavToM4a(wavPath string) (string, error) {
	m4aPath := strings.TrimSuffix(wavPath, filepath.Ext(wavPath)) + ".m4a"

	// 使用 FFmpeg 转换为 AAC
	cmd := exec.Command("ffmpeg", "-y", "-i", wavPath, "-c:a", "aac", "-b:a", "192k", m4aPath)
	cmd.SysProcAttr = CreateSysAttr()
	if err := cmd.Run(); err != nil {
		log.Printf("Failed to convert WAV to M4A: %v", err)
		// 转换失败，保留原始 WAV 文件
		return wavPath, err
	}

	// 转换成功，删除原始 WAV 文件
	os.Remove(wavPath)
	return m4aPath, nil
}

func escapeForPowerShell(s string) string {
	// 转义双引号和特殊字符
	s = strings.ReplaceAll(s, `"`, `\"`)
	s = strings.ReplaceAll(s, "`", "``")
	s = strings.ReplaceAll(s, "$", "`$")
	return s
}
