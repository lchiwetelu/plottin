import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { forwardRef, useEffect, useRef } from 'react'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  total: number
  activeIndex: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

const FindBar = forwardRef<HTMLInputElement, Props>(function FindBar(
  { query, onQueryChange, total, activeIndex, onNext, onPrev, onClose },
  ref,
) {
  const localRef = useRef<HTMLInputElement>(null)
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || localRef

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const label = total === 0 ? (query ? 'No matches' : '') : `${activeIndex + 1} of ${total}`

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-night-500/60 dark:bg-night-800/95">
      <input
        ref={inputRef}
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (e.shiftKey) onPrev()
            else onNext()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        placeholder="Find in chapter…"
        aria-label="Find in chapter"
        autoComplete="off"
        spellCheck={false}
        className="w-56 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-800 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 dark:border-night-500 dark:bg-night-700 dark:text-neutral-100"
      />
      <span className="min-w-[70px] text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <button
        type="button"
        onClick={onPrev}
        disabled={total === 0}
        aria-label="Previous match"
        title="Previous (Shift+Enter)"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-night-600"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={total === 0}
        aria-label="Next match"
        title="Next (Enter)"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-night-600"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close find"
        title="Close (Esc)"
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-night-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
})

export default FindBar
