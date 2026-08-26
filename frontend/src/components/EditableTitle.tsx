import { Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  entityId: string
  title: string
  onChange: (title: string) => void
  onSave: (title: string) => void
  placeholder?: string
  fontFamily?: string
  displayClassName?: string
  inputClassName?: string
  pencilSize?: 'sm' | 'md'
}

export default function EditableTitle({
  entityId,
  title,
  onChange,
  onSave,
  placeholder = 'Untitled',
  fontFamily,
  displayClassName = 'font-serif text-lg text-neutral-900 dark:text-neutral-50',
  inputClassName = 'font-serif text-lg text-neutral-900 dark:text-neutral-50',
  pencilSize = 'sm',
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsEditing(false)
    setDraft(title)
  }, [entityId, title])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commit = () => {
    const next = draft.trim().length > 0 ? draft : placeholder
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
        placeholder={placeholder}
        aria-label="Title"
        className={`${inputClassName} w-full rounded-md bg-transparent px-1 py-0.5 outline-none ring-2 ring-accent-500/50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500`}
        style={fontFamily ? { fontFamily } : undefined}
      />
    )
  }

  const pencilCls = pencilSize === 'md' ? 'h-4 w-4' : 'h-3 w-3'

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      className={`group inline-flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-neutral-100/60 dark:hover:bg-night-700/40 ${displayClassName}`}
      style={fontFamily ? { fontFamily } : undefined}
    >
      <span className={`min-w-0 truncate ${title ? '' : 'text-neutral-400 dark:text-neutral-500'}`}>
        {title || placeholder}
      </span>
      <Pencil
        className={`${pencilCls} shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-neutral-500`}
      />
    </button>
  )
}
