import type { NodeTypes } from '@xyflow/react'
import ImageNode from './nodes/ImageNode'
import LinkNode from './nodes/LinkNode'
import ShapeNode from './nodes/ShapeNode'
import TextNode from './nodes/TextNode'

export const nodeTypes: NodeTypes = {
  text: TextNode,
  shape: ShapeNode,
  image: ImageNode,
  link: LinkNode,
}

export type PaletteType = 'text' | 'shape' | 'image' | 'link'

export function initialDataFor(type: PaletteType): Record<string, unknown> {
  switch (type) {
    case 'text':
      return { text: 'New text' }
    case 'shape':
      return { text: 'Beat' }
    case 'image':
      return { url: '' }
    case 'link':
      return { title: 'New link', url: 'https://' }
  }
}
