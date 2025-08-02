export const SourceType = {
  YOUTUBE: "youtube",
  PDF: "pdf",
  WEB_PAGE: "web_page"
} as const

export type SourceType = typeof SourceType[keyof typeof SourceType]

export type Source = {
  id: number
  title: string
  type: SourceType
  url: string
  created_at: string
}

export type CreateSourceRequest = {
  url: string
  type: SourceType
  title?: string
}

export type Session = {
  id: number
  title: string
  created_at: string
}

export type MindmapNode = {
  node_id: string
  title: string
  description: string
  children?: MindmapNode[]
}

export type Mindmap = {
  node_id: string
  title: string
  description: string
  children?: MindmapNode[]
}

export type Message = {
  id: number
  chat_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type Chat = {
  id: number
  session_id: string
  node_id: string
  type: string
  created_at: string
  messages: Message[]
}

export type FullSession = {
  id: number
  title: string
  created_at: string
  sources: Source[]
  mindmap: Mindmap
}

export type FileItem = {
  id: number
  filename: string
  original_filename: string
  content_type: string
  size: number
  created_at: string
}