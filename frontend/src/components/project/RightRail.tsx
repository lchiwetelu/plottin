import { Link as LinkIcon, Mic, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { main } from '../../../wailsjs/go/models'
import { hostFromURL } from '../../lib/hostFromURL'
import AddCharacterModal from './AddCharacterModal'
import AddNoteModal from './AddNoteModal'
import AddResearchModal from './AddResearchModal'
import EdgeToggle from './EdgeToggle'

type Tab = 'characters' | 'research' | 'notes'

type Props = {
  characters: main.Character[]
  research: main.ResearchLink[]
  notes: main.Note[]
  open: boolean
  onToggle: () => void
  onAddCharacter: (input: { name: string; role: string; description: string }) => Promise<void>
  onDeleteCharacter: (id: string) => Promise<void>
  onAddResearch: (input: { title: string; url: string }) => Promise<void>
  onDeleteResearch: (id: string) => Promise<void>
  onAddNote: (input: {
    title: string
    body: string
    kind: string
    audioUrl: string
  }) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
}

export default function RightRail({
  characters,
  research,
  notes,
  open,
  onToggle,
  onAddCharacter,
  onDeleteCharacter,
  onAddResearch,
  onDeleteResearch,
  onAddNote,
  onDeleteNote,
}: Props) {
  const [tab, setTab] = useState<Tab>('characters')
  const [charOpen, setCharOpen] = useState(false)
  const [researchOpen, setResearchOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)

  if (!open) {
    return (
      <aside className="group relative h-full border-l border-neutral-200 dark:border-night-500/60">
        <EdgeToggle side="right" open={false} onToggle={onToggle} />
      </aside>
    )
  }

  return (
    <aside className="group relative flex h-full flex-col border-l border-neutral-200 dark:border-night-500/60">
      <EdgeToggle side="right" open={true} onToggle={onToggle} />

      <div className="flex gap-4 border-b border-neutral-200 px-6 py-3 dark:border-night-500/60">
        <TabBtn label="Characters" active={tab === 'characters'} onClick={() => setTab('characters')} />
        <TabBtn label="Research" active={tab === 'research'} onClick={() => setTab('research')} />
        <TabBtn label="Notes" active={tab === 'notes'} onClick={() => setTab('notes')} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'characters' && (
          <Section
            title="KEY CAST"
            onAdd={() => setCharOpen(true)}
            empty="No characters added yet. Add key cast to keep track of your story."
            hasItems={characters.length > 0}
          >
            <ul className="space-y-4">
              {characters.map(c => (
                <li key={c.id} className="group/item relative">
                  <DeleteBtn onClick={() => onDeleteCharacter(c.id)} label="Delete character" />
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{c.name}</div>
                  <div className="mt-0.5 text-[11px] font-semibold tracking-wider text-accent-500">{c.role}</div>
                  {c.description && (
                    <div className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {c.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tab === 'research' && (
          <Section
            title="RESEARCH LINKS"
            onAdd={() => setResearchOpen(true)}
            empty="No research yet. Add links or notes for your research."
            hasItems={research.length > 0}
          >
            <ul className="space-y-2">
              {research.map(r => (
                <li
                  key={r.id}
                  className="group/item relative flex items-start gap-2 rounded-lg bg-neutral-50 p-3 pr-8 dark:bg-night-600/60"
                >
                  <DeleteBtn onClick={() => onDeleteResearch(r.id)} label="Delete link" />
                  <span className="mt-0.5">
                    <LinkIcon className="h-3.5 w-3.5 text-accent-500" />
                  </span>
                  <div className="min-w-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm text-neutral-800 hover:text-accent-500 dark:text-neutral-100"
                    >
                      {r.title}
                    </a>
                    <div className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                      {hostFromURL(r.url)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tab === 'notes' && (
          <Section
            title="NOTES"
            onAdd={() => setNoteOpen(true)}
            empty="No notes yet. Capture ideas as they come — text or voice."
            hasItems={notes.length > 0}
          >
            <ul className="space-y-3">
              {notes.map(n => (
                <li
                  key={n.id}
                  className="group/item relative rounded-lg bg-neutral-50 p-3 pr-8 dark:bg-night-600/60"
                >
                  <DeleteBtn onClick={() => onDeleteNote(n.id)} label="Delete note" />
                  <div className="flex items-center gap-1.5">
                    {n.kind === 'voice' ? (
                      <Mic className="h-3 w-3 text-accent-500" />
                    ) : (
                      <NotebookPen className="h-3 w-3 text-accent-500" />
                    )}
                    <div className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                      {n.title}
                    </div>
                  </div>
                  {n.kind === 'voice' && n.audioUrl ? (
                    <audio src={n.audioUrl} controls className="mt-2 w-full" />
                  ) : (
                    n.body && (
                      <div className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {n.body}
                      </div>
                    )
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <AddCharacterModal open={charOpen} onOpenChange={setCharOpen} onSubmit={onAddCharacter} />
      <AddResearchModal open={researchOpen} onOpenChange={setResearchOpen} onSubmit={onAddResearch} />
      <AddNoteModal open={noteOpen} onOpenChange={setNoteOpen} onSubmit={onAddNote} />
    </aside>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-2 text-sm font-medium transition-colors ${
        active
          ? 'text-accent-500'
          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
      }`}
    >
      {label}
      {active && <span className="absolute -bottom-[9px] left-0 right-0 h-0.5 rounded-full bg-accent-500" />}
    </button>
  )
}

function DeleteBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover/item:opacity-100"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}

function Section({
  title,
  onAdd,
  empty,
  hasItems,
  children,
}: {
  title: string
  onAdd: () => void
  empty: string
  hasItems: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
          {title}
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent-500 hover:underline"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="mt-3">
        {hasItems ? children : <p className="text-xs text-neutral-500 dark:text-neutral-400">{empty}</p>}
      </div>
    </div>
  )
}
