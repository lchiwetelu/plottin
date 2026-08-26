package main

import (
	"database/sql"
	"errors"
	"time"
)

type projectScanner interface {
	Scan(dest ...any) error
}

const projectSelect = `
	SELECT p.id, p.title, p.genre, p.cover, p.font, p.font_size, p.target_word_count, p.edited_at,
	       COALESCE((SELECT SUM(word_count) FROM chapters WHERE project_id = p.id), 0),
	       COALESCE((SELECT COUNT(*)        FROM chapters WHERE project_id = p.id), 0)
	FROM projects p
`

func scanProject(row projectScanner) (Project, error) {
	var p Project
	var target, wc, cc, fontSize int
	var editedMs int64
	if err := row.Scan(&p.ID, &p.Title, &p.Genre, &p.Cover, &p.Font, &fontSize, &target, &editedMs, &wc, &cc); err != nil {
		return p, err
	}
	p.FontSize = fontSize
	if p.FontSize <= 0 {
		p.FontSize = defaultFontSize
	}
	p.TargetWordCount = target
	p.WordCount = wc
	p.ChapterCount = cc
	p.EditedAt = time.UnixMilli(editedMs)
	p.ProgressPct = computeProgressPct(wc, target)
	return p, nil
}

func computeProgressPct(wordCount, target int) int {
	if target <= 0 {
		return 0
	}
	pct := wordCount * 100 / target
	if pct > 100 {
		return 100
	}
	return pct
}

func (s *Store) ListProjects() ([]Project, error) {
	rows, err := s.db.Query(projectSelect + " ORDER BY p.edited_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Project{}
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) GetProject(id string) (*Project, error) {
	row := s.db.QueryRow(projectSelect+" WHERE p.id = ?", id)
	p, err := scanProject(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) DeleteProject(id string) error {
	_, err := s.db.Exec(`DELETE FROM projects WHERE id = ?`, id)
	return err
}

func (s *Store) SetProjectFont(id, font string) (*Project, error) {
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(
		`UPDATE projects SET font = ?, updated_at = ?, edited_at = ? WHERE id = ?`,
		font, now, now, id,
	); err != nil {
		return nil, err
	}
	return s.GetProject(id)
}

func (s *Store) SetProjectFontSize(id string, size int) (*Project, error) {
	if size < 10 || size > 48 {
		size = defaultFontSize
	}
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(
		`UPDATE projects SET font_size = ?, updated_at = ?, edited_at = ? WHERE id = ?`,
		size, now, now, id,
	); err != nil {
		return nil, err
	}
	return s.GetProject(id)
}

func (s *Store) SetProjectGenre(id, genre string) (*Project, error) {
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(
		`UPDATE projects SET genre = ?, updated_at = ?, edited_at = ? WHERE id = ?`,
		genre, now, now, id,
	); err != nil {
		return nil, err
	}
	return s.GetProject(id)
}

func (s *Store) SetProjectTitle(id, title string) (*Project, error) {
	if title == "" {
		title = "Untitled Project"
	}
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(
		`UPDATE projects SET title = ?, updated_at = ?, edited_at = ? WHERE id = ?`,
		title, now, now, id,
	); err != nil {
		return nil, err
	}
	return s.GetProject(id)
}

func (s *Store) SetProjectCover(id, cover string) (*Project, error) {
	if cover == "" {
		cover = "fantasy"
	}
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(
		`UPDATE projects SET cover = ?, updated_at = ?, edited_at = ? WHERE id = ?`,
		cover, now, now, id,
	); err != nil {
		return nil, err
	}
	return s.GetProject(id)
}

func (s *Store) CreateProject() (*Project, error) {
	id := newID()
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(`
		INSERT INTO projects (id, title, genre, cover, font, font_size, target_word_count, edited_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, "Untitled Project", "UNTITLED GENRE", "fantasy", defaultFont, defaultFontSize, 80000, now, now, now); err != nil {
		return nil, err
	}
	return s.GetProject(id)
}
