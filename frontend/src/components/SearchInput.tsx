import { Search, X } from 'lucide-react'
import { forwardRef } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  onFocus?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  autoFocus?: boolean
  ariaLabel?: string
}

const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { value, onChange, onFocus, onKeyDown, placeholder, autoFocus, ariaLabel = 'Search' },
  ref,
) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-full border border-neutral-200 bg-white/70 py-2 pl-9 pr-8 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 dark:border-night-500 dark:bg-night-700/70 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-night-600 dark:hover:text-neutral-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
})

export default SearchInput
