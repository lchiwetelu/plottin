import { Mic, NotebookPen, Square, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const canRecord =
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function' &&
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined'
import Modal, {
  ModalCancel,
  ModalField,
  ModalInput,
  ModalPrimary,
  ModalTextarea,
} from '../ui/Modal'

type Kind = 'text' | 'voice'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    title: string
    body: string
    kind: Kind
    audioUrl: string
  }) => void | Promise<void>
}

const AUDIO_EXT_RE = /\.(mp3|wav|m4a|aac|ogg|oga|flac|webm|opus|aiff|aif|caf)$/i

function isAudioBlob(blob: Blob): boolean {
  if (blob.type && blob.type.startsWith('audio/')) return true
  if ('name' in blob) {
    const name = (blob as File).name || ''
    if (AUDIO_EXT_RE.test(name)) return true
  }
  return false
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AddNoteModal({ open, onOpenChange, onSubmit }: Props) {
  const [kind, setKind] = useState<Kind>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordStartRef = useRef<number>(0)

  const resetAll = () => {
    setKind('text')
    setTitle('')
    setBody('')
    setBusy(false)
    setIsRecording(false)
    setAudioBlob(null)
    setElapsedMs(0)
    setMicError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
  }

  useEffect(() => {
    if (open) resetAll()
    else resetAll()
    // On unmount too
    return () => resetAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!audioBlob) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(audioBlob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audioBlob])

  const startRecording = async () => {
    setMicError(null)
    if (!canRecord) {
      setMicError('Recording is not available in this window. Upload an audio file instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
      }
      mr.start()
      mediaRecorderRef.current = mr
      recordStartRef.current = Date.now()
      setElapsedMs(0)
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - recordStartRef.current)
      }, 200)
      setIsRecording(true)
    } catch (err: any) {
      setMicError(err?.message ?? 'Microphone permission denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setElapsedMs(0)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const openFilePicker = () => fileRef.current?.click()
  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // Clear any previous recording/upload before validating so a rejected file
    // never leaves a stale blob around that could be saved.
    setAudioBlob(null)
    setElapsedMs(0)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (!isAudioBlob(file)) {
      setMicError(
        `“${file.name}” isn't an audio file. Try an mp3, m4a, wav, or other audio format.`,
      )
      return
    }
    setMicError(null)
    setAudioBlob(file)
  }

  const canSave =
    !busy &&
    (kind === 'text'
      ? title.trim().length > 0 || body.trim().length > 0
      : audioBlob !== null && isAudioBlob(audioBlob))

  const submit = async () => {
    if (!canSave) return
    if (kind === 'voice') {
      if (!audioBlob || !isAudioBlob(audioBlob)) {
        setMicError('Only audio files can be saved as a voice note.')
        return
      }
    }
    setBusy(true)
    try {
      let audioUrl = ''
      if (kind === 'voice' && audioBlob) {
        audioUrl = await blobToDataURL(audioBlob)
      }
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        kind,
        audioUrl,
      })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add note"
      description="Capture an idea as text — or record it as a voice memo."
      footer={
        <>
          <ModalCancel onClick={() => onOpenChange(false)} />
          <ModalPrimary
            label={kind === 'voice' ? 'Save voice note' : 'Add note'}
            onClick={submit}
            disabled={!canSave}
          />
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <KindTab
            active={kind === 'text'}
            onClick={() => setKind('text')}
            icon={<NotebookPen className="h-3.5 w-3.5" />}
            label="Text"
          />
          <KindTab
            active={kind === 'voice'}
            onClick={() => setKind('voice')}
            icon={<Mic className="h-3.5 w-3.5" />}
            label="Voice"
          />
        </div>

        <ModalField label="TITLE" hint={kind === 'voice' ? 'Optional — auto-labeled if blank.' : undefined}>
          <ModalInput
            autoFocus={kind === 'text'}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={kind === 'voice' ? 'Voice note' : 'Plot outline: Phase 3 climax'}
          />
        </ModalField>

        {kind === 'text' ? (
          <ModalField label="BODY">
            <ModalTextarea
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Elena discovers the forged signature and must decide…"
            />
          </ModalField>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={onFilePicked}
            />
            <VoiceControls
              isRecording={isRecording}
              audioBlob={audioBlob}
              previewUrl={previewUrl}
              elapsedMs={elapsedMs}
              micError={micError}
              canRecord={canRecord}
              onStart={startRecording}
              onStop={stopRecording}
              onDiscard={discardRecording}
              onUpload={openFilePicker}
            />
          </>
        )}
      </div>
    </Modal>
  )
}

function KindTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-accent-500 bg-accent-500/15 text-accent-500'
          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-night-500 dark:text-neutral-300 dark:hover:bg-night-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function VoiceControls({
  isRecording,
  audioBlob,
  previewUrl,
  elapsedMs,
  micError,
  canRecord,
  onStart,
  onStop,
  onDiscard,
  onUpload,
}: {
  isRecording: boolean
  audioBlob: Blob | null
  previewUrl: string | null
  elapsedMs: number
  micError: string | null
  canRecord: boolean
  onStart: () => void
  onStop: () => void
  onDiscard: () => void
  onUpload: () => void
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-center dark:border-night-500 dark:bg-night-600/60">
      {micError && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {micError}
        </div>
      )}

      {isRecording ? (
        <>
          <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-red-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Recording · {formatDuration(elapsedMs)}
          </div>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
          >
            <Square className="h-5 w-5 fill-current" />
          </button>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Tap to stop</div>
        </>
      ) : audioBlob && previewUrl ? (
        <>
          <div className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
            {elapsedMs > 0 ? `Recorded · ${formatDuration(elapsedMs)}` : 'Audio ready'}
          </div>
          <audio src={previewUrl} controls className="mx-auto w-full max-w-sm" />
          <button
            type="button"
            onClick={onDiscard}
            className="mt-3 text-xs font-medium text-neutral-500 hover:text-accent-500"
          >
            Discard and choose again
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3">
            {canRecord && (
              <button
                type="button"
                onClick={onStart}
                title="Record a voice note"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg hover:bg-accent-600"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onUpload}
              title="Upload an audio file"
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${
                canRecord
                  ? 'border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-night-500 dark:bg-night-700 dark:text-neutral-300 dark:hover:bg-night-600'
                  : 'bg-accent-500 text-white hover:bg-accent-600'
              }`}
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {canRecord
              ? 'Tap the mic to record, or the upload icon to pick an audio file.'
              : "Recording isn't available in this window — upload an audio file instead."}
          </div>
        </div>
      )}
    </div>
  )
}
