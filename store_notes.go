package main

import "time"

func (s *Store) ListNotes(projectID string) ([]Note, error) {
	rows, err := s.db.Query(`
		SELECT id, title, body, kind, audio_url
		FROM notes
		WHERE project_id = ?
		ORDER BY sort_order, title
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Note{}
	for rows.Next() {
		var n Note
		if err := rows.Scan(&n.ID, &n.Title, &n.Body, &n.Kind, &n.AudioURL); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

func (s *Store) CreateNote(projectID, title, body, kind, audioURL string) (*Note, error) {
	if kind == "" {
		kind = "text"
	}
	if title == "" {
		if kind == "voice" {
			title = "Voice note"
		} else {
			title = "Untitled note"
		}
	}
	id := newID()
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(`
		INSERT INTO notes (id, project_id, title, body, kind, audio_url, sort_order, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, projectID, title, body, kind, audioURL, now, now, now); err != nil {
		return nil, err
	}
	return &Note{
		ID:       id,
		Title:    title,
		Body:     body,
		Kind:     kind,
		AudioURL: audioURL,
	}, nil
}

func (s *Store) DeleteNote(id string) error {
	_, err := s.db.Exec(`DELETE FROM notes WHERE id = ?`, id)
	return err
}
