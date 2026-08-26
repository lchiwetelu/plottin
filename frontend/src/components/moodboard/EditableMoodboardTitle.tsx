import { Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  moodboardId: string
  title: string
  onChange: (title: string) => void
  onSave: (title: string) => void
}

export default function EditableMoodboardTitle({ moodboardId, title, onChange, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsEditing(false)
    setDraft(title)
  }, [moodboardId, title])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    const next = draft.trim().length > 0 ? draft : 'Untitled Moodboard'
    onChange(next)
    onSave(next)
    setIsEditing(false)
  }

  const cancel = () => {
    setDraft(title)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        placeholder="Untitled Moodboard"
        aria-label="Moodboard title"
        className="rounded-md bg-transparent px-1 py-0.5 font-serif text-lg text-neutral-900 outline-none ring-2 ring-accent-500/50 placeholder:text-neutral-400 dark:text-neutral-50 dark:placeholder:text-neutral-500"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      className="group inline-flex items-center gap-2 rounded-md px-1 py-0.5 font-serif text-lg text-neutral-900 hover:bg-neutral-100/60 dark:text-neutral-50 dark:hover:bg-night-700/40"
    >
      <span className={title ? '' : 'text-neutral-400 dark:text-neutral-500'}>
        {title || 'Untitled Moodboard'}
      </span>
      <Pencil className="h-3 w-3 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-500" />
    </button>
  )
}
