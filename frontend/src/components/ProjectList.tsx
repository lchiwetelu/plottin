import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CreateProject, DeleteProject, GetProjects } from '../../wailsjs/go/main/App'
import type { main } from '../../wailsjs/go/models'
import { useNav } from '../nav/NavContext'
import ProjectCard from './ProjectCard'
import { useToast } from './ui/Toast'

type Props = { filter?: string }

export default function ProjectList({ filter = '' }: Props) {
  const [projects, setProjects] = useState<main.Project[]>([])
  const toast = useToast()
  const { toProject } = useNav()

  useEffect(() => {
    GetProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  const filtered = (() => {
    const q = filter.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      p => p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q),
    )
  })()

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    DeleteProject(id).catch(() => {})
  }

  const handleCreate = async () => {
    const p = await CreateProject().catch(() => null)
    if (!p) {
      toast('Could not create project')
      return
    }
    toProject(p.id)
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 dark:text-neutral-50">Your Projects</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Select a manuscript to resume writing</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-600"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map(p => (
          <ProjectCard key={p.id} project={p} onDelete={handleDelete} onOpen={toProject} />
        ))}
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-night-500 dark:text-neutral-400">
            No projects yet.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-night-500 dark:text-neutral-400">
            No manuscripts match “{filter}”.
          </div>
        ) : null}
      </div>
    </div>
  )
}
