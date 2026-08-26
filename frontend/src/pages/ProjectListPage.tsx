import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import ProjectList from '../components/ProjectList'
import SearchInput from '../components/SearchInput'
import WritersDesk from '../components/WritersDesk'

export default function ProjectListPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen bg-ink-50 text-neutral-900 dark:bg-night-900 dark:text-neutral-100">
      <AppHeader
        mode="list"
        search={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search manuscripts…"
            ariaLabel="Search manuscripts"
          />
        }
      />
      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_320px] gap-8 px-8 pb-16 pt-4">
        <ProjectList filter={query} />
        <WritersDesk />
      </main>
    </div>
  )
}
