import { X, MessageCircle, HelpCircle, Search, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'
import { useAddMessage, useCreateChat, useGetChat } from '@/service/queries'
import { Button } from './ui/button'
import type { Message } from '@/service/types'

type TreeNode = {
    id: string
    title: string
    description: string
    x: number
    y: number
    width: number
    height: number
    children: TreeNode[]
    parent?: TreeNode
}

type ChatType = 'normal' | 'quiz' | 'deepdive'

interface ChatDrawerProps {
    selectedNodeId: string | null
    onClose: () => void
    allNodes: TreeNode[]
    sessionId: string
}

export function ChatDrawer({ selectedNodeId, onClose, allNodes, sessionId }: ChatDrawerProps) {
    const [chatType, setChatType] = useState<ChatType>('normal')
    const [isExpanded, setIsExpanded] = useState(false)
    const [message, setMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { data: chat } = useGetChat(sessionId, selectedNodeId ?? '', chatType)
    const { mutate: createChat, isPending: isCreatingChat } = useCreateChat()
    const { mutate: addMessage, isPending: isAddingMessage } = useAddMessage()

    const selectedNode = allNodes.find(node => node.id === selectedNodeId)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chat?.messages])

    const chatTypes: {
        key: ChatType;
        label: string;
        description: string;
        icon: React.ComponentType<{ className?: string }>
    }[] = [
            {
                key: 'normal',
                label: 'Normal',
                description: 'Have a regular conversation about this topic. Ask questions, get explanations, and explore the content naturally.',
                icon: MessageCircle
            },
            {
                key: 'quiz',
                label: 'Quiz',
                description: 'Test your knowledge with interactive questions and challenges based on this topic. Perfect for reinforcing learning.',
                icon: HelpCircle
            },
            {
                key: 'deepdive',
                label: 'Deep Dive',
                description: 'Explore advanced concepts, related topics, and gain deeper insights. Ideal for comprehensive understanding.',
                icon: Search
            }
        ]

    const currentChatType = chatTypes.find(type => type.key === chatType)

    const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (chat && message && selectedNodeId) {
            addMessage({ 
                chatId: chat.id.toString(), 
                content: message,
                sessionId,
                nodeId: selectedNodeId,
                chatType
            })
            setMessage('')
            // Scroll to bottom immediately after sending
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        }
    }

    return (
        <div className={`absolute top-0 right-0 h-full bg-white shadow-lg border-l border-gray-200 transition-all duration-300 flex flex-col ${isExpanded ? 'w-full' : 'w-96'
            }`}>
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title={isExpanded ? "Collapse drawer" : "Expand drawer"}
                        >
                            {isExpanded ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </button>
                        <h3 className="text-lg font-semibold">{selectedNode?.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Close chat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>


                {/* Chat Type Toggle Buttons */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-2">
                    {chatTypes.map(({ key, label, icon: Icon }) => (
                        <Tooltip key={key}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setChatType(key)}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${chatType === key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>

            {chat ?
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                        {chat.messages.map((message: Message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`${isExpanded ? 'max-w-[60%]' : 'max-w-full'} p-3 rounded-lg ${
                                        message.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}
                                >
                                    {message.role === 'user' ? (
                                        <p className="text-sm">{message.content}</p>
                                    ) : (
                                        <div className="text-sm markdown-content">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Headings
                                                    h1: ({ children }) => (
                                                        <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>
                                                    ),
                                                    h2: ({ children }) => (
                                                        <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>
                                                    ),
                                                    h3: ({ children }) => (
                                                        <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>
                                                    ),
                                                    // Paragraphs
                                                    p: ({ children }) => (
                                                        <p className="mb-2 text-gray-900 leading-relaxed">{children}</p>
                                                    ),
                                                    // Lists
                                                    ul: ({ children }) => (
                                                        <ul className="list-disc list-inside mb-2 text-gray-900 space-y-1">{children}</ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol className="list-decimal list-inside mb-2 text-gray-900 space-y-1">{children}</ol>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li className="text-gray-900">{children}</li>
                                                    ),
                                                    // Code blocks
                                                    pre: ({ children }) => (
                                                        <pre className="bg-gray-200 p-3 rounded-md text-xs overflow-x-auto mb-2 text-gray-900">
                                                            {children}
                                                        </pre>
                                                    ),
                                                    // Inline code
                                                    code: ({ children }) => (
                                                        <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs text-gray-900 font-mono">
                                                            {children}
                                                        </code>
                                                    ),
                                                    // Strong/Bold
                                                    strong: ({ children }) => (
                                                        <strong className="font-bold text-gray-900">{children}</strong>
                                                    ),
                                                    // Emphasis/Italic
                                                    em: ({ children }) => (
                                                        <em className="italic text-gray-900">{children}</em>
                                                    ),
                                                    // Links
                                                    a: ({ children, href }) => (
                                                        <a 
                                                            href={href} 
                                                            className="text-blue-600 underline hover:text-blue-800"
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                        >
                                                            {children}
                                                        </a>
                                                    ),
                                                    // Blockquotes
                                                    blockquote: ({ children }) => (
                                                        <blockquote className="border-l-4 border-gray-300 pl-4 mb-2 italic text-gray-700">
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                        <form className="flex gap-2 items-center" onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <Button size="sm" type="submit" disabled={isAddingMessage}>
                                {isAddingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </div>
                </div>
                :
                <>
                    <div className="mb-4 p-3 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                            {currentChatType && <currentChatType.icon className="h-4 w-4 text-blue-600" />}
                            <span className="font-medium text-blue-900">{currentChatType?.label} Mode</span>
                        </div>
                        <p className="text-sm text-blue-800">
                            {currentChatType?.description}
                        </p>
                    </div>
                    <div className="flex flex-col items-center flex-1 gap-4">
                        <Button onClick={() => {
                            createChat({ sessionId, nodeId: selectedNodeId ?? '', chatType })
                        }} disabled={isCreatingChat}>
                            {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Chat'}
                        </Button>
                    </div>
                </>

            }
        </div>
    )
} 