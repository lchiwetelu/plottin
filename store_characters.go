package main

import "time"

func (s *Store) ListCharacters(projectID string) ([]Character, error) {
	rows, err := s.db.Query(`
		SELECT id, name, role, description
		FROM characters
		WHERE project_id = ?
		ORDER BY sort_order, name
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Character{}
	for rows.Next() {
		var c Character
		if err := rows.Scan(&c.ID, &c.Name, &c.Role, &c.Description); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) CreateCharacter(projectID, name, role, description string) (*Character, error) {
	if name == "" {
		name = "Untitled character"
	}
	id := newID()
	now := time.Now().UnixMilli()
	if _, err := s.db.Exec(`
		INSERT INTO characters (id, project_id, name, role, description, sort_order, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, id, projectID, name, role, description, now, now, now); err != nil {
		return nil, err
	}
	return &Character{
		ID:          id,
		Name:        name,
		Role:        role,
		Description: description,
	}, nil
}

func (s *Store) DeleteCharacter(id string) error {
	_, err := s.db.Exec(`DELETE FROM characters WHERE id = ?`, id)
	return err
}
