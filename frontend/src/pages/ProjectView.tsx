import { ArrowLeft, Focus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import {
  CreateChapter,
  CreateCharacter,
  CreateNote,
  CreateResearch,
  DeleteCharacter,
  DeleteNote,
  DeleteProject,
  DeleteResearch,
  GetProjectDetail,
  SaveChapterContent,
  SetChapterTitle,
  SetProjectCover,
  SetProjectFont,
  SetProjectFontSize,
  SetProjectGenre,
  SetProjectTitle,
} from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'
import AppHeader from '../components/AppHeader'
import EditableTitle from '../components/EditableTitle'
import MoodboardMenu from '../components/MoodboardMenu'
import ProjectSearch from '../components/ProjectSearch'
import ChaptersRail from '../components/project/ChaptersRail'
import ExportDialog from '../components/project/ExportDialog'
import ProjectMenu from '../components/project/ProjectMenu'
import RightRail from '../components/project/RightRail'
import ConfirmDeleteDialog from '../components/ui/ConfirmDeleteDialog'
import ChapterEditor from '../editor/ChapterEditor'
import { emptyValue } from '../editor/helpers'
import { useNav } from '../nav/NavContext'

type Props = { projectId: string }

const AUTOSAVE_DELAY_MS = 1500

export default function ProjectView({ projectId }: Props) {
  const [detail, setDetail] = useState<main.ProjectDetail | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const contentsRef = useRef<Map<string, Descendant[]>>(new Map())
  const pendingSaveRef = useRef<{ id: string; timer: ReturnType<typeof setTimeout> } | null>(null)
  const { toList } = useNav()

  useEffect(() => {
    GetProjectDetail(projectId)
      .then(d => {
        if (!d) return
        setDetail(d)
        contentsRef.current = new Map(
          d.chapters.map(c => [c.id, (c.content as Descendant[]) ?? emptyValue]),
        )
        setSelectedId(d.chapters[0]?.id ?? null)
      })
      .catch(() => setDetail(null))
  }, [projectId])

  const selected = useMemo(
    () => detail?.chapters.find(c => c.id === selectedId) ?? null,
    [detail, selectedId],
  )

  const applyChapterUpdate = (updated: main.Chapter) => {
    setDetail(prev => {
      if (!prev) return prev
      return main.ProjectDetail.createFrom({
        ...prev,
        chapters: prev.chapters.map(c =>
          c.id === updated.id ? { ...c, wordCount: updated.wordCount, title: updated.title } : c,
        ),
      })
    })
  }

  const doSaveContent = async (chapterId: string, content: Descendant[]) => {
    try {
      const updated = await SaveChapterContent(chapterId, content)
      if (updated) applyChapterUpdate(updated)
    } catch {
      // ignored — next autosave will retry
    }
  }

  const flushPendingSave = () => {
    const pending = pendingSaveRef.current
    if (!pending) return
    clearTimeout(pending.timer)
    pendingSaveRef.current = null
    const content = contentsRef.current.get(pending.id)
    if (content) void doSaveContent(pending.id, content)
  }

  const scheduleSave = (chapterId: string, content: Descendant[]) => {
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current.timer)
    const timer = setTimeout(() => {
      pendingSaveRef.current = null
      void doSaveContent(chapterId, content)
    }, AUTOSAVE_DELAY_MS)
    pendingSaveRef.current = { id: chapterId, timer }
  }

  // Flush on chapter switch and on unmount so nothing is lost.
  useEffect(() => {
    return () => flushPendingSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const handleFontChange = (font: string) => {
    if (!detail) return
    const updatedProject = main.Project.createFrom({ ...detail.project, font })
    setDetail(main.ProjectDetail.createFrom({ ...detail, project: updatedProject }))
    SetProjectFont(projectId, font).catch(() => {})
  }

  const handleFontSizeChange = (fontSize: number) => {
    if (!detail) return
    const updatedProject = main.Project.createFrom({ ...detail.project, fontSize })
    setDetail(main.ProjectDetail.createFrom({ ...detail, project: updatedProject }))
    SetProjectFontSize(projectId, fontSize).catch(() => {})
  }

  const handleGenreChange = (genre: string) => {
    if (!detail) return
    const updatedProject = main.Project.createFrom({ ...detail.project, genre })
    setDetail(main.ProjectDetail.createFrom({ ...detail, project: updatedProject }))
    SetProjectGenre(projectId, genre).catch(() => {})
  }

  const handleProjectTitleChange = (title: string) => {
    if (!detail) return
    const updatedProject = main.Project.createFrom({ ...detail.project, title })
    setDetail(main.ProjectDetail.createFrom({ ...detail, project: updatedProject }))
  }

  const persistProjectTitle = (title: string) => {
    SetProjectTitle(projectId, title).catch(() => {})
  }

  const handleCoverChange = (cover: string) => {
    if (!detail) return
    const updatedProject = main.Project.createFrom({ ...detail.project, cover })
    setDetail(main.ProjectDetail.createFrom({ ...detail, project: updatedProject }))
    SetProjectCover(projectId, cover).catch(() => {})
  }

  const handleChapterTitleChange = (id: string, title: string) => {
    if (!detail) return
    setDetail(
      main.ProjectDetail.createFrom({
        ...detail,
        chapters: detail.chapters.map(c => (c.id === id ? { ...c, title } : c)),
      }),
    )
  }

  const persistChapterTitle = (id: string, title: string) => {
    SetChapterTitle(id, title).catch(() => {})
  }

  const handleCreateChapter = async () => {
    flushPendingSave()
    const ch = await CreateChapter(projectId).catch(() => null)
    if (!ch) return
    contentsRef.current.set(ch.id, (ch.content as Descendant[]) ?? emptyValue)
    setDetail(prev => {
      if (!prev) return prev
      return main.ProjectDetail.createFrom({
        ...prev,
        chapters: [...prev.chapters, ch],
      })
    })
    setSelectedId(ch.id)
  }

  const handleAddCharacter = async (input: { name: string; role: string; description: string }) => {
    const c = await CreateCharacter(projectId, input.name, input.role, input.description).catch(
      () => null,
    )
    if (!c) return
    setDetail(prev =>
      prev
        ? main.ProjectDetail.createFrom({ ...prev, characters: [...prev.characters, c] })
        : prev,
    )
  }

  const handleDeleteCharacter = async (id: string) => {
    await DeleteCharacter(id).catch(() => false)
    setDetail(prev =>
      prev
        ? main.ProjectDetail.createFrom({
            ...prev,
            characters: prev.characters.filter(c => c.id !== id),
          })
        : prev,
    )
  }

  const handleAddResearch = async (input: { title: string; url: string }) => {
    const r = await CreateResearch(projectId, input.title, input.url).catch(() => null)
    if (!r) return
    setDetail(prev =>
      prev
        ? main.ProjectDetail.createFrom({ ...prev, research: [...prev.research, r] })
        : prev,
    )
  }

  const handleDeleteResearch = async (id: string) => {
    await DeleteResearch(id).catch(() => false)
    setDetail(prev =>
      prev
        ? main.ProjectDetail.createFrom({
            ...prev,
            research: prev.research.filter(r => r.id !== id),
          })
        : prev,
    )
  }

  const handleAddNote = async (input: {
    title: string
    body: string
    kind: string
    audioUrl: string
  }) => {
    const n = await CreateNote(projectId, input.title, input.body, input.kind, input.audioUrl).catch(
      () => null,
    )
    if (!n) return
    setDetail(prev =>
      prev ? main.ProjectDetail.createFrom({ ...prev, notes: [...prev.notes, n] }) : prev,
    )
  }

  const handleDeleteNote = async (id: string) => {
    await DeleteNote(id).catch(() => false)
    setDetail(prev =>
      prev
        ? main.ProjectDetail.createFrom({
            ...prev,
            notes: prev.notes.filter(n => n.id !== id),
          })
        : prev,
    )
  }

  const handleDeleteProject = async () => {
    flushPendingSave()
    await DeleteProject(projectId).catch(() => false)
    toList()
  }

  const distractionFree = !leftOpen && !rightOpen
  const toggleDistractionFree = () => {
    if (leftOpen || rightOpen) {
      setLeftOpen(false)
      setRightOpen(false)
    } else {
      setLeftOpen(true)
      setRightOpen(true)
    }
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-ink-50 dark:bg-night-900">
        <AppHeader mode="project" />
        <div className="px-8 py-8 text-sm text-neutral-500 dark:text-neutral-400">Loading…</div>
      </div>
    )
  }

  const initialForSelected: Descendant[] = selectedId
    ? (contentsRef.current.get(selectedId) ?? emptyValue)
    : emptyValue

  const gridCols = `${leftOpen ? '280px' : '24px'} minmax(0,1fr) ${rightOpen ? '320px' : '24px'}`

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 text-neutral-900 dark:bg-night-900 dark:text-neutral-100">
      <AppHeader
        mode="project"
        search={
          <ProjectSearch
            projectId={projectId}
            detail={detail}
            onSelectChapter={id => {
              flushPendingSave()
              setSelectedId(id)
              if (!leftOpen) setLeftOpen(true)
            }}
          />
        }
      />

      <div className="flex items-center gap-2 border-b border-neutral-200 px-6 py-2 dark:border-night-500/60">
        <button
          onClick={toList}
          title="Back to all projects"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:border-night-500 dark:text-neutral-300 dark:hover:bg-night-600 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Projects
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleDistractionFree}
            title={distractionFree ? 'Show panels' : 'Hide both panels'}
            aria-pressed={distractionFree}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              distractionFree
                ? 'border-accent-500 bg-accent-500/15 text-accent-500'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-night-500 dark:text-neutral-300 dark:hover:bg-night-600'
            }`}
          >
            <Focus className="h-3.5 w-3.5" />
            {distractionFree ? 'Show panels' : 'Distraction Free'}
          </button>
          <MoodboardMenu projectId={projectId} />
          <ProjectMenu
            onExport={() => setExportOpen(true)}
            onDelete={() => setConfirmDeleteOpen(true)}
          />
        </div>
      </div>

      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        entityLabel="project"
        entityName={detail.project.title || 'Untitled Project'}
        onConfirm={handleDeleteProject}
      />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        projectId={projectId}
        projectTitle={detail.project.title || 'Untitled Project'}
      />

      <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: gridCols }}>
        <ChaptersRail
          project={detail.project}
          chapters={detail.chapters}
          selectedId={selectedId}
          open={leftOpen}
          onToggle={() => setLeftOpen(v => !v)}
          onSelect={setSelectedId}
          onGenreChange={handleGenreChange}
          onProjectTitleChange={handleProjectTitleChange}
          onProjectTitleSave={persistProjectTitle}
          onCoverChange={handleCoverChange}
          onCreateChapter={handleCreateChapter}
        />

        <main className="min-w-0 overflow-y-auto px-10 py-6">
          {selected ? (
            <>
              <div className="mb-4">
                <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
                  CHAPTER {selected.number}
                </div>
                <EditableTitle
                  entityId={selected.id}
                  title={selected.title}
                  fontFamily={detail.project.font}
                  onChange={next => handleChapterTitleChange(selected.id, next)}
                  onSave={next => persistChapterTitle(selected.id, next)}
                  placeholder="Untitled Chapter"
                  displayClassName="mt-1 font-serif text-4xl text-neutral-900 dark:text-neutral-50"
                  inputClassName="mt-1 font-serif text-4xl text-neutral-900 dark:text-neutral-50"
                  pencilSize="md"
                />
              </div>
              <ChapterEditor
                key={selected.id}
                initialValue={initialForSelected}
                onChange={value => {
                  contentsRef.current.set(selected.id, value)
                  scheduleSave(selected.id, value)
                }}
                font={detail.project.font}
                onFontChange={handleFontChange}
                fontSize={detail.project.fontSize || 18}
                onFontSizeChange={handleFontSizeChange}
              />
            </>
          ) : (
            <div className="pt-20 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Select a chapter to start writing, or click <strong>+ New Chapter</strong> in the sidebar.
            </div>
          )}
        </main>

        <RightRail
          characters={detail.characters}
          research={detail.research}
          notes={detail.notes}
          open={rightOpen}
          onToggle={() => setRightOpen(v => !v)}
          onAddCharacter={handleAddCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onAddResearch={handleAddResearch}
          onDeleteResearch={handleDeleteResearch}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>
    </div>
  )
}
