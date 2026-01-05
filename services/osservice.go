package services

import "runtime"

type OsService struct{}

func (o *OsService) GetOs() string {
	return runtime.GOOS
}
