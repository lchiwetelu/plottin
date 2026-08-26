import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Route =
  | { name: 'list' }
  | { name: 'project'; projectId: string }
  | { name: 'moodboard'; projectId: string; moodboardId: string }

type NavContextValue = {
  route: Route
  toList: () => void
  toProject: (projectId: string) => void
  toMoodboard: (projectId: string, moodboardId: string) => void
  back: () => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'list' })

  const value = useMemo<NavContextValue>(
    () => ({
      route,
      toList: () => setRoute({ name: 'list' }),
      toProject: (projectId: string) => setRoute({ name: 'project', projectId }),
      toMoodboard: (projectId: string, moodboardId: string) =>
        setRoute({ name: 'moodboard', projectId, moodboardId }),
      back: () => {
        if (route.name === 'moodboard') setRoute({ name: 'project', projectId: route.projectId })
        else setRoute({ name: 'list' })
      },
    }),
    [route],
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>')
  return ctx
}
