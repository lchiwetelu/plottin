package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const schemaSQL = `
CREATE TABLE IF NOT EXISTS projects (
    id                 TEXT PRIMARY KEY,
    title              TEXT NOT NULL,
    genre              TEXT NOT NULL DEFAULT '',
    cover              TEXT NOT NULL DEFAULT 'fantasy',
    font               TEXT NOT NULL DEFAULT '"Fraunces", Georgia, ui-serif, serif',
    font_size          INTEGER NOT NULL DEFAULT 18,
    target_word_count  INTEGER NOT NULL DEFAULT 80000,
    edited_at          INTEGER NOT NULL,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number       INTEGER NOT NULL,
    title        TEXT NOT NULL,
    word_count   INTEGER NOT NULL DEFAULT 0,
    content      TEXT NOT NULL DEFAULT '[]',
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL,
    UNIQUE (project_id, number)
);
CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id, number);

CREATE TABLE IF NOT EXISTS characters (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    role         TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id, sort_order);

CREATE TABLE IF NOT EXISTS research_links (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    url          TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_research_project ON research_links(project_id, sort_order);

CREATE TABLE IF NOT EXISTS notes (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    body         TEXT NOT NULL DEFAULT '',
    kind         TEXT NOT NULL DEFAULT 'text',
    audio_url    TEXT NOT NULL DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id, sort_order);

CREATE TABLE IF NOT EXISTS moodboards (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    nodes        TEXT NOT NULL DEFAULT '[]',
    edges        TEXT NOT NULL DEFAULT '[]',
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_moodboards_project ON moodboards(project_id);

CREATE TABLE IF NOT EXISTS writing_sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date           TEXT NOT NULL,
    words_written  INTEGER NOT NULL DEFAULT 0,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    UNIQUE (project_id, date)
);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON writing_sessions(date);

CREATE TABLE IF NOT EXISTS settings (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
);
`

type Store struct {
	db *sql.DB
}

func OpenStore() (*Store, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("user config dir: %w", err)
	}
	dir = filepath.Join(dir, "plottin")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("mkdir: %w", err)
	}
	path := filepath.Join(dir, "plottin.db")

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	for _, pragma := range []string{
		"PRAGMA journal_mode = WAL",
		"PRAGMA foreign_keys = ON",
		"PRAGMA synchronous = NORMAL",
	} {
		if _, err := db.Exec(pragma); err != nil {
			return nil, fmt.Errorf("pragma %q: %w", pragma, err)
		}
	}

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	var version int
	if err := s.db.QueryRow("PRAGMA user_version").Scan(&version); err != nil {
		return err
	}
	if version < 1 {
		if _, err := s.db.Exec(schemaSQL); err != nil {
			return err
		}
		if _, err := s.db.Exec("PRAGMA user_version = 1"); err != nil {
			return err
		}
		version = 1
	}
	if version < 2 {
		// Notes gain kind + audio_url for voice notes.
		// Fresh v1 installs already have these from schemaSQL; guard the ALTERs
		// so we don't fail on those.
		if !s.columnExists("notes", "kind") {
			if _, err := s.db.Exec(`ALTER TABLE notes ADD COLUMN kind TEXT NOT NULL DEFAULT 'text'`); err != nil {
				return err
			}
		}
		if !s.columnExists("notes", "audio_url") {
			if _, err := s.db.Exec(`ALTER TABLE notes ADD COLUMN audio_url TEXT NOT NULL DEFAULT ''`); err != nil {
				return err
			}
		}
		if _, err := s.db.Exec("PRAGMA user_version = 2"); err != nil {
			return err
		}
		version = 2
	}
	if version < 3 {
		if !s.columnExists("projects", "font_size") {
			if _, err := s.db.Exec(`ALTER TABLE projects ADD COLUMN font_size INTEGER NOT NULL DEFAULT 18`); err != nil {
				return err
			}
		}
		if _, err := s.db.Exec("PRAGMA user_version = 3"); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) columnExists(table, column string) bool {
	rows, err := s.db.Query(`SELECT name FROM pragma_table_info(?)`, table)
	if err != nil {
		return false
	}
	defer rows.Close()
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil && name == column {
			return true
		}
	}
	return false
}
