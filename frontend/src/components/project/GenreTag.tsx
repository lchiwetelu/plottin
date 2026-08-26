import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const PRESET_GENRES = [
  'AUTOBIOGRAPHY',
  'FANTASY',
  'HISTORICAL FICTION',
  'HORROR',
  'LITERARY FICTION',
  'MYSTERY',
  'ROMANCE',
  'SCIENCE FICTION',
  'THRILLER',
  'YOUNG ADULT',
]

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function GenreTag({ value, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const submitCustom = () => {
    const v = customValue.trim().toUpperCase()
    if (v) onChange(v)
    setCustomValue('')
    setCustomOpen(false)
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded text-[11px] font-semibold tracking-wider text-accent-500 hover:opacity-80"
        >
          {value || 'UNTITLED GENRE'}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-40 max-h-72 min-w-[220px] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
        >
          {PRESET_GENRES.map(g => (
            <DropdownMenu.Item
              key={g}
              onSelect={() => onChange(g)}
              className="flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-wider text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 dark:text-neutral-100 dark:data-[highlighted]:bg-night-600"
            >
              {g}
              {g === value && <span className="text-[11px] text-accent-500">•</span>}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-neutral-200 dark:bg-night-500" />
          {customOpen ? (
            <div className="flex items-center gap-1 p-1">
              <input
                autoFocus
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitCustom()
                  else if (e.key === 'Escape') setCustomOpen(false)
                }}
                placeholder="CUSTOM GENRE"
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs uppercase tracking-wider text-neutral-800 focus:border-accent-500 focus:outline-none dark:border-night-500 dark:bg-night-600 dark:text-neutral-100"
              />
              <button
                onClick={submitCustom}
                className="rounded-md bg-accent-500 px-2 py-1 text-xs text-white hover:bg-accent-600"
              >
                Set
              </button>
            </div>
          ) : (
            <DropdownMenu.Item
              onSelect={e => {
                e.preventDefault()
                setCustomOpen(true)
              }}
              className="flex cursor-default items-center rounded-lg px-3 py-2 text-xs text-neutral-500 outline-none data-[highlighted]:bg-neutral-100 dark:text-neutral-400 dark:data-[highlighted]:bg-night-600"
            >
              Custom…
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
