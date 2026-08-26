import { NavProvider, useNav } from './nav/NavContext'
import MoodboardView from './pages/MoodboardView'
import ProjectListPage from './pages/ProjectListPage'
import ProjectView from './pages/ProjectView'

function Router() {
  const { route } = useNav()
  if (route.name === 'moodboard') {
    return <MoodboardView projectId={route.projectId} moodboardId={route.moodboardId} />
  }
  if (route.name === 'project') return <ProjectView projectId={route.projectId} />
  return <ProjectListPage />
}

export default function App() {
  return (
    <NavProvider>
      <Router />
    </NavProvider>
  )
}
