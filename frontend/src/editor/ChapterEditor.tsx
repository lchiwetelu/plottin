import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Editor, Node, Path, Range, Text, type Descendant, type NodeEntry } from 'slate'
import { withHistory } from 'slate-history'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import EditorToolbar, { handleEditorHotkey } from './EditorToolbar'
import FindBar from './FindBar'
import { emptyValue, withImages } from './helpers'
import { Element, Leaf } from './renderers'

type Props = {
  initialValue: Descendant[]
  onChange: (value: Descendant[]) => void
  font: string
  onFontChange: (value: string) => void
  fontSize: number
  onFontSizeChange: (value: number) => void
}

type Match = { path: Path; start: number; end: number }

function findAllMatches(editor: Editor, q: string): Match[] {
  const needle = q.toLowerCase()
  if (!needle) return []
  const results: Match[] = []
  for (const [node, path] of Node.texts(editor)) {
    const text = node.text.toLowerCase()
    let i = 0
    while ((i = text.indexOf(needle, i)) !== -1) {
      results.push({ path, start: i, end: i + needle.length })
      i += needle.length
    }
  }
  return results
}

export default function ChapterEditor({
  initialValue,
  onChange,
  font,
  onFontChange,
  fontSize,
  onFontSizeChange,
}: Props) {
  const editor = useMemo(() => withImages(withHistory(withReact(createEditor()))), [])
  const value = initialValue && initialValue.length > 0 ? initialValue : emptyValue

  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [version, setVersion] = useState(0)

  const matches = useMemo(() => {
    if (!findOpen || !findQuery.trim()) return []
    return findAllMatches(editor, findQuery.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findOpen, findQuery, editor, version])

  const matchesByPath = useMemo(() => {
    const map = new Map<string, Array<Match & { globalIndex: number }>>()
    matches.forEach((m, i) => {
      const key = m.path.join('.')
      const arr = map.get(key) ?? []
      arr.push({ ...m, globalIndex: i })
      map.set(key, arr)
    })
    return map
  }, [matches])

  // Reset the active match when the query changes.
  useEffect(() => {
    setActiveIndex(0)
  }, [findQuery, findOpen])

  // Scroll the active match into view when navigating.
  useEffect(() => {
    if (!findOpen || matches.length === 0) return
    const clampedIndex = Math.min(activeIndex, matches.length - 1)
    const m = matches[clampedIndex]
    if (!m) return
    try {
      const range: Range = {
        anchor: { path: m.path, offset: m.start },
        focus: { path: m.path, offset: m.start },
      }
      const domRange = ReactEditor.toDOMRange(editor, range)
      const el = (domRange.startContainer.parentElement ?? null) as HTMLElement | null
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    } catch {
      // Path may have gone stale between text change and paint; ignore.
    }
  }, [activeIndex, matches, findOpen, editor])

  const decorate = useCallback(
    ([node, path]: NodeEntry): Range[] => {
      if (!Text.isText(node) || matchesByPath.size === 0) return []
      const key = path.join('.')
      const arr = matchesByPath.get(key)
      if (!arr) return []
      return arr.map(m => ({
        anchor: { path, offset: m.start },
        focus: { path, offset: m.end },
        highlight: true,
        activeHighlight: m.globalIndex === activeIndex,
      }))
    },
    [matchesByPath, activeIndex],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault()
      setFindOpen(true)
      return
    }
    if (e.key === 'Escape' && findOpen) {
      e.preventDefault()
      setFindOpen(false)
      setFindQuery('')
      return
    }
    handleEditorHotkey(editor, e)
  }

  const openFind = () => setFindOpen(true)

  return (
    <div className="rounded-xl border border-neutral-200 bg-white dark:border-night-500/60 dark:bg-night-800/60">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={v => {
          setVersion(x => x + 1)
          onChange(v)
        }}
      >
        <EditorToolbar
          font={font}
          onFontChange={onFontChange}
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
          onFind={openFind}
        />
        {findOpen && (
          <FindBar
            query={findQuery}
            onQueryChange={setFindQuery}
            total={matches.length}
            activeIndex={activeIndex}
            onNext={() =>
              setActiveIndex(i => (matches.length === 0 ? 0 : (i + 1) % matches.length))
            }
            onPrev={() =>
              setActiveIndex(i =>
                matches.length === 0 ? 0 : (i - 1 + matches.length) % matches.length,
              )
            }
            onClose={() => {
              setFindOpen(false)
              setFindQuery('')
            }}
          />
        )}
        <div
          className="max-h-[calc(100vh-260px)] overflow-y-auto px-8 py-6"
          style={{ fontFamily: font, fontSize: `${fontSize}px` }}
        >
          <Editable
            renderElement={props => <Element {...props} />}
            renderLeaf={props => <Leaf {...props} />}
            decorate={decorate}
            placeholder="Start writing…"
            spellCheck
            autoFocus
            onKeyDown={handleKeyDown}
            className="min-h-[400px] leading-relaxed text-neutral-800 outline-none dark:text-neutral-100"
          />
        </div>
      </Slate>
    </div>
  )
}
