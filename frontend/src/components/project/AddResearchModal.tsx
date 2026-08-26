import { useEffect, useState } from 'react'
import Modal, {
  ModalCancel,
  ModalField,
  ModalInput,
  ModalPrimary,
} from '../ui/Modal'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { title: string; url: string }) => void | Promise<void>
}

function isLikelyURL(v: string) {
  if (!v) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AddResearchModal({ open, onOpenChange, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle('')
      setUrl('')
      setBusy(false)
    }
  }, [open])

  const canSave = isLikelyURL(url.trim()) && !busy

  const submit = async () => {
    if (!canSave) return
    setBusy(true)
    try {
      await onSubmit({ title: title.trim(), url: url.trim() })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add research link"
      description="A URL you want to keep close to the manuscript."
      footer={
        <>
          <ModalCancel onClick={() => onOpenChange(false)} />
          <ModalPrimary label="Add link" onClick={submit} disabled={!canSave} />
        </>
      }
    >
      <div className="space-y-4">
        <ModalField label="URL" hint="Full https:// link.">
          <ModalInput
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
            placeholder="https://en.wikipedia.org/wiki/…"
            inputMode="url"
            autoComplete="off"
          />
        </ModalField>
        <ModalField label="TITLE" hint="Defaults to the URL if left blank.">
          <ModalInput
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Carthage Map & Coastal Coordinates"
          />
        </ModalField>
      </div>
    </Modal>
  )
}
