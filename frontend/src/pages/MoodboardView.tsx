import {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronRight, LayoutTemplate } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GetMoodboard,
  GetProjects,
  SaveMoodboard,
  SetMoodboardTitle,
} from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'
import AppHeader from '../components/AppHeader'
import MoodboardMenu from '../components/MoodboardMenu'
import EditableMoodboardTitle from '../components/moodboard/EditableMoodboardTitle'
import NodePalette from '../components/moodboard/NodePalette'
import { initialDataFor, nodeTypes, type PaletteType } from '../components/moodboard/nodeTypes'
import { useNav } from '../nav/NavContext'
import { useTheme } from '../theme/useTheme'

type Props = { projectId: string; moodboardId: string }

const defaultEdgeStyle = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
  style: { stroke: '#f97316', strokeWidth: 2 },
}

function normalizeEdges(edges: Edge[]): Edge[] {
  return edges.map(e => ({
    ...defaultEdgeStyle,
    ...e,
    markerEnd: e.markerEnd ?? defaultEdgeStyle.markerEnd,
    style: e.style ?? defaultEdgeStyle.style,
  }))
}

export default function MoodboardView(props: Props) {
  return (
    <ReactFlowProvider>
      <MoodboardInner {...props} />
    </ReactFlowProvider>
  )
}

function MoodboardInner({ projectId, moodboardId }: Props) {
  const [moodboard, setMoodboard] = useState<main.Moodboard | null>(null)
  const [projectTitle, setProjectTitle] = useState<string>('')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition } = useReactFlow()
  const { theme } = useTheme()
  const { toProject } = useNav()

  // Autosave: guard so the initial data load doesn't itself trigger a save.
  const loadedRef = useRef(false)
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] })

  useEffect(() => {
    latestRef.current = { nodes, edges }
  }, [nodes, edges])

  useEffect(() => {
    loadedRef.current = false
    GetMoodboard(moodboardId)
      .then(mb => {
        if (!mb) return
        setMoodboard(mb)
        setNodes((mb.nodes as Node[]) ?? [])
        setEdges(normalizeEdges(((mb.edges as Edge[]) ?? [])))
        // Give React one tick to apply the initial state before we start saving.
        setTimeout(() => {
          loadedRef.current = true
        }, 200)
      })
      .catch(() => setMoodboard(null))
  }, [moodboardId, setNodes, setEdges])

  // Debounced autosave on every nodes/edges change.
  useEffect(() => {
    if (!loadedRef.current) return
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
    pendingSaveRef.current = setTimeout(() => {
      pendingSaveRef.current = null
      SaveMoodboard(moodboardId, latestRef.current.nodes, latestRef.current.edges).catch(() => {})
    }, 1500)
    return () => {
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current)
    }
  }, [nodes, edges, moodboardId])

  // Flush pending save on unmount so nothing is lost when navigating away.
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current)
        pendingSaveRef.current = null
        SaveMoodboard(moodboardId, latestRef.current.nodes, latestRef.current.edges).catch(() => {})
      }
    }
  }, [moodboardId])

  useEffect(() => {
    GetProjects()
      .then(ps => setProjectTitle(ps.find(p => p.id === projectId)?.title ?? ''))
      .catch(() => setProjectTitle(''))
  }, [projectId])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge({ ...defaultEdgeStyle, ...connection }, eds))
    },
    [setEdges],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/plottin-node') as PaletteType | ''
      if (!type) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const id = `n-${Date.now()}`
      setNodes(prev => [
        ...prev,
        { id, type, position, data: initialDataFor(type) } as Node,
      ])
    },
    [screenToFlowPosition, setNodes],
  )

  const handleTitleChange = (next: string) => {
    if (!moodboard) return
    setMoodboard(main.Moodboard.createFrom({ ...moodboard, title: next }))
  }

  const persistTitle = (next: string) => {
    SetMoodboardTitle(moodboardId, next).catch(() => {})
  }

  if (!moodboard) {
    return (
      <div className="flex min-h-screen flex-col bg-ink-50 text-neutral-900 dark:bg-night-900 dark:text-neutral-100">
        <AppHeader mode="project" />
        <div className="px-8 py-8 text-sm text-neutral-500 dark:text-neutral-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 text-neutral-900 dark:bg-night-900 dark:text-neutral-100">
      <AppHeader mode="project" />

      <div className="flex items-center gap-2 border-b border-neutral-200 px-6 py-2 dark:border-night-500/60">
        <LayoutTemplate className="h-4 w-4 text-accent-500" />
        {projectTitle && (
          <>
            <button
              onClick={() => toProject(projectId)}
              title="Back to project"
              className="font-serif text-sm text-neutral-500 hover:text-accent-500 hover:underline dark:text-neutral-400"
            >
              {projectTitle}
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
          </>
        )}
        <EditableMoodboardTitle
          moodboardId={moodboard.id}
          title={moodboard.title}
          onChange={handleTitleChange}
          onSave={persistTitle}
        />
        <div className="ml-auto">
          <MoodboardMenu projectId={projectId} activeMoodboardId={moodboard.id} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div className="relative flex-1" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            colorMode={theme}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!bg-white/70 dark:!bg-night-800/70" />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
