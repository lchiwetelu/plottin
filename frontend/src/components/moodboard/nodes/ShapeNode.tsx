import { NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import { SideHandles } from './TextNode'

type ShapeData = { text?: string }

export default function ShapeNode({ id, data, selected }: NodeProps) {
  const d = data as ShapeData
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(d.text ?? 'Beat')
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const { setNodes } = useReactFlow()

  useEffect(() => {
    if (editing) {
      areaRef.current?.focus()
      areaRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    setNodes(nodes =>
      nodes.map(n => (n.id === id ? { ...n, data: { ...n.data, text } } : n)),
    )
  }

  return (
    <div
      className={`flex h-full min-h-[80px] min-w-[140px] items-center justify-center rounded-2xl border-2 border-accent-500/70 bg-accent-500/15 px-4 py-3 shadow-sm transition-shadow ${
        selected ? 'shadow-md ring-2 ring-accent-500/30' : ''
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={80}
        color="#f97316"
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />
      <SideHandles />
      {editing ? (
        <textarea
          ref={areaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setText(d.text ?? '')
              setEditing(false)
            }
          }}
          rows={2}
          className="h-full w-full resize-none bg-transparent text-center font-serif text-base font-medium text-accent-700 outline-none dark:text-accent-400"
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className="text-center font-serif text-base font-medium text-accent-700 dark:text-accent-400"
          title="Double-click to edit"
        >
          {text || <span className="text-accent-400">Double-click to edit</span>}
        </div>
      )}
    </div>
  )
}
