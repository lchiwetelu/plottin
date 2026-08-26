import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  side: 'left' | 'right'
  open: boolean
  onToggle: () => void
}

export default function EdgeToggle({ side, open, onToggle }: Props) {
  const isLeft = side === 'left'
  // Chevron always points toward where the panel edge will move on click.
  const pointsRight = isLeft ? !open : open
  const Icon = pointsRight ? ChevronRight : ChevronLeft
  const position = isLeft ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'

  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onToggle()
      }}
      aria-label={open ? 'Collapse panel' : 'Expand panel'}
      title={open ? 'Collapse panel' : 'Expand panel'}
      className={`absolute top-1/2 z-30 -translate-y-1/2 ${position} flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-300 bg-white text-neutral-700 opacity-90 shadow-md transition-transform hover:scale-110 hover:opacity-100 focus-visible:opacity-100 dark:border-night-400 dark:bg-night-700 dark:text-neutral-100`}
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </button>
  )
}
