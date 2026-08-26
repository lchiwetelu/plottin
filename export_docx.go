package main

import (
	"archive/zip"
	"encoding/xml"
	"fmt"
	"html"
	"os"
	"strings"
)

// exportDOCX writes a minimal .docx (OOXML) with headings + paragraphs.
// Images are not embedded (DOCX image relationships are heavy; use PDF/EPUB for that).
func exportDOCX(book *exportBook, path string, opts ExportOptions) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	zw := zip.NewWriter(f)
	defer zw.Close()

	if err := writeZipFile(zw, "[Content_Types].xml", contentTypesXML); err != nil {
		return err
	}
	if err := writeZipFile(zw, "_rels/.rels", packageRelsXML); err != nil {
		return err
	}
	if err := writeZipFile(zw, "word/_rels/document.xml.rels", docRelsXML); err != nil {
		return err
	}

	doc := buildDocumentXML(book, opts)
	return writeZipFile(zw, "word/document.xml", doc)
}

func writeZipFile(zw *zip.Writer, name, body string) error {
	w, err := zw.Create(name)
	if err != nil {
		return err
	}
	_, err = w.Write([]byte(body))
	return err
}

const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const packageRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const docRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`

func docxFont(family string) string {
	switch family {
	case "sans":
		return "Helvetica Neue"
	case "mono":
		return "Courier New"
	default:
		return "Georgia"
	}
}

func buildDocumentXML(book *exportBook, opts ExportOptions) string {
	fontName := docxFont(opts.FontFamily)
	halfPoints := opts.FontSize * 2

	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` + "\n")
	b.WriteString(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`)

	// Cover.
	b.WriteString(docxParagraph(book.Title, "Title", fontName, halfPoints*2, true, false, "center"))
	if book.Genre != "" {
		b.WriteString(docxParagraph(book.Genre, "Subtitle", fontName, halfPoints, false, true, "center"))
	}
	b.WriteString(docxPageBreak())

	for i, ch := range book.Chapters {
		if opts.IncludeChapterTitles {
			b.WriteString(docxParagraph(fmt.Sprintf("CHAPTER %d", ch.Number), "", fontName, halfPoints*3/4, false, false, "left"))
			b.WriteString(docxParagraph(ch.Title, "Heading1", fontName, halfPoints*2, true, false, "left"))
		}
		for _, block := range ch.Blocks {
			b.WriteString(renderDOCXBlock(block, fontName, halfPoints))
		}
		if i < len(book.Chapters)-1 {
			b.WriteString(docxPageBreak())
		}
	}

	b.WriteString(`</w:body></w:document>`)
	return b.String()
}

func renderDOCXBlock(block exportBlock, fontName string, halfPoints int) string {
	switch block.Type {
	case blockH1:
		return docxParagraph(plainText(block.Runs), "Heading1", fontName, halfPoints*8/5, true, false, "left")
	case blockH2:
		return docxParagraph(plainText(block.Runs), "Heading2", fontName, halfPoints*7/5, true, false, "left")
	case blockH3:
		return docxParagraph(plainText(block.Runs), "Heading3", fontName, halfPoints*6/5, true, false, "left")
	case blockQuote:
		return docxParagraph(plainText(block.Runs), "Quote", fontName, halfPoints, false, true, "left")
	case blockListBullet, blockListNumber:
		return docxParagraph("• "+plainText(block.Runs), "", fontName, halfPoints, false, false, "left")
	case blockImage:
		// Images not embedded — insert a placeholder line.
		return docxParagraph("[image omitted]", "", fontName, halfPoints*4/5, false, true, "left")
	default:
		return docxRichParagraph(block.Runs, fontName, halfPoints)
	}
}

func docxParagraph(text, style, fontName string, halfPoints int, bold, italic bool, align string) string {
	if text == "" {
		return `<w:p/>`
	}
	var pPr strings.Builder
	pPr.WriteString(`<w:pPr>`)
	if style != "" {
		pPr.WriteString(fmt.Sprintf(`<w:pStyle w:val=%q/>`, style))
	}
	if align != "" && align != "left" {
		pPr.WriteString(fmt.Sprintf(`<w:jc w:val=%q/>`, align))
	}
	pPr.WriteString(`</w:pPr>`)

	var rPr strings.Builder
	rPr.WriteString(`<w:rPr>`)
	rPr.WriteString(fmt.Sprintf(`<w:rFonts w:ascii=%q w:hAnsi=%q/>`, fontName, fontName))
	rPr.WriteString(fmt.Sprintf(`<w:sz w:val="%d"/>`, halfPoints))
	if bold {
		rPr.WriteString(`<w:b/>`)
	}
	if italic {
		rPr.WriteString(`<w:i/>`)
	}
	rPr.WriteString(`</w:rPr>`)

	return `<w:p>` + pPr.String() + `<w:r>` + rPr.String() + `<w:t xml:space="preserve">` + escapeXML(text) + `</w:t></w:r></w:p>`
}

func docxRichParagraph(runs []exportRun, fontName string, halfPoints int) string {
	if len(runs) == 0 {
		return `<w:p/>`
	}
	var out strings.Builder
	out.WriteString(`<w:p>`)
	for _, r := range runs {
		if r.Text == "" {
			continue
		}
		out.WriteString(`<w:r><w:rPr>`)
		out.WriteString(fmt.Sprintf(`<w:rFonts w:ascii=%q w:hAnsi=%q/>`, fontName, fontName))
		out.WriteString(fmt.Sprintf(`<w:sz w:val="%d"/>`, halfPoints))
		if r.Bold {
			out.WriteString(`<w:b/>`)
		}
		if r.Italic {
			out.WriteString(`<w:i/>`)
		}
		if r.Underline {
			out.WriteString(`<w:u w:val="single"/>`)
		}
		if r.Strikethrough {
			out.WriteString(`<w:strike/>`)
		}
		out.WriteString(`</w:rPr><w:t xml:space="preserve">` + escapeXML(r.Text) + `</w:t></w:r>`)
	}
	out.WriteString(`</w:p>`)
	return out.String()
}

func docxPageBreak() string {
	return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`
}

func escapeXML(s string) string {
	// html.EscapeString handles &, <, >, ', ". Good enough for w:t content.
	_ = xml.Header
	return html.EscapeString(s)
}
