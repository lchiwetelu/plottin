import { BookOpen, BookText, MoreHorizontal, Trash2, Upload } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useState } from 'react'
import type { main } from '../../wailsjs/go/models'
import { coverFor } from '../lib/covers'
import { formatNumber } from '../lib/formatNumber'
import { formatEdited } from '../lib/formatEdited'
import ExportDialog from './project/ExportDialog'
import ConfirmDeleteDialog from './ui/ConfirmDeleteDialog'

type Props = {
  project: main.Project
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

export default function ProjectCard({ project, onDelete, onOpen }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => onOpen(project.id)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen(project.id)
          }
        }}
        className="flex cursor-pointer items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-accent-500/50 hover:shadow-md dark:border-night-500/60 dark:bg-night-700/70 dark:hover:border-accent-500/60"
      >
        <img
          src={coverFor(project.cover)}
          alt=""
          className="h-16 w-16 shrink-0 rounded-md object-cover ring-1 ring-black/5 dark:ring-white/5"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg text-neutral-900 dark:text-neutral-50">{project.title}</h3>
          <div className="mt-0.5 text-[11px] font-semibold tracking-wider text-accent-500">{project.genre}</div>

          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <BookText className="h-3.5 w-3.5" />
              {formatNumber(project.wordCount)} words
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {project.chapterCount} chapters
            </span>
            <div className="flex min-w-[120px] items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-night-500">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${project.progressPct}%` }} />
              </div>
              <span className="tabular-nums">{project.progressPct}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
          <div className="text-xs text-neutral-400 dark:text-neutral-500">{formatEdited(project.editedAt)}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpen(project.id)}
              className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-night-500 dark:bg-night-600 dark:text-neutral-100 dark:hover:bg-night-500"
            >
              Open Draft
            </button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  aria-label="Project menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-night-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-40 min-w-[160px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
                >
                  <DropdownMenu.Item
                    onSelect={() => setExportOpen(true)}
                    className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 dark:text-neutral-100 dark:data-[highlighted]:bg-night-600"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Export…
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => setConfirmOpen(true)}
                    className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-red-600 outline-none data-[highlighted]:bg-red-50 dark:text-red-400 dark:data-[highlighted]:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete…
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        entityLabel="project"
        entityName={project.title || 'Untitled Project'}
        onConfirm={() => onDelete(project.id)}
      />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        projectId={project.id}
        projectTitle={project.title || 'Untitled Project'}
      />
    </>
  )
}
