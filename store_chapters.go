package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

func countWords(v any) int {
	switch node := v.(type) {
	case []any:
		total := 0
		for _, item := range node {
			total += countWords(item)
		}
		return total
	case map[string]any:
		total := 0
		if text, ok := node["text"].(string); ok {
			total += len(strings.Fields(text))
		}
		if children, ok := node["children"]; ok {
			total += countWords(children)
		}
		return total
	default:
		return 0
	}
}

func scanChapter(row projectScanner) (Chapter, error) {
	var c Chapter
	var contentStr string
	if err := row.Scan(&c.ID, &c.ProjectID, &c.Number, &c.Title, &c.WordCount, &contentStr); err != nil {
		return c, err
	}
	if err := json.Unmarshal([]byte(contentStr), &c.Content); err != nil {
		return c, err
	}
	return c, nil
}

func (s *Store) ListChapters(projectID string) ([]Chapter, error) {
	rows, err := s.db.Query(`
		SELECT id, project_id, number, title, word_count, content
		FROM chapters
		WHERE project_id = ?
		ORDER BY number
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Chapter{}
	for rows.Next() {
		c, err := scanChapter(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) GetChapter(chapterID string) (*Chapter, error) {
	row := s.db.QueryRow(`
		SELECT id, project_id, number, title, word_count, content
		FROM chapters WHERE id = ?
	`, chapterID)
	c, err := scanChapter(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) SetChapterTitle(chapterID, title string) (*Chapter, error) {
	if title == "" {
		title = "Untitled Chapter"
	}
	now := time.Now().UnixMilli()
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		`UPDATE chapters SET title = ?, updated_at = ? WHERE id = ?`,
		title, now, chapterID,
	); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(`
		UPDATE projects SET edited_at = ?, updated_at = ?
		WHERE id = (SELECT project_id FROM chapters WHERE id = ?)
	`, now, now, chapterID); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetChapter(chapterID)
}

func (s *Store) CreateChapter(projectID string) (*Chapter, error) {
	now := time.Now().UnixMilli()
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var maxNum sql.NullInt64
	if err := tx.QueryRow(
		`SELECT MAX(number) FROM chapters WHERE project_id = ?`,
		projectID,
	).Scan(&maxNum); err != nil {
		return nil, err
	}
	next := 1
	if maxNum.Valid {
		next = int(maxNum.Int64) + 1
	}
	id := newID()
	if _, err := tx.Exec(`
		INSERT INTO chapters (id, project_id, number, title, word_count, content, created_at, updated_at)
		VALUES (?, ?, ?, ?, 0, '[]', ?, ?)
	`, id, projectID, next, "Untitled Chapter", now, now); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(
		`UPDATE projects SET edited_at = ?, updated_at = ? WHERE id = ?`,
		now, now, projectID,
	); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetChapter(id)
}

func (s *Store) SaveChapterContent(chapterID string, content any) (*Chapter, error) {
	contentJSON, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}
	newWC := countWords(content)
	now := time.Now().UnixMilli()

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var oldWC int
	var projectID string
	if err := tx.QueryRow(
		`SELECT word_count, project_id FROM chapters WHERE id = ?`,
		chapterID,
	).Scan(&oldWC, &projectID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if _, err := tx.Exec(
		`UPDATE chapters SET content = ?, word_count = ?, updated_at = ? WHERE id = ?`,
		string(contentJSON), newWC, now, chapterID,
	); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(
		`UPDATE projects SET edited_at = ?, updated_at = ? WHERE id = ?`,
		now, now, projectID,
	); err != nil {
		return nil, err
	}

	delta := newWC - oldWC
	if delta > 0 {
		today := time.Now().Format("2006-01-02")
		if _, err := tx.Exec(`
			INSERT INTO writing_sessions (project_id, date, words_written, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(project_id, date) DO UPDATE SET
				words_written = words_written + excluded.words_written,
				updated_at = excluded.updated_at
		`, projectID, today, delta, now, now); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetChapter(chapterID)
}
