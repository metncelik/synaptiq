import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCreateSession } from "@/service/queries"
import { SourceType } from "@/service/types"
import { X, Youtube, Globe, FileText, Plus, Loader2 } from "lucide-react"

type CreateSessionModalProps = {
  isOpen: boolean
  onClose: () => void
}

type SourceOption = 'youtube' | 'web' | 'pdf'

export function CreateSessionModal({ isOpen, onClose }: CreateSessionModalProps) {
  const [selectedSource, setSelectedSource] = useState<SourceOption>('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [webUrl, setWebUrl] = useState('')
  const [error, setError] = useState('')
  
  const { mutate: createSession, isPending } = useCreateSession()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedSource === 'youtube') {
      if (!youtubeUrl.trim()) {
        setError('Please enter a YouTube URL')
        return
      }
      
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
      if (!youtubeRegex.test(youtubeUrl)) {
        setError('Please enter a valid YouTube URL')
        return
      }

      createSession({ 
        sources: [{ 
          url: youtubeUrl.trim(), 
          type: SourceType.YOUTUBE 
        }] 
      }, {
        onSuccess: () => {
          onClose()
          setYoutubeUrl('')
          setWebUrl('')
          setError('')
        },
        onError: (error) => {
          setError('Failed to create session. Please try again.')
          console.error('Create session error:', error)
        }
      })
    } else if (selectedSource === 'web') {
      setError('Web URL sources are not implemented yet')
    } else if (selectedSource === 'pdf') {
      setError('PDF file upload is not implemented yet')
    }
  }

  const handleClose = () => {
    if (!isPending) {
      onClose()
      setYoutubeUrl('')
      setWebUrl('')
      setError('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-50/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Session</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isPending}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose source type:
              </label>
              <div className="space-y-2">
                {/* YouTube Option */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('youtube')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedSource === 'youtube'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Youtube className="h-5 w-5 text-red-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">YouTube Video</div>
                    <div className="text-sm text-gray-500">Add a YouTube video URL</div>
                  </div>
                </button>

                {/* Web URL Option - Disabled */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('web')}
                  disabled
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                >
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-500">Web URL</div>
                    <div className="text-sm text-gray-400">Coming soon</div>
                  </div>
                </button>

                {/* PDF Option - Disabled */}
                <button
                  type="button"
                  onClick={() => setSelectedSource('pdf')}
                  disabled
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                >
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-500">PDF File</div>
                    <div className="text-sm text-gray-400">Coming soon</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Input based on selected source */}
            {selectedSource === 'youtube' && (
              <div>
                <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  id="youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isPending}
                />
              </div>
            )}

            {selectedSource === 'web' && (
              <div>
                <label htmlFor="web-url" className="block text-sm font-medium text-gray-700 mb-2">
                  Web URL
                </label>
                <input
                  id="web-url"
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            )}

            {selectedSource === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File
                </label>
                <div className="w-full px-3 py-8 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">PDF upload coming soon</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || selectedSource !== 'youtube'}
              className="flex-1 gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 