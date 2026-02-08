package services

import (
	"fmt"
	"strings"
	"time"
)

func Timestamp() string {
	return time.Now().Format("20060102150405")
}

// SanitizeFilename
// 1. trim spaces
// 2. replace invalid chars into '_'
// 3. keep leading k chars
func SanitizeFilename(s string, k int) string {
	if k <= 0 {
		return ""
	}

	// trim spaces
	s = strings.TrimSpace(s)
	if s == "" || k <= 0 {
		return ""
	}

	// build valid chars
	var result strings.Builder
	result.Grow(min(len(s), k)) // capacity

	for i, r := range s {
		if i >= k {
			break
		}
		if isValidFilenameChar(r) {
			result.WriteRune(r)
		} else {
			result.WriteRune('_')
		}
	}

	// edge cases: ends with space or dot
	normalized := result.String()
	if normalized == "" {
		return "unnamed"
	}
	normalized = strings.TrimRight(normalized, " .") // 移除尾部空格和点
	if normalized == "" {
		return "unnamed"
	}
	return normalized
}

// isValidFilenameChar
func isValidFilenameChar(r rune) bool {
	if r < 32 {
		return false
	}
	switch r {
	case '<', '>', ':', '"', '/', '\\', '|', '?', '*':
		return false
	default:
		return true
	}
}

func GetFileName(s string) string {
	return fmt.Sprintf("t_%s_%s",
		Timestamp(),
		SanitizeFilename(s, 5),
	)
}


// SplitText 按照逗号、分号、句号或换行分割文本
func SplitText(s string) []string {
	// 定义分隔符：逗号、分号、句号、换行
	separators := []rune{'，', ',', '；', ';', '。', '.', '\n', '\r'}

	var segments []string
	var current strings.Builder

	for _, r := range s {
		isSeparator := false
		for _, sep := range separators {
			if r == sep {
				isSeparator = true
				break
			}
		}

		if isSeparator {
			// 遇到分隔符，保存当前段
			if current.Len() > 0 {
				segment := strings.TrimSpace(current.String())
				if segment != "" {
					segments = append(segments, segment)
				}
				current.Reset()
			}
		} else {
			current.WriteRune(r)
		}
	}

	// 处理最后一段
	if current.Len() > 0 {
		segment := strings.TrimSpace(current.String())
		if segment != "" {
			segments = append(segments, segment)
		}
	}

	return segments
}

// GetSegmentFileName 生成音频片段文件名：编号_内容前5字_时间戳
func GetSegmentFileName(index int, content string) string {
	timestamp := time.Now().Format("20060102150405")
	return fmt.Sprintf("%d_%s_%s",
		index,
		SanitizeFilename(content, 5),
		timestamp,
	)
}

// GetFolderName 生成文件夹名：tts_前几个字摘要_时间戳
func GetFolderName(s string) string {
	timestamp := time.Now().Format("20060102150405")
	return fmt.Sprintf("tts_%s_%s",
		SanitizeFilename(s, 10),
		timestamp,
	)
}
