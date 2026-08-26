package main

import "time"

func (s *Store) ListResearch(projectID string) ([]ResearchLink, error) {
	rows, err := s.db.Query(`
		SELECT id, title, url, project_id
		FROM research_links
		WHERE project_id = ?
		ORDER BY sort_order, title
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ResearchLink{}
	for rows.Next() {
		var r ResearchLink
		if err := rows.Scan(&r.ID, &r.Title, &r.URL, &r.ProjectID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) ListRecentResearch(limit int) ([]ResearchLink, error) {
	rows, err := s.db.Query(`
		SELECT id, title, url, project_id
		FROM research_links
		ORDER BY updated_at DESC
		LIMIT ?
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ResearchLink{}
	for rows.Next() {
		var r ResearchLink
		if err := rows.Scan(&r.ID, &r.Title, &r.URL, &r.ProjectID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) ListAllResearch() ([]ResearchLink, error) {
	rows, err := s.db.Query(`
		SELECT r.id, r.title, r.url, r.project_id
		FROM research_links r
		JOIN projects p ON p.id = r.project_id
		ORDER BY p.edited_at DESC, r.sort_order, r.title
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ResearchLink{}
	for rows.Next() {
		var r ResearchLink
		if err := rows.Scan(&r.ID, &r.Title, &r.URL, &r.ProjectID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) CreateResearch(projectID, title, url string) (*ResearchLink, error) {
	if title == "" {
		title = url
	}
	if title == "" {
		title = "Untitled link"
	}
	id := newID()
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(`
		INSERT INTO research_links (id, project_id, title, url, sort_order, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, id, projectID, title, url, now, now, now); err != nil {
		return nil, err
	}
	return &ResearchLink{ID: id, Title: title, URL: url, ProjectID: projectID}, nil
}

func (s *Store) DeleteResearch(id string) error {
	_, err := s.db.Exec(`DELETE FROM research_links WHERE id = ?`, id)
	return err
}
