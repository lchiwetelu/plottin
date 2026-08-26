import { Editor, Element as SlateElement, Transforms, type Descendant } from 'slate'
import type { BlockFormat, MarkFormat } from './types'

const LIST_TYPES: BlockFormat[] = ['numbered-list', 'bulleted-list']

export function isMarkActive(editor: Editor, format: MarkFormat): boolean {
  const marks = Editor.marks(editor) as Record<string, boolean> | null
  return marks ? marks[format] === true : false
}

export function toggleMark(editor: Editor, format: MarkFormat): void {
  if (isMarkActive(editor, format)) Editor.removeMark(editor, format)
  else Editor.addMark(editor, format, true)
}

export function isBlockActive(editor: Editor, format: BlockFormat): boolean {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && (n as { type: string }).type === format,
    }),
  )
  return !!match
}

export function toggleBlock(editor: Editor, format: BlockFormat): void {
  const isActive = isBlockActive(editor, format)
  const isList = (LIST_TYPES as string[]).includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (LIST_TYPES as string[]).includes((n as { type: string }).type),
    split: true,
  })

  const newType = isActive ? 'paragraph' : isList ? 'list-item' : format
  // Slate's setNodes/wrapNodes narrow to the first element in the CustomElement
  // union; the actual runtime accepts any element props, so cast at the boundary.
  Transforms.setNodes(editor, { type: newType } as never)

  if (!isActive && isList) {
    Transforms.wrapNodes(editor, { type: format, children: [] } as never)
  }
}

export function insertImage(editor: Editor, url: string): void {
  Transforms.insertNodes(editor, {
    type: 'image',
    url,
    children: [{ text: '' }],
  })
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  })
}

export function withImages<T extends Editor>(editor: T): T {
  const { isVoid } = editor
  editor.isVoid = element =>
    (element as { type?: string }).type === 'image' ? true : isVoid(element)
  return editor
}

export const emptyValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]
