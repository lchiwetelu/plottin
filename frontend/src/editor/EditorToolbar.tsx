import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import isHotkey from 'is-hotkey'
import {
  Bold,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Quote,
  Search,
  Strikethrough,
  Underline,
} from 'lucide-react'
import { useRef } from 'react'
import { useSlate } from 'slate-react'
import { fontLabel, FONTS, FONT_SIZES } from './fonts'
import { insertImage, isBlockActive, isMarkActive, toggleBlock, toggleMark } from './helpers'
import type { BlockFormat, MarkFormat } from './types'

export const HOTKEYS: Record<string, MarkFormat> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+shift+s': 'strikethrough',
  'mod+`': 'code',
}

export function handleEditorHotkey(editor: any, event: React.KeyboardEvent) {
  for (const hotkey of Object.keys(HOTKEYS)) {
    if (isHotkey(hotkey, event.nativeEvent)) {
      event.preventDefault()
      toggleMark(editor, HOTKEYS[hotkey])
      return
    }
  }
}

type Props = {
  font: string
  onFontChange: (value: string) => void
  fontSize: number
  onFontSizeChange: (value: number) => void
  onFind?: () => void
}

export default function EditorToolbar({ font, onFontChange, fontSize, onFontSizeChange, onFind }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-white/95 px-2 py-1.5 backdrop-blur dark:border-night-500/60 dark:bg-night-800/95">
      <MarkButton format="bold" icon={<Bold className="h-4 w-4" />} label="Bold" />
      <MarkButton format="italic" icon={<Italic className="h-4 w-4" />} label="Italic" />
      <MarkButton format="underline" icon={<Underline className="h-4 w-4" />} label="Underline" />
      <MarkButton format="strikethrough" icon={<Strikethrough className="h-4 w-4" />} label="Strikethrough" />
      <MarkButton format="code" icon={<Code className="h-4 w-4" />} label="Inline code" />
      <Divider />
      <BlockButton format="heading-one" icon={<Heading1 className="h-4 w-4" />} label="Heading 1" />
      <BlockButton format="heading-two" icon={<Heading2 className="h-4 w-4" />} label="Heading 2" />
      <BlockButton format="heading-three" icon={<Heading3 className="h-4 w-4" />} label="Heading 3" />
      <BlockButton format="block-quote" icon={<Quote className="h-4 w-4" />} label="Quote" />
      <BlockButton format="bulleted-list" icon={<List className="h-4 w-4" />} label="Bulleted list" />
      <BlockButton format="numbered-list" icon={<ListOrdered className="h-4 w-4" />} label="Numbered list" />
      <Divider />
      <ImageInsert fileRef={fileRef} />
      {onFind && (
        <button
          type="button"
          onClick={onFind}
          title="Find in chapter (⌘F)"
          aria-label="Find in chapter"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600"
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <FontPicker value={font} onChange={onFontChange} />
        <FontSizePicker value={fontSize} onChange={onFontSizeChange} />
      </div>
    </div>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-night-500" />
}

function MarkButton({
  format,
  icon,
  label,
}: {
  format: MarkFormat
  icon: React.ReactNode
  label: string
}) {
  const editor = useSlate()
  const active = isMarkActive(editor, format)
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={e => {
        e.preventDefault()
        toggleMark(editor, format)
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-accent-500/15 text-accent-500'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600'
      }`}
    >
      {icon}
    </button>
  )
}

function BlockButton({
  format,
  icon,
  label,
}: {
  format: BlockFormat
  icon: React.ReactNode
  label: string
}) {
  const editor = useSlate()
  const active = isBlockActive(editor, format)
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={e => {
        e.preventDefault()
        toggleBlock(editor, format)
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-accent-500/15 text-accent-500'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600'
      }`}
    >
      {icon}
    </button>
  )
}

function ImageInsert({ fileRef }: { fileRef: React.RefObject<HTMLInputElement | null> }) {
  const editor = useSlate()

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      insertImage(editor, url)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <button
        type="button"
        title="Insert image"
        aria-label="Insert image"
        onMouseDown={e => {
          e.preventDefault()
          fileRef.current?.click()
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
    </>
  )
}

function FontSizePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="Font size"
          aria-label="Font size"
          className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600"
        >
          <span className="tabular-nums">{value}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 max-h-72 min-w-[80px] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
        >
          {FONT_SIZES.map(s => (
            <DropdownMenu.Item
              key={s}
              onSelect={() => onChange(s)}
              className="flex cursor-default items-center justify-between rounded-lg px-3 py-1.5 outline-none data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-night-600"
            >
              <span className="tabular-nums text-neutral-800 dark:text-neutral-100">{s}</span>
              {s === value && <span className="text-xs text-accent-500">•</span>}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const currentLabel = fontLabel(value)
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600"
        >
          <span style={{ fontFamily: value }}>Aa</span>
          <span className="text-xs">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 min-w-[180px] rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
        >
          {FONTS.map(f => (
            <DropdownMenu.Item
              key={f.value}
              onSelect={() => onChange(f.value)}
              className="flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-night-600"
            >
              <span style={{ fontFamily: f.value }} className="text-base">
                {f.label}
              </span>
              {f.value === value && <span className="text-xs text-accent-500">•</span>}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
