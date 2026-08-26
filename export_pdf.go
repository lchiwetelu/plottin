package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"strings"

	"github.com/go-pdf/fpdf"
)

func exportPDF(book *exportBook, path string, opts ExportOptions) error {
	pdf := fpdf.New("P", "pt", "Letter", "")
	pdf.SetMargins(72, 72, 72) // 1 inch
	pdf.SetAutoPageBreak(true, 72)

	// Built-in PDF fonts use WinAnsi (cp1252); translate UTF-8 through this
	// so smart quotes, em-dashes, ellipsis, etc. render correctly.
	tr := pdf.UnicodeTranslatorFromDescriptor("")

	fontFamily := pdfFont(opts.FontFamily)
	baseSize := float64(opts.FontSize)

	// Cover page.
	pdf.AddPage()
	pdf.SetFont(fontFamily, "B", baseSize*2.6)
	pdf.CellFormat(0, baseSize*3, tr(book.Title), "", 1, "C", false, 0, "")
	if book.Genre != "" {
		pdf.SetFont(fontFamily, "I", baseSize*1.1)
		pdf.CellFormat(0, baseSize*1.6, tr(book.Genre), "", 1, "C", false, 0, "")
	}

	for _, ch := range book.Chapters {
		pdf.AddPage()
		if opts.IncludeChapterTitles {
			pdf.SetFont(fontFamily, "", baseSize*0.85)
			pdf.SetTextColor(120, 120, 120)
			pdf.CellFormat(0, baseSize*1.5, fmt.Sprintf("CHAPTER %d", ch.Number), "", 1, "L", false, 0, "")
			pdf.SetTextColor(0, 0, 0)
			pdf.SetFont(fontFamily, "B", baseSize*2)
			pdf.MultiCell(0, baseSize*2.4, tr(ch.Title), "", "L", false)
			pdf.Ln(baseSize)
		}
		renderPDFBlocks(pdf, ch.Blocks, fontFamily, baseSize, opts.IncludeImages, tr)
	}

	return pdf.OutputFileAndClose(path)
}

func pdfFont(family string) string {
	switch family {
	case "sans":
		return "Helvetica"
	case "mono":
		return "Courier"
	default:
		return "Times"
	}
}

func renderPDFBlocks(pdf *fpdf.Fpdf, blocks []exportBlock, fontFamily string, baseSize float64, includeImages bool, tr func(string) string) {
	for _, b := range blocks {
		switch b.Type {
		case blockH1:
			pdf.SetFont(fontFamily, "B", baseSize*1.8)
			pdf.MultiCell(0, baseSize*2.2, tr(plainText(b.Runs)), "", "L", false)
			pdf.Ln(baseSize * 0.4)
		case blockH2:
			pdf.SetFont(fontFamily, "B", baseSize*1.5)
			pdf.MultiCell(0, baseSize*1.9, tr(plainText(b.Runs)), "", "L", false)
			pdf.Ln(baseSize * 0.3)
		case blockH3:
			pdf.SetFont(fontFamily, "B", baseSize*1.25)
			pdf.MultiCell(0, baseSize*1.6, tr(plainText(b.Runs)), "", "L", false)
			pdf.Ln(baseSize * 0.3)
		case blockQuote:
			pdf.SetFont(fontFamily, "I", baseSize)
			pdf.SetLeftMargin(96)
			pdf.MultiCell(0, baseSize*1.4, tr(plainText(b.Runs)), "", "L", false)
			pdf.SetLeftMargin(72)
			pdf.Ln(baseSize * 0.4)
		case blockListBullet:
			pdf.SetFont(fontFamily, "", baseSize)
			pdf.MultiCell(0, baseSize*1.35, tr("• "+plainText(b.Runs)), "", "L", false)
		case blockListNumber:
			pdf.SetFont(fontFamily, "", baseSize)
			pdf.MultiCell(0, baseSize*1.35, tr("• "+plainText(b.Runs)), "", "L", false)
		case blockImage:
			if !includeImages {
				continue
			}
			if err := placePDFImage(pdf, b.URL); err != nil {
				// Fallback: note the image
				pdf.SetFont(fontFamily, "I", baseSize*0.8)
				pdf.SetTextColor(150, 150, 150)
				pdf.MultiCell(0, baseSize*1.2, tr("[image omitted]"), "", "L", false)
				pdf.SetTextColor(0, 0, 0)
			}
			pdf.Ln(baseSize * 0.6)
		default: // paragraph
			pdf.SetFont(fontFamily, "", baseSize)
			pdf.MultiCell(0, baseSize*1.4, tr(plainText(b.Runs)), "", "L", false)
			pdf.Ln(baseSize * 0.35)
		}
	}
}

func plainText(runs []exportRun) string {
	var b strings.Builder
	for _, r := range runs {
		b.WriteString(r.Text)
	}
	return b.String()
}

func placePDFImage(pdf *fpdf.Fpdf, dataURL string) error {
	raw, mime, err := decodeDataURL(dataURL)
	if err != nil {
		return err
	}
	imgType := "PNG"
	if strings.Contains(mime, "jpeg") || strings.Contains(mime, "jpg") {
		imgType = "JPG"
	}
	// Decode to get dimensions so we can size sensibly.
	imgCfg, _, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil {
		return err
	}
	maxWidth := 468.0 // 8.5in page - 2in margins => 6.5in => 468pt
	scale := maxWidth / float64(imgCfg.Width)
	if scale > 1 {
		scale = 1
	}
	imgName := fmt.Sprintf("img-%d", pdf.PageNo()*1000+len(raw)%1000)
	opts := fpdf.ImageOptions{ImageType: imgType, ReadDpi: true}
	pdf.RegisterImageOptionsReader(imgName, opts, bytes.NewReader(raw))
	pdf.ImageOptions(imgName, -1, pdf.GetY(), float64(imgCfg.Width)*scale, float64(imgCfg.Height)*scale, true, opts, 0, "")
	return nil
}

func decodeDataURL(url string) (raw []byte, mime string, err error) {
	if !strings.HasPrefix(url, "data:") {
		return nil, "", fmt.Errorf("not a data URL")
	}
	comma := strings.Index(url, ",")
	if comma < 0 {
		return nil, "", fmt.Errorf("malformed data URL")
	}
	header := url[5:comma]
	body := url[comma+1:]
	parts := strings.Split(header, ";")
	mime = parts[0]
	if len(parts) > 1 && parts[len(parts)-1] == "base64" {
		raw, err = base64.StdEncoding.DecodeString(body)
	} else {
		raw = []byte(body)
	}
	return raw, mime, err
}
