import { NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react'
import { ImagePlus } from 'lucide-react'
import { useRef } from 'react'
import { SideHandles } from './TextNode'

type ImageData = { url?: string }

export default function ImageNode({ id, data, selected }: NodeProps) {
  const d = data as ImageData
  const fileRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()

  const openPicker = () => fileRef.current?.click()

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setNodes(nodes =>
        nodes.map(n => (n.id === id ? { ...n, data: { ...n.data, url } } : n)),
      )
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      className={`group relative h-full min-h-[120px] min-w-[160px] overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-night-700 ${
        selected
          ? 'border-accent-500 shadow-md'
          : 'border-neutral-200 dark:border-night-500'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={120}
        color="#f97316"
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />
      <SideHandles />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      {d.url ? (
        <div className="h-full w-full">
          <img src={d.url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={openPicker}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover:opacity-100"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:bg-neutral-50 dark:hover:bg-night-600"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs">Click to add image</span>
        </button>
      )}
    </div>
  )
}
