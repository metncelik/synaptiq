import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMessage, createChat, createSession, deleteSession, getChat, getSession, getSessions, getFiles, uploadFile, deleteFile } from '@/service/requests'
import type { Session, FullSession, Chat, FileItem, CreateSourceRequest } from '@/service/types'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

export const useGetSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async (): Promise<Session[]> => {
      const data = await getSessions()
      return data
    }
  })
}

export const useCreateSession = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    onSuccess: (data) => {
      toast.success('Session created successfully')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/session/${data.session_id}`)
    },
    mutationFn: async ({ sources }: { sources: CreateSourceRequest[] }) => {
      const data = await createSession(sources)
      return data
    }
  })
}

export const useGetSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<FullSession> => {
      const data = await getSession(sessionId)
      return data
    }
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    mutationFn: async (sessionId: string) => {
      await deleteSession(sessionId)
    }
  })
}

export const useGetChat = (sessionId: string, nodeId: string, chatType: string) => {
  return useQuery({
    retry: false,
    queryKey: ['chat', sessionId, nodeId, chatType],
    queryFn: async (): Promise<Chat> => {
      const data = await getChat(sessionId, nodeId, chatType)
      return data
    }
  })
}

export const useCreateChat = () => {
  const queryClient = useQueryClient()
  return useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.sessionId, variables.nodeId, variables.chatType] })
      toast.success('Chat created successfully')
    },
    mutationFn: async ({ sessionId, nodeId, chatType }: { sessionId: string, nodeId: string, chatType: string }) => {
      const data = await createChat(sessionId, nodeId, chatType)
      return data
    }
  })
}

export const useAddMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.sessionId, variables.nodeId, variables.chatType] })
    },
    mutationFn: async ({ chatId, content }: { chatId: string, content: string, sessionId: string, nodeId: string, chatType: string }) => {
      const data = await addMessage(chatId, content)
      return data
    }
  })
}

export const useGetFiles = () => {
  return useQuery({
    queryKey: ['files'],
    queryFn: async (): Promise<FileItem[]> => {
      const data = await getFiles()
      return data
    }
  })
}

export const useUploadFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success('File uploaded successfully')
    },
    onError: () => {
      toast.error('Failed to upload file')
    },
    mutationFn: async (file: File) => {
      const data = await uploadFile(file)
      return data
    }
  })
}

export const useDeleteFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success('File deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete file')
    },
    mutationFn: async (filename: string) => {
      const data = await deleteFile(filename)
      return data
    }
  })
}