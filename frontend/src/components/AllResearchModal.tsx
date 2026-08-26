import { ExternalLink, Link as LinkIcon, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DeleteResearch, GetAllResearch, GetProjects } from '../../wailsjs/go/main/App'
import type { main } from '../../wailsjs/go/models'
import { hostFromURL } from '../lib/hostFromURL'
import { useNav } from '../nav/NavContext'
import ConfirmDeleteDialog from './ui/ConfirmDeleteDialog'
import Modal from './ui/Modal'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AllResearchModal({ open, onOpenChange }: Props) {
  const [links, setLinks] = useState<main.ResearchLink[]>([])
  const [projects, setProjects] = useState<main.Project[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<main.ResearchLink | null>(null)
  const { toProject } = useNav()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([GetAllResearch(), GetProjects()])
      .then(([ls, ps]) => {
        setLinks(ls ?? [])
        setProjects(ps ?? [])
      })
      .catch(() => {
        setLinks([])
        setProjects([])
      })
      .finally(() => setLoading(false))
  }, [open])

  const projectTitle = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of projects) m.set(p.id, p.title)
    return m
  }, [projects])

  const grouped = useMemo(() => {
    const map = new Map<string, main.ResearchLink[]>()
    for (const l of links) {
      const arr = map.get(l.projectId ?? '') ?? []
      arr.push(l)
      map.set(l.projectId ?? '', arr)
    }
    // Preserve the project order from `projects` (already sorted by edited_at DESC).
    const order: string[] = []
    for (const p of projects) if (map.has(p.id)) order.push(p.id)
    for (const key of map.keys()) if (!order.includes(key)) order.push(key)
    return order.map(id => ({ id, links: map.get(id)! }))
  }, [links, projects])

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const id = pendingDelete.id
    await DeleteResearch(id).catch(() => false)
    setLinks(prev => prev.filter(l => l.id !== id))
    setPendingDelete(null)
  }

  const openInProject = (projectId: string) => {
    onOpenChange(false)
    toProject(projectId)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="All research links"
      description="Every link you've saved, grouped by project."
      size="lg"
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">Loading…</div>
      ) : links.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No research links yet. Add one from any project's Research tab.
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
          {grouped.map(g => (
            <section key={g.id}>
              <button
                type="button"
                onClick={() => g.id && openInProject(g.id)}
                className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-accent-500 dark:text-neutral-400"
              >
                {projectTitle.get(g.id) ?? 'Unknown project'}
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-night-600 dark:text-neutral-400">
                  {g.links.length}
                </span>
              </button>
              <ul className="space-y-2">
                {g.links.map(l => (
                  <li
                    key={l.id}
                    className="group/item flex items-start gap-2 rounded-lg bg-neutral-50 p-3 pr-8 relative dark:bg-night-600/60"
                  >
                    <span className="mt-0.5">
                      <LinkIcon className="h-3.5 w-3.5 text-accent-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-neutral-800 hover:text-accent-500 dark:text-neutral-100"
                      >
                        <span className="truncate">{l.title}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/item:opacity-70" />
                      </a>
                      <div className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                        {hostFromURL(l.url)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(l)}
                      aria-label="Delete link"
                      title="Delete link"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover/item:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={o => {
          if (!o) setPendingDelete(null)
        }}
        entityLabel="research link"
        entityName={pendingDelete?.title || pendingDelete?.url || 'this link'}
        description={`You're about to permanently delete “${pendingDelete?.title || pendingDelete?.url || 'this link'}”. This cannot be undone.`}
        confirmLabel="Delete link"
        onConfirm={confirmDelete}
      />
    </Modal>
  )
}
