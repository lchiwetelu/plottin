package main

import (
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"
)

func (s *Store) GetWriterDesk() (WriterDesk, error) {
	dailyGoal, err := s.getIntSetting("daily_goal", 3000)
	if err != nil {
		return WriterDesk{}, err
	}
	wordsToday, err := s.wordsToday()
	if err != nil {
		return WriterDesk{}, err
	}
	streak, err := s.computeStreak()
	if err != nil {
		return WriterDesk{}, err
	}
	research, err := s.ListRecentResearch(3)
	if err != nil {
		return WriterDesk{}, err
	}
	return WriterDesk{
		StreakDays:    streak,
		StreakMessage: streakMessage(wordsToday, dailyGoal),
		WordsToday:    wordsToday,
		DailyGoal:     dailyGoal,
		QuickResearch: research,
	}, nil
}

func (s *Store) getIntSetting(key string, def int) (int, error) {
	var val string
	err := s.db.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&val)
	if errors.Is(err, sql.ErrNoRows) {
		return def, nil
	}
	if err != nil {
		return 0, err
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return def, nil
	}
	return n, nil
}

func (s *Store) wordsToday() (int, error) {
	today := time.Now().Format("2006-01-02")
	var total sql.NullInt64
	if err := s.db.QueryRow(
		`SELECT SUM(words_written) FROM writing_sessions WHERE date = ?`,
		today,
	).Scan(&total); err != nil {
		return 0, err
	}
	if !total.Valid {
		return 0, nil
	}
	return int(total.Int64), nil
}

func (s *Store) computeStreak() (int, error) {
	since := time.Now().AddDate(0, 0, -90).Format("2006-01-02")
	rows, err := s.db.Query(`
		SELECT date, SUM(words_written) AS total
		FROM writing_sessions
		WHERE date >= ?
		GROUP BY date
		HAVING total > 0
	`, since)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	dates := map[string]bool{}
	for rows.Next() {
		var d string
		var total int
		if err := rows.Scan(&d, &total); err != nil {
			return 0, err
		}
		dates[d] = true
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}

	day := time.Now()
	if !dates[day.Format("2006-01-02")] {
		// If no writing today yet, allow streak to continue from yesterday.
		day = day.AddDate(0, 0, -1)
	}
	streak := 0
	for dates[day.Format("2006-01-02")] {
		streak++
		day = day.AddDate(0, 0, -1)
	}
	return streak, nil
}

func streakMessage(wordsToday, dailyGoal int) string {
	if dailyGoal <= 0 {
		return ""
	}
	if wordsToday >= dailyGoal {
		excess := wordsToday - dailyGoal
		if excess == 0 {
			return "Goal reached — nice work"
		}
		return fmt.Sprintf("You're %s past goal — keep the streak alive", formatComma(excess))
	}
	return fmt.Sprintf("Keep it up! %s more words to goal today", formatComma(dailyGoal-wordsToday))
}

func formatComma(n int) string {
	if n < 0 {
		return "-" + formatComma(-n)
	}
	s := strconv.Itoa(n)
	if len(s) <= 3 {
		return s
	}
	var out []byte
	start := len(s) % 3
	if start > 0 {
		out = append(out, s[:start]...)
	}
	for i := start; i < len(s); i += 3 {
		if len(out) > 0 {
			out = append(out, ',')
		}
		out = append(out, s[i:i+3]...)
	}
	return string(out)
}
