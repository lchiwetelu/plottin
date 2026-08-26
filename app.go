package main

import (
	"context"
	"log"
)

type App struct {
	ctx   context.Context
	store *Store
}

func NewApp(store *Store) *App {
	return &App{store: store}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetProjects() []Project {
	ps, err := a.store.ListProjects()
	if err != nil {
		log.Println("GetProjects:", err)
		return []Project{}
	}
	return ps
}

func (a *App) GetWriterDesk() WriterDesk {
	d, err := a.store.GetWriterDesk()
	if err != nil {
		log.Println("GetWriterDesk:", err)
		return WriterDesk{QuickResearch: []ResearchLink{}}
	}
	return d
}

func (a *App) GetProjectDetail(id string) *ProjectDetail {
	p, err := a.store.GetProject(id)
	if err != nil {
		log.Println("GetProjectDetail:", err)
		return nil
	}
	if p == nil {
		return nil
	}
	chapters, err := a.store.ListChapters(id)
	if err != nil {
		log.Println("ListChapters:", err)
	}
	characters, err := a.store.ListCharacters(id)
	if err != nil {
		log.Println("ListCharacters:", err)
	}
	research, err := a.store.ListResearch(id)
	if err != nil {
		log.Println("ListResearch:", err)
	}
	notes, err := a.store.ListNotes(id)
	if err != nil {
		log.Println("ListNotes:", err)
	}
	return &ProjectDetail{
		Project:    *p,
		Chapters:   chapters,
		Characters: characters,
		Research:   research,
		Notes:      notes,
	}
}

func (a *App) SetProjectFont(id, font string) *Project {
	p, err := a.store.SetProjectFont(id, font)
	if err != nil {
		log.Println("SetProjectFont:", err)
		return nil
	}
	return p
}

func (a *App) SetProjectFontSize(id string, size int) *Project {
	p, err := a.store.SetProjectFontSize(id, size)
	if err != nil {
		log.Println("SetProjectFontSize:", err)
		return nil
	}
	return p
}

func (a *App) SetProjectGenre(id, genre string) *Project {
	p, err := a.store.SetProjectGenre(id, genre)
	if err != nil {
		log.Println("SetProjectGenre:", err)
		return nil
	}
	return p
}

func (a *App) SetChapterTitle(chapterID, title string) *Chapter {
	c, err := a.store.SetChapterTitle(chapterID, title)
	if err != nil {
		log.Println("SetChapterTitle:", err)
		return nil
	}
	return c
}

func (a *App) SetProjectTitle(id, title string) *Project {
	p, err := a.store.SetProjectTitle(id, title)
	if err != nil {
		log.Println("SetProjectTitle:", err)
		return nil
	}
	return p
}

func (a *App) SetProjectCover(id, cover string) *Project {
	p, err := a.store.SetProjectCover(id, cover)
	if err != nil {
		log.Println("SetProjectCover:", err)
		return nil
	}
	return p
}

func (a *App) CreateProject() *Project {
	p, err := a.store.CreateProject()
	if err != nil {
		log.Println("CreateProject:", err)
		return nil
	}
	return p
}

func (a *App) CreateChapter(projectID string) *Chapter {
	c, err := a.store.CreateChapter(projectID)
	if err != nil {
		log.Println("CreateChapter:", err)
		return nil
	}
	return c
}

func (a *App) SaveChapterContent(chapterID string, content any) *Chapter {
	c, err := a.store.SaveChapterContent(chapterID, content)
	if err != nil {
		log.Println("SaveChapterContent:", err)
		return nil
	}
	return c
}

func (a *App) CreateCharacter(projectID, name, role, description string) *Character {
	c, err := a.store.CreateCharacter(projectID, name, role, description)
	if err != nil {
		log.Println("CreateCharacter:", err)
		return nil
	}
	return c
}

func (a *App) DeleteCharacter(id string) bool {
	if err := a.store.DeleteCharacter(id); err != nil {
		log.Println("DeleteCharacter:", err)
		return false
	}
	return true
}

func (a *App) GetAllResearch() []ResearchLink {
	rs, err := a.store.ListAllResearch()
	if err != nil {
		log.Println("GetAllResearch:", err)
		return []ResearchLink{}
	}
	return rs
}

func (a *App) CreateResearch(projectID, title, url string) *ResearchLink {
	r, err := a.store.CreateResearch(projectID, title, url)
	if err != nil {
		log.Println("CreateResearch:", err)
		return nil
	}
	return r
}

func (a *App) DeleteResearch(id string) bool {
	if err := a.store.DeleteResearch(id); err != nil {
		log.Println("DeleteResearch:", err)
		return false
	}
	return true
}

func (a *App) CreateNote(projectID, title, body, kind, audioURL string) *Note {
	n, err := a.store.CreateNote(projectID, title, body, kind, audioURL)
	if err != nil {
		log.Println("CreateNote:", err)
		return nil
	}
	return n
}

func (a *App) DeleteNote(id string) bool {
	if err := a.store.DeleteNote(id); err != nil {
		log.Println("DeleteNote:", err)
		return false
	}
	return true
}

func (a *App) DeleteProject(id string) bool {
	if err := a.store.DeleteProject(id); err != nil {
		log.Println("DeleteProject:", err)
		return false
	}
	return true
}

// ExportProject is defined in export.go.

func (a *App) GetMoodboards(projectID string) []Moodboard {
	ms, err := a.store.ListMoodboards(projectID)
	if err != nil {
		log.Println("GetMoodboards:", err)
		return []Moodboard{}
	}
	return ms
}

func (a *App) GetAllMoodboards() []Moodboard {
	ms, err := a.store.ListAllMoodboards()
	if err != nil {
		log.Println("GetAllMoodboards:", err)
		return []Moodboard{}
	}
	return ms
}

func (a *App) GetMoodboard(id string) *Moodboard {
	m, err := a.store.GetMoodboard(id)
	if err != nil {
		log.Println("GetMoodboard:", err)
		return nil
	}
	return m
}

func (a *App) CreateMoodboard(projectID, title string) *Moodboard {
	m, err := a.store.CreateMoodboard(projectID, title)
	if err != nil {
		log.Println("CreateMoodboard:", err)
		return nil
	}
	return m
}

func (a *App) SaveMoodboard(id string, nodes, edges any) *Moodboard {
	m, err := a.store.SaveMoodboard(id, nodes, edges)
	if err != nil {
		log.Println("SaveMoodboard:", err)
		return nil
	}
	return m
}

func (a *App) SetMoodboardTitle(id, title string) *Moodboard {
	m, err := a.store.SetMoodboardTitle(id, title)
	if err != nil {
		log.Println("SetMoodboardTitle:", err)
		return nil
	}
	return m
}
