import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMessage, createChat, createSession, deleteSession, getChat, getSession, getSessions } from '@/service/requests'
import type { Source, Session, FullSession, Chat } from '@/service/types'
import { useNavigate } from 'react-router'

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
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/session/${data.session_id}`)
    },
    mutationFn: async ({ sources }: { sources: Source[] }) => {
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