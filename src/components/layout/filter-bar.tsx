'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Filter,
  X,
  Calendar,
  MapPin,
  Package,
  Users,
  ShoppingCart
} from 'lucide-react'
import { FilterState } from '@/types/scout-dashboard'

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableFilters?: {
    timeOfDay?: string[]
    barangay?: string[]
    region?: string[]
    category?: string[]
    brand?: string[]
    ageGroup?: string[]
  }
}

export function FilterBar({ 
  filters, 
  onFilterChange,
  availableFilters = {}
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== 'all' && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  const clearAllFilters = () => {
    onFilterChange({})
  }

  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFilterChange(newFilters)
  }

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Quick Filters */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Time
            </Button>
            <Button variant="ghost" size="sm">
              <MapPin className="h-4 w-4 mr-1" />
              Location
            </Button>
            <Button variant="ghost" size="sm">
              <Package className="h-4 w-4 mr-1" />
              Category
            </Button>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Demographics
            </Button>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.timeOfDay && filters.timeOfDay.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              <Calendar className="h-3 w-3 mr-1" />
              Time: {Array.isArray(filters.timeOfDay) 
                ? filters.timeOfDay.join(', ') 
                : filters.timeOfDay}
              <button
                onClick={() => removeFilter('timeOfDay')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.barangay && filters.barangay.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              <MapPin className="h-3 w-3 mr-1" />
              Barangay: {Array.isArray(filters.barangay) 
                ? filters.barangay.join(', ') 
                : filters.barangay}
              <button
                onClick={() => removeFilter('barangay')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.category && filters.category !== 'all' && (
            <Badge variant="secondary" className="px-3 py-1">
              <Package className="h-3 w-3 mr-1" />
              Category: {Array.isArray(filters.category) 
                ? filters.category.join(', ') 
                : filters.category}
              <button
                onClick={() => removeFilter('category')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.weekVsWeekend && filters.weekVsWeekend !== 'all' && (
            <Badge variant="secondary" className="px-3 py-1">
              <Calendar className="h-3 w-3 mr-1" />
              {filters.weekVsWeekend === 'week' ? 'Weekdays' : 'Weekends'}
              <button
                onClick={() => removeFilter('weekVsWeekend')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.basketSize && filters.basketSize.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Basket: {Array.isArray(filters.basketSize) 
                ? filters.basketSize.join(', ') 
                : filters.basketSize} items
              <button
                onClick={() => removeFilter('basketSize')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Filter dropdowns would go here */}
            <div className="text-sm text-muted-foreground">
              Advanced filters panel...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}