import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'

type TextData = { text?: string }

export default function TextNode({ id, data, selected }: NodeProps) {
  const d = data as TextData
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(d.text ?? 'Text')
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
      className={`h-full min-h-[60px] min-w-[140px] rounded-xl border bg-white p-3 shadow-sm transition-colors dark:bg-night-700 ${
        selected
          ? 'border-accent-500 shadow-md'
          : 'border-neutral-200 dark:border-night-500'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={60}
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
          className="h-full w-full resize-none bg-transparent text-sm text-neutral-800 outline-none dark:text-neutral-100"
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          className="h-full whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-100"
          title="Double-click to edit"
        >
          {text || <span className="text-neutral-400">Double-click to edit</span>}
        </div>
      )}
    </div>
  )
}

export function SideHandles() {
  return (
    <>
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
    </>
  )
}
