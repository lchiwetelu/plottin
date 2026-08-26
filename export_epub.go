package main

import (
	"fmt"
	"html"
	"os"
	"path/filepath"
	"strings"

	epub "github.com/bmaupin/go-epub"
)

func exportEPUB(book *exportBook, path string, opts ExportOptions) error {
	e := epub.NewEpub(book.Title)
	if book.Author != "" {
		e.SetAuthor(book.Author)
	}

	for _, ch := range book.Chapters {
		var htmlBuf strings.Builder
		if opts.IncludeChapterTitles {
			htmlBuf.WriteString(fmt.Sprintf(
				`<p style="font-size:0.85em;letter-spacing:0.12em;color:#888;margin-bottom:0.4em;">CHAPTER %d</p>`,
				ch.Number,
			))
			htmlBuf.WriteString(fmt.Sprintf(
				`<h1 style="font-size:1.8em;margin-bottom:1em;">%s</h1>`,
				html.EscapeString(ch.Title),
			))
		}
		htmlBuf.WriteString(renderEPUBBlocks(e, ch.Blocks, opts.IncludeImages))
		title := ch.Title
		if title == "" {
			title = fmt.Sprintf("Chapter %d", ch.Number)
		}
		if _, err := e.AddSection(htmlBuf.String(), title, "", ""); err != nil {
			return fmt.Errorf("add section %q: %w", title, err)
		}
	}

	if err := e.Write(path); err != nil {
		return fmt.Errorf("write epub: %w", err)
	}
	return nil
}

func renderEPUBBlocks(e *epub.Epub, blocks []exportBlock, includeImages bool) string {
	var out strings.Builder
	inList := ""
	closeListIfOpen := func() {
		if inList != "" {
			out.WriteString("</" + inList + ">")
			inList = ""
		}
	}
	for _, b := range blocks {
		if b.Type != blockListBullet && b.Type != blockListNumber {
			closeListIfOpen()
		}
		switch b.Type {
		case blockH1:
			out.WriteString("<h1>" + runsToHTML(b.Runs) + "</h1>")
		case blockH2:
			out.WriteString("<h2>" + runsToHTML(b.Runs) + "</h2>")
		case blockH3:
			out.WriteString("<h3>" + runsToHTML(b.Runs) + "</h3>")
		case blockQuote:
			out.WriteString(`<blockquote style="margin:1em 2em;font-style:italic;color:#555;">` + runsToHTML(b.Runs) + "</blockquote>")
		case blockListBullet:
			if inList != "ul" {
				closeListIfOpen()
				out.WriteString("<ul>")
				inList = "ul"
			}
			out.WriteString("<li>" + runsToHTML(b.Runs) + "</li>")
		case blockListNumber:
			if inList != "ol" {
				closeListIfOpen()
				out.WriteString("<ol>")
				inList = "ol"
			}
			out.WriteString("<li>" + runsToHTML(b.Runs) + "</li>")
		case blockImage:
			if !includeImages {
				continue
			}
			imgPath, err := addImageFromDataURL(e, b.URL)
			if err == nil {
				out.WriteString(fmt.Sprintf(`<p><img src="%s" alt="" style="max-width:100%%;height:auto;"/></p>`, imgPath))
			}
		default:
			out.WriteString(`<p style="margin:0 0 0.8em;">` + runsToHTML(b.Runs) + "</p>")
		}
	}
	closeListIfOpen()
	return out.String()
}

func runsToHTML(runs []exportRun) string {
	var out strings.Builder
	for _, r := range runs {
		if r.Text == "" {
			continue
		}
		text := html.EscapeString(r.Text)
		if r.Bold {
			text = "<strong>" + text + "</strong>"
		}
		if r.Italic {
			text = "<em>" + text + "</em>"
		}
		if r.Underline {
			text = "<u>" + text + "</u>"
		}
		if r.Strikethrough {
			text = "<s>" + text + "</s>"
		}
		if r.Code {
			text = "<code>" + text + "</code>"
		}
		out.WriteString(text)
	}
	return out.String()
}

func addImageFromDataURL(e *epub.Epub, dataURLStr string) (string, error) {
	raw, mime, err := decodeDataURL(dataURLStr)
	if err != nil {
		return "", err
	}
	ext := ".png"
	if strings.Contains(mime, "jpeg") || strings.Contains(mime, "jpg") {
		ext = ".jpg"
	} else if strings.Contains(mime, "gif") {
		ext = ".gif"
	} else if strings.Contains(mime, "webp") {
		ext = ".webp"
	}
	tmp, err := os.CreateTemp("", "plottin-img-*"+ext)
	if err != nil {
		return "", err
	}
	if _, err := tmp.Write(raw); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return "", err
	}
	tmp.Close()
	// Note: we don't os.Remove(tmp.Name()) here because go-epub may need to
	// read the file until Write() is called. It's a temp file — the OS will
	// clean it up eventually. For correctness we could track and delete after
	// Write, but that's a wrapper-level change.
	return e.AddImage(tmp.Name(), filepath.Base(tmp.Name()))
}
