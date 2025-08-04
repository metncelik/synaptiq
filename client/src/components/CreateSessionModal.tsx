import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useCreateSession, useGetFiles, useUploadFile, useDeleteFile } from "@/service/queries"
import { SourceType } from "@/service/types"
import type { FileItem, CreateSourceRequest } from "@/service/types"
import { X, Youtube, Globe, FileText, Plus, Loader2, Upload, Trash2 } from "lucide-react"

type CreateSessionModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function CreateSessionModal({ isOpen, onClose }: CreateSessionModalProps) {
  const [sources, setSources] = useState<CreateSourceRequest[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [webUrl, setWebUrl] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { mutate: createSession, isPending } = useCreateSession()
  // TODO: fix - get files when pdf files clicked
  const { data: files, isLoading: filesLoading } = useGetFiles()
  const { mutate: uploadFile, isPending: uploadPending } = useUploadFile()
  const { mutate: deleteFile } = useDeleteFile()

  const addYouTubeSource = () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }
    
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    const newSource: CreateSourceRequest = {
      url: youtubeUrl.trim(),
      type: SourceType.YOUTUBE
    }

    setSources(prev => [...prev, newSource])
    setYoutubeUrl('')
    setError('')
  }

  const addWebSource = () => {
    if (!webUrl.trim()) {
      setError('Please enter a Web URL')
      return
    }

    const newSource: CreateSourceRequest = {
      url: webUrl.trim(),
      type: SourceType.WEB_PAGE
    }

    setSources(prev => [...prev, newSource])
    setWebUrl('')
    setError('')
  }

  const addPdfSources = () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file')
      return
    }

    const pdfSources: CreateSourceRequest[] = selectedFiles.map(file => ({
      url: `/files/${file.filename}`,
      type: SourceType.PDF,
      title: file.original_filename
    }))

    setSources(prev => [...prev, ...pdfSources])
    setSelectedFiles([]) // Clear selected files since they're now added as sources
    setError('')
  }

  const removeSource = (index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (sources.length === 0) {
      setError('Please add at least one source')
      return
    }

    createSession({ sources }, {
      onSuccess: () => {
        onClose()
        setSources([])
        setYoutubeUrl('')
        setWebUrl('')
        setSelectedFiles([])
        setError('')
      },
      onError: (error) => {
        setError('Failed to create session. Please try again.')
        console.error('Create session error:', error)
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      onClose()
      setSources([])
      setYoutubeUrl('')
      setWebUrl('')
      setSelectedFiles([])
      setError('')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed')
        return
      }
      uploadFile(file, {
        onError: () => {
          setError('Failed to upload file. Please try again.')
        }
      })
    }
  }

  const handleFileSelect = (file: FileItem) => {
    setSelectedFiles(prev => {
      const isAlreadySelected = prev.some(f => f.id === file.id)
      if (isAlreadySelected) {
        return prev.filter(f => f.id !== file.id)
      } else {
        return [...prev, file]
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-50/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-6">
            {/* Instructional Header */}
            <div className="text-center pb-2">
              <p className="text-sm text-gray-500">
                Add any combination of sources to create your learning session
              </p>
            </div>

            {/* Added Sources Summary */}
            {sources.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Added Sources ({sources.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-md">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {source.type === SourceType.YOUTUBE && <Youtube className="h-4 w-4 text-gray-600 flex-shrink-0" />}
                        {source.type === SourceType.WEB_PAGE && <Globe className="h-4 w-4 text-gray-600 flex-shrink-0" />}
                        {source.type === SourceType.PDF && <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />}
                        <span className="text-sm text-gray-700 truncate">
                          {source.title || source.url}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSource(index)}
                        className="p-1 h-6 w-6 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Input Cards */}
            <div className="grid gap-4">
              {/* YouTube Card */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Youtube className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">YouTube Video</h3>
                    <p className="text-xs text-gray-500">Paste any YouTube video URL</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    disabled={isPending}
                  />
                  {youtubeUrl.trim() && <Button
                    type="button"
                    onClick={addYouTubeSource}
                    disabled={isPending || !youtubeUrl.trim()}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>}
                </div>
              </div>

              {/* Web Page Card */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Web Page</h3>
                    <p className="text-xs text-gray-500">Add any website or article URL</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    disabled={isPending}
                  />
                  {webUrl.trim() && <Button
                    type="button"
                    onClick={addWebSource}
                    disabled={isPending || !webUrl.trim()}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>}
                </div>
              </div>

              {/* PDF Files Card */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">PDF Documents</h3>
                      <p className="text-xs text-gray-500">Select PDF files</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPending}
                    className="gap-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    {uploadPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* File List */}
                <div className="mt-3">
                  {filesLoading ? (
                    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-md">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Loading files...</span>
                    </div>
                  ) : files && files.length > 0 ? (
                    (() => {
                      const availableFiles = files.filter(file => {
                        // Filter out files that are already added as sources
                        const isAlreadyAdded = sources.some(source => 
                          source.type === SourceType.PDF && source.url === `/files/${file.filename}`
                        )
                        return !isAlreadyAdded
                      })
                      
                      return availableFiles.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                          <div className="divide-y divide-gray-200">
                            {availableFiles.map((file) => {
                              const isSelected = selectedFiles.some(f => f.id === file.id)
                              return (
                                <div
                                  key={file.id}
                                  className={`p-2 hover:bg-gray-50 cursor-pointer transition-colors group ${
                                    isSelected ? 'bg-gray-100 border-l-4 border-l-gray-500' : ''
                                  }`}
                                  onClick={() => handleFileSelect(file)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="pl-2 text-sm text-gray-900 truncate">
                                        {file.original_filename}
                                      </span>
                                      {isSelected && (
                                        <div className="h-2 w-2 bg-gray-500 rounded-full flex-shrink-0" />
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteFile(file.filename)
                                      }}
                                      className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-700 transition-opacity p-1 h-6 w-6"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-md p-4 text-center">
                          <p className="text-sm text-gray-500">All PDF files have been added to the session</p>
                        </div>
                      )
                    })()
                  ) : null}

                  {/* Add Selected PDFs Button */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 font-medium">
                          {selectedFiles.length} PDF{selectedFiles.length > 1 ? 's' : ''} selected
                        </p>
                        <Button
                          type="button"
                          onClick={addPdfSources}
                          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 text-sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                <p className="text-sm text-gray-700">{error}</p>
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
              disabled={isPending || sources.length === 0}
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