export type FontOption = { label: string; value: string }

export const FONTS: FontOption[] = [
  { label: 'Fraunces', value: '"Fraunces", Georgia, ui-serif, serif' },
  { label: 'Lora', value: '"Lora", Georgia, ui-serif, serif' },
  { label: 'Merriweather', value: '"Merriweather", Georgia, ui-serif, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", Georgia, ui-serif, serif' },
  { label: 'EB Garamond', value: '"EB Garamond", Baskerville, ui-serif, serif' },
  { label: 'Inter', value: '"Inter", -apple-system, "Segoe UI", sans-serif' },
]

export function fontLabel(value: string): string {
  const match = FONTS.find(f => f.value === value)
  return match ? match.label : 'Fraunces'
}

export const FONT_SIZES: number[] = [14, 15, 16, 17, 18, 19, 20, 22, 24, 28]

export const DEFAULT_FONT_SIZE = 18
