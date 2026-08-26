package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

func scanMoodboard(row projectScanner) (Moodboard, error) {
	var m Moodboard
	var nodesStr, edgesStr string
	if err := row.Scan(&m.ID, &m.ProjectID, &m.Title, &nodesStr, &edgesStr); err != nil {
		return m, err
	}
	if err := json.Unmarshal([]byte(nodesStr), &m.Nodes); err != nil {
		return m, err
	}
	if err := json.Unmarshal([]byte(edgesStr), &m.Edges); err != nil {
		return m, err
	}
	return m, nil
}

func (s *Store) ListMoodboards(projectID string) ([]Moodboard, error) {
	rows, err := s.db.Query(`
		SELECT id, project_id, title, nodes, edges
		FROM moodboards
		WHERE project_id = ?
		ORDER BY created_at
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Moodboard{}
	for rows.Next() {
		m, err := scanMoodboard(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) ListAllMoodboards() ([]Moodboard, error) {
	rows, err := s.db.Query(`
		SELECT m.id, m.project_id, m.title, m.nodes, m.edges
		FROM moodboards m
		JOIN projects p ON m.project_id = p.id
		ORDER BY p.edited_at DESC, m.created_at
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Moodboard{}
	for rows.Next() {
		m, err := scanMoodboard(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) GetMoodboard(id string) (*Moodboard, error) {
	row := s.db.QueryRow(`
		SELECT id, project_id, title, nodes, edges
		FROM moodboards WHERE id = ?
	`, id)
	m, err := scanMoodboard(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (s *Store) CreateMoodboard(projectID, title string) (*Moodboard, error) {
	if title == "" {
		title = "Untitled Moodboard"
	}
	id := newID()
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(`
		INSERT INTO moodboards (id, project_id, title, nodes, edges, created_at, updated_at)
		VALUES (?, ?, ?, '[]', '[]', ?, ?)
	`, id, projectID, title, now, now); err != nil {
		return nil, err
	}
	return s.GetMoodboard(id)
}

func (s *Store) SaveMoodboard(id string, nodes, edges any) (*Moodboard, error) {
	now := time.Now().UnixMilli()
	if nodes != nil {
		b, err := json.Marshal(nodes)
		if err != nil {
			return nil, err
		}
		if _, err := s.db.Exec(
			`UPDATE moodboards SET nodes = ?, updated_at = ? WHERE id = ?`,
			string(b), now, id,
		); err != nil {
			return nil, err
		}
	}
	if edges != nil {
		b, err := json.Marshal(edges)
		if err != nil {
			return nil, err
		}
		if _, err := s.db.Exec(
			`UPDATE moodboards SET edges = ?, updated_at = ? WHERE id = ?`,
			string(b), now, id,
		); err != nil {
			return nil, err
		}
	}
	return s.GetMoodboard(id)
}

func (s *Store) SetMoodboardTitle(id, title string) (*Moodboard, error) {
	if title == "" {
		title = "Untitled Moodboard"
	}
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(
		`UPDATE moodboards SET title = ?, updated_at = ? WHERE id = ?`,
		title, now, id,
	); err != nil {
		return nil, err
	}
	return s.GetMoodboard(id)
}
