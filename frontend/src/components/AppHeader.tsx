import { ArrowLeft, Bell, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNav } from '../nav/NavContext'
import { useTheme } from '../theme/useTheme'
import SearchInput from './SearchInput'
import { useToast } from './ui/Toast'

type Props = {
  mode?: 'list' | 'project'
  search?: ReactNode
}

export default function AppHeader({ mode = 'list', search }: Props) {
  const { theme, toggle } = useTheme()
  const { toList, back, route } = useNav()
  const toast = useToast()

  const inSubView = route.name !== 'list'

  return (
    <header className="flex items-center gap-4 px-8 py-5">
      <div className="flex items-center gap-3">
        {inSubView ? (
          <button
            onClick={back}
            aria-label="Back"
            title="Back"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-white shadow-sm hover:bg-accent-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 font-serif text-lg font-semibold text-white shadow-sm">
            P
          </div>
        )}
        <button
          onClick={toList}
          className="font-serif text-xl text-neutral-900 hover:opacity-80 dark:text-neutral-100"
        >
          Plottin
        </button>
      </div>

      <div className="ml-auto w-full max-w-xs">
        {search ?? <DefaultSearch mode={mode} onSubmit={() => toast('Search coming soon')} />}
      </div>

      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/60 dark:text-accent-400 dark:hover:bg-night-600"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <button
        onClick={() => toast('Notifications coming soon')}
        aria-label="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-night-600"
      >
        <Bell className="h-4 w-4" />
      </button>
    </header>
  )
}

function DefaultSearch({ mode, onSubmit }: { mode: 'list' | 'project'; onSubmit: () => void }) {
  const placeholder = mode === 'project' ? 'Search manuscript and moodboards…' : 'Search manuscripts…'
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit() }}>
      <SearchInput value="" onChange={() => {}} placeholder={placeholder} />
    </form>
  )
}
