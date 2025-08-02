import { Link, useParams } from 'react-router'
import { useGetSession } from '@/service/queries'
import { ExternalLink, FileText, Globe, Youtube } from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import { type MindmapNode, type Mindmap, SourceType } from '@/service/types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

import { ChatDrawer } from './ChatDrawer'

// Tree node with position information
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

// Configuration constants
const NODE_WIDTH = 200
const NODE_HEIGHT = 100
const HORIZONTAL_SPACING = 100
const VERTICAL_SPACING = 150
const GRID_SIZE = 20

// First pass: calculate subtree widths
function calculateSubtreeWidth(mindmapNode: MindmapNode): number {
    if (!mindmapNode.children || mindmapNode.children.length === 0) {
        return NODE_WIDTH
    }

    const childrenWidths = mindmapNode.children.map(child => calculateSubtreeWidth(child))
    const totalChildrenWidth = childrenWidths.reduce((sum, width) => sum + width, 0)
    const spacingWidth = (mindmapNode.children.length - 1) * HORIZONTAL_SPACING

    return Math.max(NODE_WIDTH, totalChildrenWidth + spacingWidth)
}

function calculateTreeLayout(mindmapNode: MindmapNode, parentX = 0, parentY = 0, level = 0): TreeNode {
    // Create the tree node using the backend-provided node_id
    const treeNode: TreeNode = {
        id: mindmapNode.node_id,
        title: mindmapNode.title,
        description: mindmapNode.description,
        x: parentX,
        y: parentY + level * (NODE_HEIGHT + VERTICAL_SPACING),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        children: []
    }

    // Calculate children positions
    if (mindmapNode.children && mindmapNode.children.length > 0) {
        // Calculate width needed for each child subtree
        const childSubtreeWidths = mindmapNode.children.map(child => calculateSubtreeWidth(child))
        const totalWidth = childSubtreeWidths.reduce((sum, width) => sum + width, 0) +
            (mindmapNode.children.length - 1) * HORIZONTAL_SPACING

        // Start positioning from the left edge of the total width, centered under parent
        let currentX = parentX + NODE_WIDTH / 2 - totalWidth / 2

        treeNode.children = mindmapNode.children.map((child, index) => {
            // Position this child at the center of its allocated subtree width
            const childCenterX = currentX + childSubtreeWidths[index] / 2 - NODE_WIDTH / 2
            const childNode = calculateTreeLayout(child, childCenterX, treeNode.y, level + 1)
            childNode.parent = treeNode

            // Move to the next position
            currentX += childSubtreeWidths[index] + HORIZONTAL_SPACING

            return childNode
        })
    }

    return treeNode
}

function getAllNodes(rootNode: TreeNode): TreeNode[] {
    const nodes: TreeNode[] = [rootNode]

    function traverse(node: TreeNode) {
        node.children.forEach(child => {
            nodes.push(child)
            traverse(child)
        })
    }

    traverse(rootNode)
    return nodes
}

function GridBackground({ viewBox, gridSize }: { viewBox: string, gridSize: number }) {
    const [minX, minY, width, height] = viewBox.split(' ').map(Number)

    const lines = []

    // Vertical lines
    for (let x = Math.floor(minX / gridSize) * gridSize; x <= minX + width; x += gridSize) {
        lines.push(
            <line
                key={`v-${x}`}
                x1={x}
                y1={minY}
                x2={x}
                y2={minY + height}
                stroke="#e5e7eb"
                strokeWidth="0.5"
            />
        )
    }

    // Horizontal lines  
    for (let y = Math.floor(minY / gridSize) * gridSize; y <= minY + height; y += gridSize) {
        lines.push(
            <line
                key={`h-${y}`}
                x1={minX}
                y1={y}
                x2={minX + width}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
            />
        )
    }

    return <g className="grid-background">{lines}</g>
}

function TreeBranches({ nodes }: { nodes: TreeNode[] }) {
    const branches = nodes
        .filter(node => node.parent)
        .map(node => {
            const parent = node.parent!
            const startX = parent.x + parent.width / 2
            const startY = parent.y + parent.height
            const endX = node.x + node.width / 2
            const endY = node.y

            // Create curved path
            const midY = startY + (endY - startY) / 2
            const pathData = `M ${startX} ${startY} 
                       C ${startX} ${midY} 
                         ${endX} ${midY} 
                         ${endX} ${endY}`

            return (
                <path
                    key={`branch-${node.id}`}
                    d={pathData}
                    stroke="#6b7280"
                    strokeWidth="2"
                    fill="none"
                    className="tree-branch"
                />
            )
        })

    return <g className="tree-branches">{branches}</g>
}

function TreeNodeComponent({ node, onNodeClick }: { node: TreeNode, onNodeClick: (nodeId: string) => void }) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <g
            className="tree-node"
            transform={`translate(${node.x}, ${node.y})`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation()
                onNodeClick(node.id)
            }}
        >
            {/* Node background */}
            <rect
                width={node.width}
                height={node.height}
                rx="8"
                fill="white"
                stroke={isHovered ? "#3b82f6" : "#d1d5db"}
                strokeWidth={isHovered ? "2" : "1"}
                className="node-background transition-all duration-200"
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))"
            />

            {/* Node content */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <foreignObject width={node.width} height={node.height}>
                        <div className="p-3 h-full flex flex-col relative ">
                            <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                                {node.title}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-3 flex-1">
                                {node.description}
                            </p>
                        </div>
                    </foreignObject>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{node.title}</p>
                </TooltipContent>
            </Tooltip>
        </g>
    )
}

function TreeMindmap({ mindmap, sessionId }: { mindmap: Mindmap, sessionId: string }) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    // Overlay hover state to toggle structure visibility
    const [isStructureHovered, setIsStructureHovered] = useState(false)
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

    const handleNodeClick = (nodeId: string) => {
        // Only zoom out if chat drawer is not already open
        if (!selectedNodeId) {
            setZoom(prev => Math.max(0.5, prev * 0.7))
        }
        setSelectedNodeId(nodeId)
    }

    const handleCloseChat = () => {
        setSelectedNodeId(null)
        setZoom(prev => Math.min(3, prev / 0.7))
    }

    // Calculate tree layout
    const rootNode = calculateTreeLayout(mindmap, 0, 0)
    const allNodes = getAllNodes(rootNode)

    // Calculate bounds
    const bounds = allNodes.reduce(
        (acc, node) => ({
            minX: Math.min(acc.minX, node.x),
            maxX: Math.max(acc.maxX, node.x + node.width),
            minY: Math.min(acc.minY, node.y),
            maxY: Math.max(acc.maxY, node.y + node.height),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    )

    const padding = 200
    const viewBoxWidth = (bounds.maxX - bounds.minX + padding * 2) / zoom
    const viewBoxHeight = (bounds.maxY - bounds.minY + padding * 2) / zoom
    const viewBoxX = bounds.minX - padding - pan.x
    const viewBoxY = bounds.minY - padding - pan.y

    const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true)
            setDragStart({ 
                x: e.clientX, 
                y: e.clientY 
            })
        }
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return

        // Calculate mouse delta and scale by inverse of zoom for consistent drag speed
        // Multiply by 2 to increase drag speed
        const scaleFactor = (1 / zoom) * 3
        const deltaX = (e.clientX - dragStart.x) * scaleFactor
        const deltaY = (e.clientY - dragStart.y) * scaleFactor
        
        setPan(prevPan => ({
            x: prevPan.x + deltaX,
            y: prevPan.y + deltaY
        }))
        
        // Update drag start to current position for next delta calculation
        setDragStart({ x: e.clientX, y: e.clientY })
    }, [isDragging, dragStart, zoom])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()

        const zoomFactor = 0.1
        const zoomDelta = e.deltaY > 0 ? -zoomFactor : zoomFactor
        const newZoom = Math.max(0.75, Math.min(6, zoom + zoomDelta))

        // Get mouse position relative to SVG
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            // Calculate the point in SVG coordinates
            const svgPoint = {
                x: (mouseX / rect.width) * viewBoxWidth + viewBoxX,
                y: (mouseY / rect.height) * viewBoxHeight + viewBoxY
            }

            // Adjust pan to keep the mouse point stable during zoom
            const zoomRatio = newZoom / zoom
            const newViewBoxWidth = viewBoxWidth / zoomRatio
            const newViewBoxHeight = viewBoxHeight / zoomRatio

            const newViewBoxX = svgPoint.x - (mouseX / rect.width) * newViewBoxWidth
            const newViewBoxY = svgPoint.y - (mouseY / rect.height) * newViewBoxHeight

            const newPan = {
                x: -(newViewBoxX - (bounds.minX - padding)),
                y: -(newViewBoxY - (bounds.minY - padding))
            }

            setPan(newPan)
        }

        setZoom(newZoom)
    }, [zoom, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight, bounds])

    const centerOnRoot = useCallback(() => {
        // Center the view on the root node
        const rootCenterX = rootNode.x + rootNode.width / 2
        const rootCenterY = rootNode.y + rootNode.height / 2

        setPan({
            x: bounds.minX - padding + viewBoxWidth / 2 - rootCenterX,
            y: bounds.minY - padding + viewBoxHeight / 2 - rootCenterY
        })
    }, [rootNode, bounds, padding, viewBoxWidth, viewBoxHeight])

    const resetZoom = useCallback(() => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }, [])

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(3, prev + 0.2))
    }, [])

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(0.1, prev - 0.2))
    }, [])

    // Center the view on an arbitrary node
    const centerOnNode = useCallback(
        (targetNode: TreeNode) => {
            const newZoom = Math.min(3, zoom * 2)

            // Compute the viewBox dimensions that will be used after zooming
            const newViewBoxWidth = (bounds.maxX - bounds.minX + padding * 2) / newZoom
            const newViewBoxHeight = (bounds.maxY - bounds.minY + padding * 2) / newZoom

            const nodeCenterX = targetNode.x + targetNode.width / 2
            const nodeCenterY = targetNode.y + targetNode.height / 2

            // Update pan so that the chosen node is centered
            setPan({
                x: bounds.minX - padding + newViewBoxWidth / 2 - nodeCenterX,
                y: bounds.minY - padding + newViewBoxHeight / 2 - nodeCenterY,
            })

            // Finally set the new zoom level
            setZoom(newZoom)
        },
        [zoom, bounds, padding]
    )

    const renderNodeList = (node: TreeNode, depth = 0): React.ReactElement[] => {
        const items: React.ReactElement[] = []
        items.push(
            <div
                key={node.id}
                onClick={() => centerOnNode(node)}
                className="cursor-pointer hover:bg-gray-100 px-6 py-1 text-sm text-gray-800"
                style={{ paddingLeft: (depth + 1) * (depth + 1) * 6 }}
            >
                {">".repeat(depth)} {node.title}
            </div>
        )
        node.children.forEach(child => {
            items.push(...renderNodeList(child, depth + 1))
        })
        return items
    }

    return (
        <div className="w-full h-full overflow-hidden bg-gray-50 relative">
            <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                viewBox={viewBox}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <GridBackground viewBox={viewBox} gridSize={GRID_SIZE} />
                <TreeBranches nodes={allNodes} />
                {allNodes.map(node => (
                    <TreeNodeComponent key={node.id} node={node} onNodeClick={handleNodeClick} />
                ))}
            </svg>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg flex flex-col gap-1">
                <button
                    onClick={zoomIn}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-700 font-bold"
                    title="Zoom In"
                >
                    +
                </button>
                <div className="text-xs text-center text-gray-600 py-1">
                    {Math.round(zoom * 100)}%
                </div>
                <button
                    onClick={zoomOut}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-700 font-bold"
                    title="Zoom Out"
                >
                    −
                </button>
                <hr className="border-gray-300 my-1" />
                <button
                    onClick={centerOnRoot}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-700 text-xs"
                    title="Center on Root"
                >
                    ⌂
                </button>
                <button
                    onClick={resetZoom}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-700 text-xs"
                    title="Reset Zoom"
                >
                    ⚏
                </button>
            </div>

            {/* Tree Structure Overlay */}
            <div
                className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg"
                onMouseEnter={() => setIsStructureHovered(true)}
                onMouseLeave={() => setIsStructureHovered(false)}
            >
                {isStructureHovered ? (
                    <div className="max-h-80 overflow-auto min-w-[200px]">
                        {renderNodeList(rootNode)}
                    </div>
                ) : (
                    <div className="p-3 font-semibold text-gray-800 text-sm cursor-default">
                        Tree Structure
                    </div>
                )}
            </div>

            {selectedNodeId && <ChatDrawer 
                selectedNodeId={selectedNodeId}
                onClose={handleCloseChat}
                allNodes={allNodes}
                sessionId={sessionId}
            />}
        </div>
    )
}

export function SessionView() {
    const { sessionId } = useParams()
    const { data: session, isLoading, error } = useGetSession(sessionId || '')

    if (!sessionId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Session Selected</h2>
                    <p className="text-gray-600">Please select a session to view</p>
                </div>
            </div>
        )
    }

    if (isLoading || !session) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <div className="text-red-500 mb-4">
                        <FileText className="h-12 w-12 mx-auto mb-2" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Session</h2>
                    <p className="text-gray-600">{error.message}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="select-none h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {session.title}
                    </h1>

                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {session.sources.map((source) => (
                            <Link
                                key={source.id}
                                to={source.url}
                                target="_blank"
                                className="flex items-center gap-2 bg-gray-100 text-gray-900 px-2 py-1"
                            >
                                {source.type === SourceType.YOUTUBE && <Youtube className="h-4 w-4" />}
                                {source.type === SourceType.PDF && <FileText className="h-4 w-4" />}
                                {source.type === SourceType.WEB_PAGE && <Globe className="h-4 w-4" />}
                                <Tooltip delayDuration={500}>
                                    <TooltipTrigger asChild>
                                        <span>{source.title.slice(0, 20)}...</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" align="center">
                                        <span>{source.title}</span>
                                    </TooltipContent>
                                </Tooltip>
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tree Mindmap */}
            <div className="flex-1 min-h-0">
                <TreeMindmap mindmap={session.mindmap} sessionId={sessionId} />
            </div>
        </div>
    )
}
