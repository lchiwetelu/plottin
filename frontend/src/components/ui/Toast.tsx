import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type ToastVariant = 'info' | 'error'

type Toast = { id: number; message: string; variant: ToastVariant }

type ToastOptions = {
  durationMs?: number
  variant?: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, opts?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = ++idRef.current
      const variant: ToastVariant = opts?.variant ?? 'info'
      const durationMs = opts?.durationMs ?? (variant === 'error' ? 8000 : 2400)
      setToasts(prev => [...prev, { id, message, variant }])
      setTimeout(() => dismiss(id), durationMs)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map(t => {
          const isError = t.variant === 'error'
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-2 text-sm shadow-lg backdrop-blur ${
                isError
                  ? 'border-red-500/50 bg-red-50/95 text-red-800 dark:bg-red-950/70 dark:text-red-200'
                  : 'border-neutral-200 bg-white/95 text-neutral-800 dark:border-night-500 dark:bg-night-700/95 dark:text-neutral-100'
              }`}
            >
              <span className="whitespace-pre-wrap break-words">{t.message}</span>
              {isError && (
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-red-500 hover:bg-red-500/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.toast
}
