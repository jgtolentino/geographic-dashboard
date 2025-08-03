// ====================================================================
// LIGHTWEIGHT PHILIPPINES CHOROPLETH - OPTIMIZED FOR SMALL BUNDLE SIZE
// ====================================================================

import React, { useState, useMemo } from 'react'
import { MapPin, TrendingUp, Users, BarChart3 } from 'lucide-react'

interface RegionData {
  region: string
  transactions: number
  revenue: number
  stores: number
  avgTransaction: number
}

interface LightweightChoroplethProps {
  data: RegionData[]
  title?: string
  metricType?: 'transactions' | 'revenue' | 'stores'
}

// Simplified Philippines regions (reduced coordinates for smaller bundle)
const PHILIPPINES_REGIONS = {
  'NCR': { path: 'M300,180 L320,180 L320,195 L300,195 Z', center: [310, 187] },
  'Central Luzon': { path: 'M280,160 L320,160 L320,185 L280,185 Z', center: [300, 172] },
  'Calabarzon': { path: 'M295,185 L330,185 L330,205 L295,205 Z', center: [312, 195] },
  'Central Visayas': { path: 'M320,220 L350,220 L350,245 L320,245 Z', center: [335, 232] },
  'Western Visayas': { path: 'M290,215 L320,215 L320,235 L290,235 Z', center: [305, 225] },
  'Eastern Visayas': { path: 'M340,210 L365,210 L365,240 L340,240 Z', center: [352, 225] },
  'Davao Region': { path: 'M350,270 L375,270 L375,290 L350,290 Z', center: [362, 280] },
  'Northern Mindanao': { path: 'M325,250 L355,250 L355,270 L325,270 Z', center: [340, 260] }
}

export function LightweightPhilippinesChoropleth({ 
  data = [], 
  title = "Regional Transaction Distribution",
  metricType = 'transactions' 
}: LightweightChoroplethProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  // Memoized calculations for performance
  const { maxValue, colorScale } = useMemo(() => {
    const getMetricValue = (regionData: RegionData) => {
      switch (metricType) {
        case 'revenue': return regionData.revenue
        case 'stores': return regionData.stores
        default: return regionData.transactions
      }
    }
    
    const max = Math.max(...data.map(getMetricValue))
    
    const scale = (value: number) => {
      if (max === 0) return 0
      return (value / max) * 0.8 + 0.1
    }
    
    return { maxValue: max, colorScale: scale }
  }, [data, metricType])

  const getRegionColor = (regionName: string) => {
    const regionData = data.find(d => d.region === regionName || d.region.includes(regionName))
    if (!regionData) return '#f3f4f6'
    
    const value = metricType === 'revenue' ? regionData.revenue : 
                  metricType === 'stores' ? regionData.stores : 
                  regionData.transactions
    
    const intensity = colorScale(value)
    
    const colors = {
      transactions: `rgba(59, 130, 246, ${intensity})`,
      revenue: `rgba(16, 185, 129, ${intensity})`,
      stores: `rgba(245, 158, 11, ${intensity})`
    }
    
    return colors[metricType]
  }

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'revenue': return `₱${(value / 1000).toFixed(0)}K`
      case 'stores': return value.toString()
      default: return value.toLocaleString()
    }
  }

  const selectedData = selectedRegion ? 
    data.find(d => d.region === selectedRegion || d.region.includes(selectedRegion)) : null

  const totals = useMemo(() => ({
    transactions: data.reduce((sum, region) => sum + region.transactions, 0),
    revenue: data.reduce((sum, region) => sum + region.revenue, 0),
    stores: data.reduce((sum, region) => sum + region.stores, 0),
    regions: data.length
  }), [data])

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-blue-500" />
            {title}
          </h3>
          <p className="text-sm text-gray-600">Geographic distribution across Philippine regions</p>
        </div>
        
        {/* Lightweight Metric Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'transactions', label: 'Txns', icon: BarChart3, color: 'blue' },
            { key: 'revenue', label: 'Revenue', icon: TrendingUp, color: 'green' },
            { key: 'stores', label: 'Stores', icon: Users, color: 'orange' }
          ].map(({ key, label, icon: Icon, color }) => (
            <div
              key={key}
              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center cursor-pointer transition-colors ${
                metricType === key
                  ? `bg-white text-${color}-600 shadow-sm`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lightweight SVG Map */}
        <div className="lg:col-span-2">
          <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg p-4">
            <svg viewBox="0 0 500 350" className="w-full h-80">
              {/* Background */}
              <rect width="500" height="350" fill="#dbeafe" />
              
              {/* Title */}
              <text x="250" y="25" textAnchor="middle" className="text-sm font-semibold" fill="#374151">
                Philippines - {metricType.charAt(0).toUpperCase() + metricType.slice(1)}
              </text>

              {/* Render Regions */}
              {Object.entries(PHILIPPINES_REGIONS).map(([regionName, coords]) => {
                const regionData = data.find(d => d.region === regionName || d.region.includes(regionName))
                const isHovered = hoveredRegion === regionName
                const isSelected = selectedRegion === regionName
                
                return (
                  <g key={regionName}>
                    {/* Region Shape */}
                    <path
                      d={coords.path}
                      fill={getRegionColor(regionName)}
                      stroke={isSelected ? "#1d4ed8" : isHovered ? "#3b82f6" : "#e5e7eb"}
                      strokeWidth={isSelected ? "2" : isHovered ? "1.5" : "1"}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredRegion(regionName)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => setSelectedRegion(regionName)}
                    />
                    
                    {/* Region Label */}
                    <text
                      x={coords.center[0]}
                      y={coords.center[1]}
                      textAnchor="middle"
                      className="text-xs font-medium pointer-events-none"
                      fill="#374151"
                      fontSize="8"
                    >
                      {regionName === 'NCR' ? 'NCR' : regionName.split(' ')[0]}
                    </text>
                    
                    {/* Data Value on Hover */}
                    {(isHovered || isSelected) && regionData && (
                      <text
                        x={coords.center[0]}
                        y={coords.center[1] - 15}
                        textAnchor="middle"
                        className="text-xs font-bold pointer-events-none"
                        fill="#1f2937"
                        fontSize="10"
                      >
                        {formatValue(
                          metricType === 'revenue' ? regionData.revenue : 
                          metricType === 'stores' ? regionData.stores : 
                          regionData.transactions, 
                          metricType
                        )}
                      </text>
                    )}
                  </g>
                )
              })}
              
              {/* Lightweight Legend */}
              <g transform="translate(20, 300)">
                <text x="0" y="0" className="text-xs font-medium" fill="#6b7280">
                  {metricType === 'transactions' ? 'Transaction Volume' :
                   metricType === 'revenue' ? 'Revenue (₱K)' : 'Store Count'}
                </text>
                
                <rect x="0" y="10" width="80" height="8" fill="url(#gradient)" stroke="#e5e7eb" strokeWidth="0.5" />
                <text x="0" y="25" className="text-xs" fill="#6b7280">Low</text>
                <text x="75" y="25" className="text-xs" fill="#6b7280">High</text>
                
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={
                      metricType === 'transactions' ? 'rgba(59, 130, 246, 0.1)' :
                      metricType === 'revenue' ? 'rgba(16, 185, 129, 0.1)' :
                      'rgba(245, 158, 11, 0.1)'
                    } />
                    <stop offset="100%" stopColor={
                      metricType === 'transactions' ? 'rgba(59, 130, 246, 0.9)' :
                      metricType === 'revenue' ? 'rgba(16, 185, 129, 0.9)' :
                      'rgba(245, 158, 11, 0.9)'
                    } />
                  </linearGradient>
                </defs>
              </g>
            </svg>
          </div>
        </div>

        {/* Compact Region Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            {selectedData ? `${selectedRegion} Details` : 'Region Overview'}
          </h4>
          
          {selectedData ? (
            <div className="space-y-3">
              {[
                { label: 'Transactions', value: selectedData.transactions.toLocaleString(), color: 'blue' },
                { label: 'Revenue', value: `₱${(selectedData.revenue / 1000).toFixed(0)}K`, color: 'green' },
                { label: 'Stores', value: selectedData.stores.toString(), color: 'orange' },
                { label: 'Avg Transaction', value: `₱${selectedData.avgTransaction.toFixed(0)}`, color: 'purple' }
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600">{label}</div>
                  <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Click on a region to view detailed metrics
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Top Regions:</div>
                {data
                  .sort((a, b) => 
                    (metricType === 'revenue' ? b.revenue - a.revenue :
                     metricType === 'stores' ? b.stores - a.stores :
                     b.transactions - a.transactions)
                  )
                  .slice(0, 4)
                  .map((region, index) => (
                    <div 
                      key={region.region}
                      className="flex justify-between items-center text-xs cursor-pointer hover:bg-white hover:shadow-sm p-2 rounded transition-colors"
                      onClick={() => setSelectedRegion(region.region)}
                    >
                      <span className="font-medium">
                        {index + 1}. {region.region.length > 15 ? `${region.region.slice(0, 15)}...` : region.region}
                      </span>
                      <span className="text-gray-600">
                        {formatValue(
                          metricType === 'revenue' ? region.revenue : 
                          metricType === 'stores' ? region.stores : 
                          region.transactions, 
                          metricType
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
        {[
          { label: 'Total Transactions', value: totals.transactions.toLocaleString(), color: 'blue' },
          { label: 'Total Revenue', value: `₱${(totals.revenue / 1000000).toFixed(1)}M`, color: 'green' },
          { label: 'Total Stores', value: totals.stores.toString(), color: 'orange' },
          { label: 'Active Regions', value: totals.regions.toString(), color: 'purple' }
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LightweightPhilippinesChoropleth
