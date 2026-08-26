package main

import (
	"fmt"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ExportOptions struct {
	Format               string `json:"format"`   // "pdf" | "epub" | "docx"
	FontFamily           string `json:"fontFamily"` // "serif" | "sans" | "mono"
	FontSize             int    `json:"fontSize"`
	IncludeImages        bool   `json:"includeImages"`
	IncludeChapterTitles bool   `json:"includeChapterTitles"`
}

type ExportResult struct {
	Path     string `json:"path"`
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	Canceled bool   `json:"canceled"`
}

type exportRun struct {
	Text          string
	Bold          bool
	Italic        bool
	Underline     bool
	Strikethrough bool
	Code          bool
}

type exportBlockType string

const (
	blockParagraph  exportBlockType = "paragraph"
	blockH1         exportBlockType = "h1"
	blockH2         exportBlockType = "h2"
	blockH3         exportBlockType = "h3"
	blockQuote      exportBlockType = "quote"
	blockListBullet exportBlockType = "list-bullet"
	blockListNumber exportBlockType = "list-number"
	blockImage      exportBlockType = "image"
)

type exportBlock struct {
	Type exportBlockType
	Runs []exportRun
	URL  string
}

type exportChapter struct {
	Number int
	Title  string
	Blocks []exportBlock
}

type exportBook struct {
	Title    string
	Author   string
	Genre    string
	Chapters []exportChapter
}

func (a *App) ExportProject(projectID string, opts ExportOptions) ExportResult {
	book, err := a.buildExportBook(projectID)
	if err != nil {
		return ExportResult{Success: false, Message: err.Error()}
	}

	ext := exportExtension(opts.Format)
	if ext == "" {
		return ExportResult{Success: false, Message: "unknown format: " + opts.Format}
	}
	if opts.FontSize <= 0 {
		opts.FontSize = 12
	}

	filename := safeFilename(book.Title) + ext
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export " + book.Title,
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: strings.ToUpper(opts.Format) + " (*" + ext + ")", Pattern: "*" + ext},
		},
	})
	if err != nil {
		return ExportResult{Success: false, Message: err.Error()}
	}
	if path == "" {
		return ExportResult{Canceled: true}
	}

	switch opts.Format {
	case "pdf":
		if err := exportPDF(book, path, opts); err != nil {
			return ExportResult{Success: false, Message: err.Error()}
		}
	case "epub":
		if err := exportEPUB(book, path, opts); err != nil {
			return ExportResult{Success: false, Message: err.Error()}
		}
	case "docx":
		if err := exportDOCX(book, path, opts); err != nil {
			return ExportResult{Success: false, Message: err.Error()}
		}
	default:
		return ExportResult{Success: false, Message: "unknown format: " + opts.Format}
	}

	return ExportResult{Path: path, Success: true, Message: "Exported to " + path}
}

func (a *App) buildExportBook(projectID string) (*exportBook, error) {
	p, err := a.store.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, fmt.Errorf("project not found: %s", projectID)
	}
	chapters, err := a.store.ListChapters(projectID)
	if err != nil {
		return nil, err
	}
	book := &exportBook{
		Title:    p.Title,
		Genre:    p.Genre,
		Chapters: make([]exportChapter, 0, len(chapters)),
	}
	for _, ch := range chapters {
		book.Chapters = append(book.Chapters, exportChapter{
			Number: ch.Number,
			Title:  ch.Title,
			Blocks: slateToBlocks(ch.Content),
		})
	}
	return book, nil
}

func exportExtension(format string) string {
	switch format {
	case "pdf":
		return ".pdf"
	case "epub":
		return ".epub"
	case "docx":
		return ".docx"
	}
	return ""
}

func safeFilename(s string) string {
	if s == "" {
		return "Untitled"
	}
	repl := strings.NewReplacer("/", "-", "\\", "-", ":", "-", "*", "-", "?", "-", "\"", "'", "<", "-", ">", "-", "|", "-")
	out := strings.TrimSpace(repl.Replace(s))
	if out == "" {
		return "Untitled"
	}
	return out
}

// slateToBlocks flattens Slate JSON into a simple list of blocks + runs.
func slateToBlocks(content any) []exportBlock {
	arr, ok := content.([]any)
	if !ok {
		return nil
	}
	var out []exportBlock
	for _, node := range arr {
		m, ok := node.(map[string]any)
		if !ok {
			continue
		}
		nodeType, _ := m["type"].(string)
		switch nodeType {
		case "paragraph":
			out = append(out, exportBlock{Type: blockParagraph, Runs: extractRuns(m["children"])})
		case "heading-one":
			out = append(out, exportBlock{Type: blockH1, Runs: extractRuns(m["children"])})
		case "heading-two":
			out = append(out, exportBlock{Type: blockH2, Runs: extractRuns(m["children"])})
		case "heading-three":
			out = append(out, exportBlock{Type: blockH3, Runs: extractRuns(m["children"])})
		case "block-quote":
			out = append(out, exportBlock{Type: blockQuote, Runs: extractRuns(m["children"])})
		case "bulleted-list":
			for _, li := range extractListItems(m["children"]) {
				out = append(out, exportBlock{Type: blockListBullet, Runs: li})
			}
		case "numbered-list":
			for _, li := range extractListItems(m["children"]) {
				out = append(out, exportBlock{Type: blockListNumber, Runs: li})
			}
		case "image":
			url, _ := m["url"].(string)
			out = append(out, exportBlock{Type: blockImage, URL: url})
		default:
			// Unknown block — treat children as paragraph text.
			out = append(out, exportBlock{Type: blockParagraph, Runs: extractRuns(m["children"])})
		}
	}
	return out
}

func extractRuns(children any) []exportRun {
	arr, ok := children.([]any)
	if !ok {
		return nil
	}
	var runs []exportRun
	for _, c := range arr {
		m, ok := c.(map[string]any)
		if !ok {
			continue
		}
		text, hasText := m["text"].(string)
		if !hasText {
			// Nested element (e.g., inline links) — recurse for its text.
			nested := extractRuns(m["children"])
			runs = append(runs, nested...)
			continue
		}
		runs = append(runs, exportRun{
			Text:          text,
			Bold:          asBool(m["bold"]),
			Italic:        asBool(m["italic"]),
			Underline:     asBool(m["underline"]),
			Strikethrough: asBool(m["strikethrough"]),
			Code:          asBool(m["code"]),
		})
	}
	return runs
}

func extractListItems(children any) [][]exportRun {
	arr, ok := children.([]any)
	if !ok {
		return nil
	}
	var items [][]exportRun
	for _, c := range arr {
		m, ok := c.(map[string]any)
		if !ok {
			continue
		}
		items = append(items, extractRuns(m["children"]))
	}
	return items
}

func asBool(v any) bool {
	b, _ := v.(bool)
	return b
}

