package nativeinvocation

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strings"
)

// GetVoiceList 获取系统语音列表，包含完整信息
func GetDarwinVoiceList() ([]VoiceInfo, error) {
	cmd := exec.Command("say", "-v", "?")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("执行命令失败: %v", err)
	}

	var voices []VoiceInfo
	scanner := bufio.NewScanner(strings.NewReader(string(output)))

	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			continue
		}

		// 示例: "Alex       en_US    # Most people recognize me by my voice."
		voiceInfo := parseVoiceLine(line)
		if voiceInfo != nil {
			voices = append(voices, *voiceInfo)
		}
	}

	return voices, nil
}

func DarwinGenerateTts(v VoiceInfo, outputPath string, s string, compress bool) (string, error) {
	var tmp = outputPath
	if !strings.HasSuffix(outputPath, ".aiff") {
		tmp = outputPath + ".aiff"
	}
	var cmd *exec.Cmd
	if v.Name == "" {
		cmd = exec.Command("say", "-o", tmp, s)
	} else {
		cmd = exec.Command("say", "-v", v.Name, "-o", tmp, s)
	}
	if err := cmd.Run(); err != nil {
		log.Fatal("Failed to generate tts!")
		return "", err
	}

	// 如果需要压缩为 AAC 格式
	if compress {
		// 将 AIFF 转换为 AAC
		aacPath := strings.TrimSuffix(tmp, ".aiff") + ".m4a"
		convertCmd := exec.Command("afconvert", tmp, "-f", "m4af", "-d", "aac", "-q", "127", aacPath)
		if err := convertCmd.Run(); err != nil {
			// 转换失败，返回原始 AIFF 文件
			log.Printf("Failed to convert to AAC: %v", err)
			return tmp, nil
		}
		// 转换成功，删除原始 AIFF 文件
		os.Remove(tmp)
		return aacPath, nil
	}

	return tmp, nil
}

func TryListeningDarwin(v VoiceInfo) error {
	var cmd *exec.Cmd
	if v.Name == "" {
		cmd = exec.Command("say", "Hello. I am the default speaker.")
	} else {
		cmd = exec.Command("say", "-v", v.Name, fmt.Sprintf("%s", v.Desc))
	}
	return cmd.Run()
}

// parseVoiceLine 解析单行语音信息
func parseVoiceLine(line string) *VoiceInfo {
	// 查找语言代码和描述的分隔符 "#"
	hashIndex := strings.Index(line, "#")
	if hashIndex == -1 {
		// 如果没有#，尝试按空格分割
		return nil
	}

	// 分割左右两部分
	leftPart := strings.TrimSpace(line[:hashIndex])
	description := strings.TrimSpace(line[hashIndex+1:])

	re, err := regexp.Compile(`[a-zA-Z0-9]+_[a-zA-Z0-9]+$`)
	if err != nil {
		return nil
	}
	langCode := strings.TrimSpace(re.FindString(leftPart))
	if langCode == "" {
		return nil
	}
	voiceName := strings.TrimSpace(strings.Trim(leftPart, langCode))

	return &VoiceInfo{
		Name: voiceName,
		Lang: langCode,
		Desc: description,
	}
}
