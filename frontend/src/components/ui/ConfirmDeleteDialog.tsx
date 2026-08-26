import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  entityLabel: string
  entityName: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
}

export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  entityLabel,
  entityName,
  description,
  confirmLabel,
  onConfirm,
}: Props) {
  const [busy, setBusy] = useState(false)
  const heading = title ?? `Delete this ${entityLabel}?`
  const cta = confirmLabel ?? `Delete ${entityLabel}`
  const defaultDesc = `You're about to permanently delete “${entityName}” along with all its chapters, characters, research, notes, and moodboards. Your writing will be gone forever — this cannot be undone.`

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl focus:outline-none dark:border-night-500 dark:bg-night-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="font-serif text-lg text-neutral-900 dark:text-neutral-50">
                  {heading}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {description ?? defaultDesc}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-night-600"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-night-500 dark:text-neutral-200 dark:hover:bg-night-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Deleting…' : cta}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
