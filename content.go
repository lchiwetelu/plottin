package main

type Chapter struct {
	ID        string `json:"id"`
	ProjectID string `json:"projectId"`
	Number    int    `json:"number"`
	Title     string `json:"title"`
	WordCount int    `json:"wordCount"`
	Content   any    `json:"content"`
}

type Character struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Role        string `json:"role"`
	Description string `json:"description"`
}

type Note struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Body     string `json:"body"`
	Kind     string `json:"kind"`     // "text" | "voice"
	AudioURL string `json:"audioUrl"` // data URL for voice notes
}

type ProjectDetail struct {
	Project    Project        `json:"project"`
	Chapters   []Chapter      `json:"chapters"`
	Characters []Character    `json:"characters"`
	Research   []ResearchLink `json:"research"`
	Notes      []Note         `json:"notes"`
}
