import { Plus } from 'lucide-react'
import type { main } from '../../../wailsjs/go/models'
import { formatNumber } from '../../lib/formatNumber'
import EditableTitle from '../EditableTitle'
import CoverPicker from './CoverPicker'
import EdgeToggle from './EdgeToggle'
import GenreTag from './GenreTag'

type Props = {
  project: main.Project
  chapters: main.Chapter[]
  selectedId: string | null
  open: boolean
  onToggle: () => void
  onSelect: (id: string) => void
  onGenreChange: (genre: string) => void
  onProjectTitleChange: (title: string) => void
  onProjectTitleSave: (title: string) => void
  onCoverChange: (cover: string) => void
  onCreateChapter: () => void
}

export default function ChaptersRail({
  project,
  chapters,
  selectedId,
  open,
  onToggle,
  onSelect,
  onGenreChange,
  onProjectTitleChange,
  onProjectTitleSave,
  onCoverChange,
  onCreateChapter,
}: Props) {
  if (!open) {
    return (
      <aside className="group relative h-full border-r border-neutral-200 dark:border-night-500/60">
        <EdgeToggle side="left" open={false} onToggle={onToggle} />
      </aside>
    )
  }

  return (
    <aside className="group relative flex h-full flex-col border-r border-neutral-200 dark:border-night-500/60">
      <EdgeToggle side="left" open={true} onToggle={onToggle} />

      <div className="flex items-start gap-3 border-b border-neutral-200 px-6 py-4 dark:border-night-500/60">
        <CoverPicker cover={project.cover} onChange={onCoverChange} />
        <div className="min-w-0 flex-1">
          <EditableTitle
            entityId={project.id}
            title={project.title}
            onChange={onProjectTitleChange}
            onSave={onProjectTitleSave}
            placeholder="Untitled Project"
            displayClassName="font-serif text-sm text-neutral-900 dark:text-neutral-50"
            inputClassName="font-serif text-sm text-neutral-900 dark:text-neutral-50"
          />
          <div className="mt-0.5">
            <GenreTag value={project.genre} onChange={onGenreChange} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-3 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
        <span>CHAPTERS</span>
        <span className="normal-case tracking-normal">{chapters.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        {chapters.length === 0 ? (
          <div className="px-3 py-4 text-xs text-neutral-500 dark:text-neutral-400">
            No chapters yet. Start your first one.
          </div>
        ) : (
          <ul className="space-y-1 pb-4">
            {chapters.map(ch => {
              const active = ch.id === selectedId
              return (
                <li key={ch.id}>
                  <button
                    onClick={() => onSelect(ch.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      active
                        ? 'bg-accent-500/10 text-accent-500'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-night-600'
                    }`}
                  >
                    <div className={`text-sm ${active ? 'font-semibold' : ''}`}>
                      Ch {ch.number}: {ch.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      {formatNumber(ch.wordCount)} words
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-neutral-200 p-3 dark:border-night-500/60">
        <button
          onClick={onCreateChapter}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-600"
        >
          <Plus className="h-4 w-4" />
          New Chapter
        </button>
      </div>
    </aside>
  )
}
