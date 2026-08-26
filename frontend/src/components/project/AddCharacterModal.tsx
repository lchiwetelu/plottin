import { useEffect, useState } from 'react'
import Modal, {
  ModalCancel,
  ModalField,
  ModalInput,
  ModalPrimary,
  ModalSelect,
  ModalTextarea,
} from '../ui/Modal'

const ROLES = [
  'PROTAGONIST',
  'ANTAGONIST',
  'SUPPORTING',
  'MENTOR',
  'NARRATOR',
  'LOVE INTEREST',
  'OTHER',
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { name: string; role: string; description: string }) => void | Promise<void>
}

export default function AddCharacterModal({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('PROTAGONIST')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setRole('PROTAGONIST')
      setDescription('')
      setBusy(false)
    }
  }, [open])

  const canSave = name.trim().length > 0 && !busy

  const submit = async () => {
    if (!canSave) return
    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), role, description: description.trim() })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add character"
      description="Give your key cast a place to live."
      footer={
        <>
          <ModalCancel onClick={() => onOpenChange(false)} />
          <ModalPrimary label="Add character" onClick={submit} disabled={!canSave} />
        </>
      }
    >
      <div className="space-y-4">
        <ModalField label="NAME">
          <ModalInput
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
            placeholder="Elena Vasquez"
          />
        </ModalField>
        <ModalField label="ROLE">
          <ModalSelect value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </ModalSelect>
        </ModalField>
        <ModalField label="DESCRIPTION" hint="A short bio — a sentence or two.">
          <ModalTextarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="A determined cartographer searching for her missing father…"
          />
        </ModalField>
      </div>
    </Modal>
  )
}
