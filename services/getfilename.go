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
