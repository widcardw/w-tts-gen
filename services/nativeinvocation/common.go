package nativeinvocation

type VoiceInfo struct {
	Name string `json:"name"`
	Lang string `json:"lang"`
	Desc string `json:"desc"`
}

// TtsError 自定义 TTS 错误类型
type TtsError struct {
	Code    string `json:"code"`    // 错误代码，用于前端识别错误类型
	Message string `json:"message"` // 错误消息，可以是占位符
	Details string `json:"details"` // 详细信息（可选）
}

func (e *TtsError) Error() string {
	if e.Details != "" {
		return e.Message + ": " + e.Details
	}
	return e.Message
}

// 预定义错误代码
const (
	ErrCodeFFmpegNotFound   = "FFMPEG_NOT_FOUND"
	ErrCodeConversionFailed = "CONVERSION_FAILED"
	ErrCodeVoiceNotFound    = "VOICE_NOT_FOUND"
	ErrCodeGenerationFailed = "GENERATION_FAILED"
)

// NewFFmpegNotFoundError 创建 FFmpeg 未找到错误
func NewFFmpegNotFoundError() *TtsError {
	return &TtsError{
		Code:    ErrCodeFFmpegNotFound,
		Message: "FFmpeg 未找到，无法转换为 M4A 格式",
	}
}

// NewConversionFailedError 创建转换失败错误
func NewConversionFailedError(details string) *TtsError {
	return &TtsError{
		Code:    ErrCodeConversionFailed,
		Message: "音频转换失败",
		Details: details,
	}
}
