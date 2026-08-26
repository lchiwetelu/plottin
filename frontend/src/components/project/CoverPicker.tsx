import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ImagePlus, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { coverFor, PRESET_COVERS } from '../../lib/covers'

type Props = {
  cover: string
  onChange: (cover: string) => void
}

export default function CoverPicker({ cover, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      onChange(url)
      setOpen(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title="Change cover"
            aria-label="Change cover"
            className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-md ring-1 ring-black/5 dark:ring-white/5"
          >
            <img src={coverFor(cover)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100">
              <Pencil className="h-3.5 w-3.5 text-white" />
            </div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={8}
            className="z-40 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-night-500 dark:bg-night-700"
          >
            <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
              COVER
            </div>
            <div className="grid grid-cols-5 gap-2 px-1">
              {PRESET_COVERS.map(p => {
                const active = cover === p.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      onChange(p.key)
                      setOpen(false)
                    }}
                    title={p.label}
                    className={`overflow-hidden rounded-md ring-2 transition-shadow ${
                      active ? 'ring-accent-500' : 'ring-transparent hover:ring-neutral-300 dark:hover:ring-night-500'
                    }`}
                  >
                    <img src={coverFor(p.key)} alt={p.label} className="h-12 w-10 object-cover" />
                  </button>
                )
              })}
            </div>
            <DropdownMenu.Separator className="my-1.5 h-px bg-neutral-200 dark:bg-night-500" />
            <DropdownMenu.Item
              onSelect={e => {
                e.preventDefault()
                fileRef.current?.click()
              }}
              className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-500 outline-none data-[highlighted]:bg-accent-500/10"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Upload image…
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  )
}
