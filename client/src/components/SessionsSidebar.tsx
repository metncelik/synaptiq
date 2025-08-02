import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useGetSessions } from "@/service/queries"
import { Link, useParams } from "react-router"
import { Plus, MessageSquare, Calendar, Loader2, Trash, Brain } from "lucide-react"
import { CreateSessionModal } from "./CreateSessionModal"
import { useDeleteSession } from "@/service/queries"
import { useNavigate } from "react-router"

export function SessionsSidebar() {
  const { data: sessions, isLoading } = useGetSessions()
  const { sessionId } = useParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const { mutate: deleteSession } = useDeleteSession()
  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete)
      navigate('/')
    }
    setIsDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <h1 className="text-xl font-semibold text-gray-900">Learn Loop</h1>
          </div>
        </div>

        {sessions && sessions.length > 0 && (<Button
          onClick={() => setIsCreateModalOpen(true)}
          size="sm"
          className="gap-2 m-4"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>)}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="p-2 flex flex-col gap-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/session/${session.id}`}
                  className={`group block p-3 rounded-lg mb-2 transition-colors hover:bg-gray-50 ${sessionId === session.id.toString()
                    ? 'bg-blue-50 border border-blue-200'
                    : 'border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-gray-900 truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.created_at)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-opacity p-1 h-7 w-7"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteClick(session.id.toString())
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-4">Create your first session to get started</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">Delete Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 