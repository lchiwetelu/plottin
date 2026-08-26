import fantasy from '../assets/covers/fantasy.svg'
import scifi from '../assets/covers/scifi.svg'
import mystery from '../assets/covers/mystery.svg'
import literary from '../assets/covers/literary.svg'
import novella from '../assets/covers/novella.svg'

export const PRESET_COVERS: { key: string; label: string }[] = [
  { key: 'fantasy', label: 'Fantasy' },
  { key: 'scifi', label: 'Sci-Fi' },
  { key: 'mystery', label: 'Mystery' },
  { key: 'literary', label: 'Literary' },
  { key: 'novella', label: 'Novella' },
]

const map: Record<string, string> = {
  fantasy,
  scifi,
  mystery,
  literary,
  novella,
}

export function coverFor(key: string): string {
  if (!key) return fantasy
  if (key.startsWith('data:') || key.startsWith('http://') || key.startsWith('https://')) {
    return key
  }
  return map[key] ?? fantasy
}
