import { BookOpenText, FileText, Loader2, ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ExportProject } from '../../../wailsjs/go/main/App'
import Modal, { ModalCancel, ModalField, ModalPrimary, ModalSelect } from '../ui/Modal'
import { useToast } from '../ui/Toast'

type Format = 'pdf' | 'epub' | 'docx'
type FontFamily = 'serif' | 'sans' | 'mono'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectTitle: string
}

const FORMATS: {
  key: Format
  label: string
  hint: string
  icon: React.ReactNode
}[] = [
  {
    key: 'pdf',
    label: 'PDF',
    hint: 'Portable, prints beautifully.',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    key: 'epub',
    label: 'EPUB',
    hint: 'Kindle & e-readers.',
    icon: <BookOpenText className="h-4 w-4" />,
  },
  {
    key: 'docx',
    label: 'DOCX',
    hint: 'Editable in Word.',
    icon: <ScrollText className="h-4 w-4" />,
  },
]

const FONT_SIZES = [10, 11, 12, 13, 14, 16]

export default function ExportDialog({ open, onOpenChange, projectId, projectTitle }: Props) {
  const [format, setFormat] = useState<Format>('pdf')
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif')
  const [fontSize, setFontSize] = useState(12)
  const [includeChapterTitles, setIncludeChapterTitles] = useState(true)
  const [includeImages, setIncludeImages] = useState(true)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open) {
      setFormat('pdf')
      setFontFamily('serif')
      setFontSize(12)
      setIncludeChapterTitles(true)
      setIncludeImages(true)
      setBusy(false)
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    try {
      const result = await ExportProject(projectId, {
        format,
        fontFamily,
        fontSize,
        includeImages,
        includeChapterTitles,
      })
      if (result?.canceled) {
        return
      }
      if (result?.success) {
        toast('Exported: ' + result.path)
        onOpenChange(false)
      } else {
        toast('Export failed' + (result?.message ? ': ' + result.message : ''), {
          variant: 'error',
        })
      }
    } catch (e: any) {
      toast('Export failed: ' + (e?.message ?? 'unknown error'), { variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Export “${projectTitle}”`}
      description="Choose a format and how the manuscript should look."
      size="lg"
      footer={
        <>
          <ModalCancel onClick={() => onOpenChange(false)} />
          <ModalPrimary
            label={busy ? 'Exporting…' : 'Export'}
            onClick={submit}
            disabled={busy}
          />
        </>
      }
    >
      <div className="space-y-5">
        <ModalField label="FORMAT">
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map(f => {
              const active = f.key === format
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-neutral-200 hover:border-neutral-300 dark:border-night-500 dark:hover:border-night-400'
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md ${active ? 'bg-accent-500 text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-night-600 dark:text-neutral-300'}`}>
                    {f.icon}
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {f.label}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{f.hint}</div>
                </button>
              )
            })}
          </div>
        </ModalField>

        <div className="grid grid-cols-2 gap-4">
          <ModalField label="FONT">
            <ModalSelect value={fontFamily} onChange={e => setFontFamily(e.target.value as FontFamily)}>
              <option value="serif">Serif (Georgia / Times)</option>
              <option value="sans">Sans-serif (Helvetica)</option>
              <option value="mono">Monospace (Courier)</option>
            </ModalSelect>
          </ModalField>
          <ModalField label="FONT SIZE">
            <ModalSelect value={fontSize} onChange={e => setFontSize(Number(e.target.value))}>
              {FONT_SIZES.map(s => (
                <option key={s} value={s}>
                  {s} pt
                </option>
              ))}
            </ModalSelect>
          </ModalField>
        </div>

        <div className="space-y-2">
          <CheckboxRow
            id="include-titles"
            label="Include chapter titles"
            checked={includeChapterTitles}
            onChange={setIncludeChapterTitles}
          />
          <CheckboxRow
            id="include-images"
            label={
              <>
                Include images{' '}
                {format === 'docx' && (
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    (not supported in DOCX)
                  </span>
                )}
              </>
            }
            checked={includeImages && format !== 'docx'}
            disabled={format === 'docx'}
            onChange={setIncludeImages}
          />
        </div>

        {busy && (
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating your file…
          </div>
        )}
      </div>
    </Modal>
  )
}

function CheckboxRow({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: React.ReactNode
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-night-600'} text-neutral-800 dark:text-neutral-100`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-accent-500 focus:ring-accent-500/30 dark:border-night-400"
      />
      <span>{label}</span>
    </label>
  )
}
