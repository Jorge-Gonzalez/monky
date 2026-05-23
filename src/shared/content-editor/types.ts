export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre'

export interface EditorFormatState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  inlineCode: boolean
  bulletList: boolean
  orderedList: boolean
  blockType: BlockType
  linkHref: string | null
  hasSelection: boolean
}

export const DEFAULT_FORMAT_STATE: EditorFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  inlineCode: false,
  bulletList: false,
  orderedList: false,
  blockType: 'paragraph',
  linkHref: null,
  hasSelection: false,
}
