import { Image as ImageIcon, Link as LinkIcon, Square, Type } from 'lucide-react'
import type { PaletteType } from './nodeTypes'

const ITEMS: { type: PaletteType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: 'text',
    label: 'Text',
    icon: <Type className="h-4 w-4" />,
    description: 'A note or story beat',
  },
  {
    type: 'shape',
    label: 'Beat',
    icon: <Square className="h-4 w-4" />,
    description: 'An emphasized story moment',
  },
  {
    type: 'image',
    label: 'Image',
    icon: <ImageIcon className="h-4 w-4" />,
    description: 'Reference art or photo',
  },
  {
    type: 'link',
    label: 'Link',
    icon: <LinkIcon className="h-4 w-4" />,
    description: 'External research link',
  },
]

export default function NodePalette() {
  const onDragStart = (e: React.DragEvent, type: PaletteType) => {
    e.dataTransfer.setData('application/plottin-node', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-neutral-200 bg-white/40 dark:border-night-500/60 dark:bg-night-800/40">
      <div className="border-b border-neutral-200 px-5 py-4 dark:border-night-500/60">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
          NODE TYPES
        </div>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Drag onto the canvas
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {ITEMS.map(item => (
          <div
            key={item.type}
            draggable
            onDragStart={e => onDragStart(e, item.type)}
            className="group flex cursor-grab items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent-500/60 hover:shadow-md active:cursor-grabbing dark:border-night-500/60 dark:bg-night-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 group-hover:bg-accent-500/20">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {item.label}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
