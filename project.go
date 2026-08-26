package main

import "time"

type Project struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Genre           string    `json:"genre"`
	WordCount       int       `json:"wordCount"`
	ChapterCount    int       `json:"chapterCount"`
	ProgressPct     int       `json:"progressPct"`
	TargetWordCount int       `json:"targetWordCount"`
	EditedAt        time.Time `json:"editedAt"`
	Cover           string    `json:"cover"`
	Font            string    `json:"font"`
	FontSize        int       `json:"fontSize"`
}

const defaultFontSize = 18

type ResearchLink struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	URL       string `json:"url"`
	ProjectID string `json:"projectId,omitempty"`
}

type WriterDesk struct {
	StreakDays    int            `json:"streakDays"`
	StreakMessage string         `json:"streakMessage"`
	WordsToday    int            `json:"wordsToday"`
	DailyGoal     int            `json:"dailyGoal"`
	QuickResearch []ResearchLink `json:"quickResearch"`
}

const defaultFont = `"Fraunces", Georgia, ui-serif, serif`
