package nativeinvocation

import (
	"encoding/json"
	"fmt"
	"os/exec"
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

func WindowsGenerateTts(v VoiceInfo, outputPath string, s string) (string, error) {
	var script string
	if v.Name == "" {
		script = fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SetOutputToWaveFile("%s")
$s.Speak("%s")
$s.SetOutputToDefaultAudioDevice()`, escapeForPowerShell(outputPath), escapeForPowerShell(v.Desc))
	} else {
		script = fmt.Sprintf(`Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("%s")
$s.SetOutputToWaveFile("%s")
$s.Speak("%s")
$s.SetOutputToDefaultAudioDevice()`, escapeForPowerShell(v.Name), escapeForPowerShell(outputPath), escapeForPowerShell(v.Desc))
	}
	cmd := createPowerShellCmd(script)
	if err := cmd.Run(); err != nil {
		return "", err
	}
	return outputPath, nil
}

func escapeForPowerShell(s string) string {
	// 转义双引号和特殊字符
	s = strings.ReplaceAll(s, `"`, `\"`)
	s = strings.ReplaceAll(s, "`", "``")
	s = strings.ReplaceAll(s, "$", "`$")
	return s
}
