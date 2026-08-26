import { NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react'
import { ExternalLink, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'
import { SideHandles } from './TextNode'

type LinkData = { title?: string; url?: string }

export default function LinkNode({ id, data, selected }: NodeProps) {
  const d = data as LinkData
  const [title, setTitle] = useState(d.title ?? 'Untitled link')
  const [url, setUrl] = useState(d.url ?? 'https://')
  const { setNodes } = useReactFlow()

  const commit = () => {
    setNodes(nodes =>
      nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, title, url } } : n,
      ),
    )
  }

  return (
    <div
      className={`h-full min-h-[100px] min-w-[220px] rounded-xl border bg-white p-3 shadow-sm dark:bg-night-700 ${
        selected
          ? 'border-accent-500 shadow-md'
          : 'border-neutral-200 dark:border-night-500'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={100}
        color="#f97316"
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />
      <SideHandles />
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-500/15 text-accent-500">
          <LinkIcon className="h-3.5 w-3.5" />
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={commit}
          placeholder="Link title"
          className="w-full bg-transparent text-sm font-medium text-neutral-800 outline-none dark:text-neutral-100"
        />
      </div>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        onBlur={commit}
        placeholder="https://…"
        className="mt-2 w-full truncate bg-transparent text-xs text-neutral-500 outline-none dark:text-neutral-400"
      />
      {url && url !== 'https://' && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-accent-500 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>
      )}
    </div>
  )
}
