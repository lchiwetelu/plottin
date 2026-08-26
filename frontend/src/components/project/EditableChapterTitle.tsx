import { Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  chapterId: string
  title: string
  fontFamily: string
  onChange: (title: string) => void
  onSave: (title: string) => void
}

export default function EditableChapterTitle({
  chapterId,
  title,
  fontFamily,
  onChange,
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset edit state whenever the chapter changes
  useEffect(() => {
    setIsEditing(false)
    setDraft(title)
  }, [chapterId, title])

  // Focus + select all on entering edit mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    const next = draft.trim().length > 0 ? draft : 'Untitled Chapter'
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
        placeholder="Untitled Chapter"
        aria-label="Chapter title"
        className="mt-1 w-full rounded-md bg-transparent px-1 py-0.5 font-serif text-4xl text-neutral-900 outline-none ring-2 ring-accent-500/50 placeholder:text-neutral-400 dark:text-neutral-50 dark:placeholder:text-neutral-500"
        style={{ fontFamily }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      className="group mt-1 inline-flex w-full items-center gap-3 rounded-md px-1 py-0.5 text-left font-serif text-4xl text-neutral-900 hover:bg-neutral-100/60 dark:text-neutral-50 dark:hover:bg-night-700/40"
      style={{ fontFamily }}
    >
      <span className={title ? '' : 'text-neutral-400 dark:text-neutral-500'}>
        {title || 'Untitled Chapter'}
      </span>
      <Pencil className="h-4 w-4 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-500" />
    </button>
  )
}
