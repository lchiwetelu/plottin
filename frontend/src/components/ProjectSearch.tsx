import { BookOpen, LayoutTemplate, Link as LinkIcon, NotebookPen, Type, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GetMoodboards } from '../../wailsjs/go/main/App'
import type { main } from '../../wailsjs/go/models'
import { useNav } from '../nav/NavContext'
import SearchInput from './SearchInput'

type Props = {
  projectId: string
  detail: main.ProjectDetail | null
  onSelectChapter: (id: string) => void
}

type ResultKind = 'chapter' | 'moodboard' | 'character' | 'research' | 'note'

type Result = {
  key: string
  kind: ResultKind
  title: string
  subtitle?: string
  onSelect: () => void
}

type ContentMatch = {
  key: string
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  snippet: string
  matchStart: number
  matchLength: number
  onSelect: () => void
}

const CONTEXT_BEFORE = 32
const CONTEXT_AFTER = 48
const MAX_MATCHES_PER_CHAPTER = 3

function extractPlainText(content: unknown): string {
  if (content == null) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(extractPlainText).join('\n')
  }
  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>
    if (typeof obj.text === 'string') return obj.text
    if (obj.children) return extractPlainText(obj.children)
  }
  return ''
}

function findMatchesInChapter(
  ch: main.Chapter,
  q: string,
  selectChapter: (id: string) => void,
): ContentMatch[] {
  const text = extractPlainText(ch.content)
  if (!text) return []
  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const out: ContentMatch[] = []
  let i = 0
  let found = 0
  while (found < MAX_MATCHES_PER_CHAPTER) {
    const idx = lower.indexOf(needle, i)
    if (idx === -1) break
    let s = Math.max(0, idx - CONTEXT_BEFORE)
    let e = Math.min(text.length, idx + needle.length + CONTEXT_AFTER)
    let snippet = text.slice(s, e).replace(/\s+/g, ' ').trim()
    let matchStart = idx - s
    // If we stripped leading whitespace during trim/normalize, recompute matchStart via a direct substring search.
    const foundInSnippet = snippet.toLowerCase().indexOf(needle)
    if (foundInSnippet !== -1) matchStart = foundInSnippet
    if (s > 0) {
      snippet = '…' + snippet
      matchStart += 1
    }
    if (e < text.length) {
      snippet = snippet + '…'
    }
    out.push({
      key: `content-${ch.id}-${idx}`,
      chapterId: ch.id,
      chapterNumber: ch.number,
      chapterTitle: ch.title,
      snippet,
      matchStart,
      matchLength: needle.length,
      onSelect: () => selectChapter(ch.id),
    })
    found += 1
    i = idx + needle.length
  }
  return out
}

export default function ProjectSearch({ projectId, detail, onSelectChapter }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [moodboards, setMoodboards] = useState<main.Moodboard[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const { toMoodboard } = useNav()

  useEffect(() => {
    GetMoodboards(projectId).then(m => setMoodboards(m ?? [])).catch(() => setMoodboards([]))
  }, [projectId])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selectAndReset = (chapterId: string) => {
    onSelectChapter(chapterId)
    setFocused(false)
    setQuery('')
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !detail) return {
      chapters: [] as Result[],
      moodboards: [] as Result[],
      characters: [] as Result[],
      research: [] as Result[],
      notes: [] as Result[],
      contentMatches: [] as ContentMatch[],
    }

    const chapters: Result[] = detail.chapters
      .filter(c => c.title.toLowerCase().includes(q))
      .map(c => ({
        key: 'ch-' + c.id,
        kind: 'chapter',
        title: c.title,
        subtitle: `Chapter ${c.number}`,
        onSelect: () => selectAndReset(c.id),
      }))

    const mbs: Result[] = moodboards
      .filter(m => m.title.toLowerCase().includes(q))
      .map(m => ({
        key: 'mb-' + m.id,
        kind: 'moodboard',
        title: m.title,
        subtitle: 'Moodboard',
        onSelect: () => {
          toMoodboard(projectId, m.id)
          setFocused(false)
          setQuery('')
        },
      }))

    const characters: Result[] = detail.characters
      .filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q),
      )
      .map(c => ({
        key: 'char-' + c.id,
        kind: 'character',
        title: c.name,
        subtitle: c.role || 'Character',
        onSelect: () => {
          setFocused(false)
        },
      }))

    const research: Result[] = detail.research
      .filter(r => r.title.toLowerCase().includes(q) || (r.url ?? '').toLowerCase().includes(q))
      .map(r => ({
        key: 'res-' + r.id,
        kind: 'research',
        title: r.title,
        subtitle: r.url,
        onSelect: () => {
          if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer')
          setFocused(false)
        },
      }))

    const notes: Result[] = detail.notes
      .filter(n => n.title.toLowerCase().includes(q) || (n.body ?? '').toLowerCase().includes(q))
      .map(n => ({
        key: 'note-' + n.id,
        kind: 'note',
        title: n.title,
        subtitle: n.kind === 'voice' ? 'Voice note' : n.body ? n.body.slice(0, 60) : 'Note',
        onSelect: () => {
          setFocused(false)
        },
      }))

    const contentMatches: ContentMatch[] = detail.chapters.flatMap(ch =>
      findMatchesInChapter(ch, q, selectAndReset),
    )

    return { chapters, moodboards: mbs, characters, research, notes, contentMatches }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, detail, moodboards, projectId, toMoodboard])

  const totalCount =
    results.chapters.length +
    results.moodboards.length +
    results.characters.length +
    results.research.length +
    results.notes.length +
    results.contentMatches.length

  const showDropdown = focused && query.trim().length > 0

  return (
    <div ref={wrapRef} className="relative">
      <SearchInput
        value={query}
        onChange={setQuery}
        onFocus={() => setFocused(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setFocused(false)
            setQuery('')
          }
        }}
        placeholder="Search manuscript and moodboards…"
        ariaLabel="Search manuscript and moodboards"
      />
      {showDropdown && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[360px] max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700">
          {totalCount === 0 ? (
            <div className="px-3 py-4 text-xs text-neutral-500 dark:text-neutral-400">
              No matches for “{query.trim()}”.
            </div>
          ) : (
            <>
              <Group title="CHAPTERS" items={results.chapters} icon={<BookOpen className="h-3.5 w-3.5" />} />
              <ContentGroup matches={results.contentMatches} />
              <Group title="MOODBOARDS" items={results.moodboards} icon={<LayoutTemplate className="h-3.5 w-3.5" />} />
              <Group title="CHARACTERS" items={results.characters} icon={<Users className="h-3.5 w-3.5" />} />
              <Group title="RESEARCH" items={results.research} icon={<LinkIcon className="h-3.5 w-3.5" />} />
              <Group title="NOTES" items={results.notes} icon={<NotebookPen className="h-3.5 w-3.5" />} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Group({
  title,
  items,
  icon,
}: {
  title: string
  items: Result[]
  icon: React.ReactNode
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-1">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {title}
      </div>
      <ul>
        {items.map(r => (
          <li key={r.key}>
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                r.onSelect()
              }}
              className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-night-600"
            >
              <span className="mt-0.5 shrink-0 text-accent-500">{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-neutral-800 dark:text-neutral-100">{r.title}</div>
                {r.subtitle && (
                  <div className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                    {r.subtitle}
                  </div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ContentGroup({ matches }: { matches: ContentMatch[] }) {
  if (matches.length === 0) return null
  return (
    <div className="mb-1">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        IN MANUSCRIPT
      </div>
      <ul>
        {matches.map(m => {
          const before = m.snippet.slice(0, m.matchStart)
          const hit = m.snippet.slice(m.matchStart, m.matchStart + m.matchLength)
          const after = m.snippet.slice(m.matchStart + m.matchLength)
          return (
            <li key={m.key}>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  m.onSelect()
                }}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-night-600"
              >
                <span className="mt-0.5 shrink-0 text-accent-500">
                  <Type className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Ch {m.chapterNumber} · {m.chapterTitle}
                  </div>
                  <div className="mt-0.5 truncate text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {before}
                    <mark className="rounded bg-accent-500/20 px-0.5 text-accent-600 dark:text-accent-400">
                      {hit}
                    </mark>
                    {after}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
