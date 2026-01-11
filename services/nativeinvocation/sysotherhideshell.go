//go:build !windows
// +build !windows

package nativeinvocation

import (
	"syscall"
)

func CreateSysAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}
