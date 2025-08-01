import type { ReactNode } from 'react'

type LayoutProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 transition-all duration-200 hover:w-80 bg-white border-r border-gray-200 flex flex-col">
        {sidebar}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
} 