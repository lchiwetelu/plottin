package main

type Moodboard struct {
	ID        string `json:"id"`
	ProjectID string `json:"projectId"`
	Title     string `json:"title"`
	Nodes     any    `json:"nodes"`
	Edges     any    `json:"edges"`
}
