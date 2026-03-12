package services

type ProgressEvent struct {
	Finished int `json:"finished"`
	Total    int `json:"total"`
}
