import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal, Trash2, Upload } from 'lucide-react'

type Props = {
  onExport: () => void
  onDelete: () => void
}

export default function ProjectMenu({ onExport, onDelete }: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Project menu"
          title="Project menu"
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-40 min-w-[180px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
        >
          <DropdownMenu.Item
            onSelect={onExport}
            className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 dark:text-neutral-100 dark:data-[highlighted]:bg-night-600"
          >
            <Upload className="h-3.5 w-3.5" />
            Export…
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-red-600 outline-none data-[highlighted]:bg-red-50 dark:text-red-400 dark:data-[highlighted]:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete project…
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
