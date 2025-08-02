'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Share2, 
  RefreshCw, 
  Bell,
  Settings,
  User
} from 'lucide-react'

interface TopNavigationProps {
  title?: string
  lastUpdated?: Date
}

export function TopNavigation({ 
  title = "Scout Platform v5",
  lastUpdated = new Date()
}: TopNavigationProps) {
  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <Badge variant="outline" className="text-azure-blue border-azure-blue/20">
            Real-time Data
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button variant="default" size="sm" className="btn-primary-azure">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <div className="h-8 w-px bg-border mx-2" />

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}