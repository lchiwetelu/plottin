import type { BaseEditor, BaseRange, Descendant } from 'slate'
import type { ReactEditor } from 'slate-react'
import type { HistoryEditor } from 'slate-history'

export type MarkFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code'
export type BlockFormat =
  | 'paragraph'
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'block-quote'
  | 'bulleted-list'
  | 'numbered-list'

export type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  // Applied as decorations during find-in-editor:
  highlight?: boolean
  activeHighlight?: boolean
}

export type ParagraphElement = { type: 'paragraph'; children: CustomText[] }
export type HeadingElement = {
  type: 'heading-one' | 'heading-two' | 'heading-three'
  children: CustomText[]
}
export type BlockQuoteElement = { type: 'block-quote'; children: CustomText[] }
export type ListItemElement = { type: 'list-item'; children: CustomText[] }
export type BulletedListElement = { type: 'bulleted-list'; children: ListItemElement[] }
export type NumberedListElement = { type: 'numbered-list'; children: ListItemElement[] }
export type ImageElement = { type: 'image'; url: string; children: [{ text: '' }] }

export type CustomElement =
  | ParagraphElement
  | HeadingElement
  | BlockQuoteElement
  | ListItemElement
  | BulletedListElement
  | NumberedListElement
  | ImageElement

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
    Range: BaseRange & { highlight?: boolean; activeHighlight?: boolean }
  }
}

export type SlateValue = Descendant[]
