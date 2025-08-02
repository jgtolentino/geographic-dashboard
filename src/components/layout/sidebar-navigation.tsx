'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Package, 
  Users, 
  UserCheck, 
  Brain,
  ChevronLeft,
  BarChart3,
  Home
} from 'lucide-react'
import { DASHBOARD_MODULES } from '@/types/scout-dashboard'

interface SidebarNavigationProps {
  className?: string
  onModuleChange?: (moduleId: string) => void
  currentModule?: string
}

const moduleIcons: Record<string, any> = {
  'transaction-trends': TrendingUp,
  'product-mix': Package,
  'consumer-behavior': Users,
  'consumer-profiling': UserCheck,
}

export function SidebarNavigation({ 
  className, 
  onModuleChange,
  currentModule = 'transaction-trends'
}: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={cn(
      "h-full bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center space-x-3 transition-opacity",
              isCollapsed && "opacity-0"
            )}>
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Scout Dashboard</h2>
                <p className="text-xs text-muted-foreground">Real-time Analytics</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          <Button
            variant={currentModule === 'home' ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center"
            )}
            onClick={() => onModuleChange?.('home')}
          >
            <Home className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3">Overview</span>}
          </Button>

          {DASHBOARD_MODULES.map((module) => {
            const Icon = moduleIcons[module.id] || BarChart3
            const isActive = currentModule === module.id

            return (
              <Button
                key={module.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "justify-center"
                )}
                onClick={() => onModuleChange?.(module.id)}
              >
                <Icon className="h-4 w-4" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3">{module.name}</span>
                    {module.id === 'transaction-trends' && (
                      <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800">
                        Live
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            )
          })}
        </nav>

        {/* AI Assistant */}
        <div className={cn(
          "p-4 border-t border-border",
          isCollapsed && "p-2"
        )}>
          <Button
            variant="default"
            className={cn(
              "w-full bg-gradient-to-r from-azure-blue to-azure-blueDark",
              isCollapsed && "px-0"
            )}
          >
            <Brain className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">AI Assistant</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}