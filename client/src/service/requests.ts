import axios  from 'axios'
import type { Session, FullSession, Chat, Message, FileItem, CreateSourceRequest } from '@/service/types'

export const getSessions = async (): Promise<Session[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/sessions`)
  return response.data
}

export const createSession = async (sources: CreateSourceRequest[]) => {
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/sessions`, sources)
  return response.data
}

export const getSession = async (sessionId: string): Promise<FullSession> => {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/sessions/${sessionId}`)
  return response.data.session
}

export const deleteSession = async (sessionId: string) => {
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/sessions/${sessionId}`)
  return response.data
}

export const getChat = async (sessionId: string, nodeId: string, chatType: string): Promise<Chat> => {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/chats/?session_id=${sessionId}&node_id=${nodeId}&chat_type=${chatType}`)
  return response.data
}

export const createChat = async (sessionId: string, nodeId: string, chatType: string): Promise<Chat> => {
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/chats/?session_id=${sessionId}&node_id=${nodeId}&chat_type=${chatType}`)
  return response.data
}

export const addMessage = async (chatId: string, content: string): Promise<Message> => {
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/messages`, {
    chat_id: chatId,
    content: content
  })
  return response.data
}

export const getFiles = async (): Promise<FileItem[]> => {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/files`)
  return response.data
}

export const uploadFile = async (file: File): Promise<{ file_id: number }> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deleteFile = async (filename: string): Promise<{ message: string }> => {
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/files/${filename}`)
  return response.data
}