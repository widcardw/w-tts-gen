package services

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

type NativeTts struct{}

func (n *NativeTts) GenerateSpeech(s string, outputPath string) error {
	goos := runtime.GOOS
	// TODO: generate filename
	switch goos {
		case "darwin": {
			tmp := outputPath + ".aiff"
			cmd1 := exec.Command("say", "-o", tmp, s)
			if err := cmd1.Run(); err != nil {
				return err
			}
			
			cmd2 := exec.Command("afconvert", tmp, "-o", outputPath, "-f m4af -d aac")
			if err := cmd2.Run(); err != nil {
				return err
			}
			os.Remove(tmp)
			return nil
		}
		case "windows": {
			script := "Add-Type -AssemblyName System.Speech" + "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer" + fmt.Sprintf("$s.SetOutputToWaveFile(\"%s\")", outputPath) + fmt.Sprintf("$s.Speak(\"%s\")", s) + "$s.SetOutputToDefaultAudioDevice()"
			cmd := exec.Command("powershell", "-Command", script)
			if err := cmd.Run(); err != nil {
				return err
			}
			return nil
		}
		default: {
			cmd := exec.Command("espeak", s, "-w", outputPath)
			if err := cmd.Run(); err != nil {
				return err
			}
			return nil
		}
	}
}
