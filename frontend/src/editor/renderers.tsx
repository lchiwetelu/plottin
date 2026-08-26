import type { RenderElementProps, RenderLeafProps } from 'slate-react'
import { useFocused, useSelected } from 'slate-react'
import type { ImageElement } from './types'

export function Element(props: RenderElementProps) {
  const { attributes, children, element } = props
  switch (element.type) {
    case 'heading-one':
      return (
        <h1 {...attributes} className="mt-6 mb-3 font-serif text-3xl">
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 {...attributes} className="mt-5 mb-2 font-serif text-2xl">
          {children}
        </h2>
      )
    case 'heading-three':
      return (
        <h3 {...attributes} className="mt-4 mb-2 font-serif text-xl">
          {children}
        </h3>
      )
    case 'block-quote':
      return (
        <blockquote
          {...attributes}
          className="my-4 border-l-2 border-accent-500 pl-4 italic text-neutral-600 dark:text-neutral-300"
        >
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul {...attributes} className="my-3 ml-6 list-disc">
          {children}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol {...attributes} className="my-3 ml-6 list-decimal">
          {children}
        </ol>
      )
    case 'list-item':
      return (
        <li {...attributes} className="my-1">
          {children}
        </li>
      )
    case 'image':
      return <ImageBlock {...props} />
    default:
      return (
        <p {...attributes} className="my-3 leading-relaxed">
          {children}
        </p>
      )
  }
}

function ImageBlock({ attributes, children, element }: RenderElementProps) {
  const el = element as ImageElement
  const selected = useSelected()
  const focused = useFocused()
  const ring = selected && focused ? 'ring-2 ring-accent-500' : 'ring-1 ring-black/5 dark:ring-white/10'
  return (
    <div {...attributes} className="my-4">
      <div contentEditable={false} className="select-none">
        <img src={el.url} alt="" className={`max-w-full rounded-lg ${ring}`} />
      </div>
      {children}
    </div>
  )
}

export function Leaf({ attributes, children, leaf }: RenderLeafProps) {
  let el: React.ReactNode = children
  if (leaf.bold) el = <strong>{el}</strong>
  if (leaf.italic) el = <em>{el}</em>
  if (leaf.underline) el = <u>{el}</u>
  if (leaf.strikethrough) el = <s>{el}</s>
  if (leaf.code)
    el = (
      <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-night-600">
        {el}
      </code>
    )
  if (leaf.highlight) {
    el = (
      <span
        className={
          leaf.activeHighlight
            ? 'rounded bg-accent-500 px-0.5 text-white'
            : 'rounded bg-accent-500/25 px-0.5'
        }
      >
        {el}
      </span>
    )
  }
  return <span {...attributes}>{el}</span>
}
