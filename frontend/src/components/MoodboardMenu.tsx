import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronRight, LayoutTemplate, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CreateMoodboard,
  GetAllMoodboards,
  GetProjects,
} from '../../wailsjs/go/main/App'
import type { main } from '../../wailsjs/go/models'
import { useNav } from '../nav/NavContext'

type Props = { projectId?: string; activeMoodboardId?: string }

export default function MoodboardMenu({ projectId, activeMoodboardId }: Props) {
  const [open, setOpen] = useState(false)
  const [allMoodboards, setAllMoodboards] = useState<main.Moodboard[]>([])
  const [projects, setProjects] = useState<main.Project[]>([])
  const { toMoodboard } = useNav()

  useEffect(() => {
    if (!open) return
    Promise.all([GetAllMoodboards(), GetProjects()])
      .then(([mbs, ps]) => {
        setAllMoodboards(mbs ?? [])
        setProjects(ps ?? [])
      })
      .catch(() => {
        setAllMoodboards([])
        setProjects([])
      })
  }, [open])

  const projectTitle = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) map.set(p.id, p.title)
    return map
  }, [projects])

  const currentProjectMoodboards = useMemo(
    () => (projectId ? allMoodboards.filter(m => m.projectId === projectId) : []),
    [allMoodboards, projectId],
  )

  const handleCreate = async (pid: string) => {
    const mb = await CreateMoodboard(pid, 'Untitled Moodboard')
    if (mb) {
      setOpen(false)
      toMoodboard(pid, mb.id)
    }
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Moodboards"
          title="Moodboards"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-700/20 font-serif text-sm font-semibold text-accent-500 shadow-sm transition-transform hover:scale-105 dark:bg-accent-700/40"
        >
          M
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-40 min-w-[260px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
        >
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
            MOODBOARDS
          </div>

          {projectId ? (
            <CurrentProjectList
              moodboards={currentProjectMoodboards}
              activeMoodboardId={activeMoodboardId}
              onOpen={mid => toMoodboard(projectId, mid)}
            />
          ) : (
            <AllProjectsList
              moodboards={allMoodboards}
              projectTitle={projectTitle}
              onOpen={(pid, mid) => toMoodboard(pid, mid)}
            />
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-neutral-200 dark:bg-night-500" />

          {projectId ? (
            <DropdownMenu.Item
              onSelect={e => {
                e.preventDefault()
                handleCreate(projectId)
              }}
              className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-accent-500 outline-none data-[highlighted]:bg-accent-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new moodboard
            </DropdownMenu.Item>
          ) : (
            <CreateForProjectSubmenu projects={projects} onCreate={handleCreate} />
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function CurrentProjectList({
  moodboards,
  activeMoodboardId,
  onOpen,
}: {
  moodboards: main.Moodboard[]
  activeMoodboardId?: string
  onOpen: (moodboardId: string) => void
}) {
  if (moodboards.length === 0) {
    return (
      <div className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-400">
        No moodboards yet. Create one below.
      </div>
    )
  }
  return (
    <>
      {moodboards.map(m => {
        const isActive = m.id === activeMoodboardId
        return (
          <DropdownMenu.Item
            key={m.id}
            onSelect={() => onOpen(m.id)}
            className={`flex cursor-default items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-night-600 ${
              isActive ? 'text-accent-500' : 'text-neutral-700 dark:text-neutral-100'
            }`}
          >
            <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{m.title}</span>
            {isActive && <span className="ml-auto text-[10px]">•</span>}
          </DropdownMenu.Item>
        )
      })}
    </>
  )
}

function AllProjectsList({
  moodboards,
  projectTitle,
  onOpen,
}: {
  moodboards: main.Moodboard[]
  projectTitle: Map<string, string>
  onOpen: (projectId: string, moodboardId: string) => void
}) {
  if (moodboards.length === 0) {
    return (
      <div className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-400">
        No moodboards yet. Create one below.
      </div>
    )
  }
  return (
    <>
      {moodboards.map(m => (
        <DropdownMenu.Item
          key={m.id}
          onSelect={() => onOpen(m.projectId, m.id)}
          className="flex cursor-default items-start gap-2 rounded-lg px-3 py-2 text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 dark:text-neutral-100 dark:data-[highlighted]:bg-night-600"
        >
          <LayoutTemplate className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div className="min-w-0">
            <div className="truncate">{m.title}</div>
            <div className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
              {projectTitle.get(m.projectId) ?? 'Unknown project'}
            </div>
          </div>
        </DropdownMenu.Item>
      ))}
    </>
  )
}

function CreateForProjectSubmenu({
  projects,
  onCreate,
}: {
  projects: main.Project[]
  onCreate: (projectId: string) => void | Promise<void>
}) {
  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-accent-500 outline-none data-[highlighted]:bg-accent-500/10 data-[state=open]:bg-accent-500/10">
        <Plus className="h-3.5 w-3.5" />
        Create new moodboard
        <ChevronRight className="ml-auto h-3.5 w-3.5" />
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          sideOffset={4}
          className="z-40 min-w-[240px] rounded-xl border border-neutral-200 bg-white p-1 text-sm shadow-lg dark:border-night-500 dark:bg-night-700"
        >
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
            CHOOSE A PROJECT
          </div>
          {projects.length === 0 ? (
            <div className="px-3 py-3 text-xs text-neutral-500 dark:text-neutral-400">
              No projects available.
            </div>
          ) : (
            projects.map(p => (
              <DropdownMenu.Item
                key={p.id}
                onSelect={e => {
                  e.preventDefault()
                  onCreate(p.id)
                }}
                className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-neutral-700 outline-none data-[highlighted]:bg-neutral-100 dark:text-neutral-100 dark:data-[highlighted]:bg-night-600"
              >
                <span className="truncate">{p.title}</span>
              </DropdownMenu.Item>
            ))
          )}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  )
}
