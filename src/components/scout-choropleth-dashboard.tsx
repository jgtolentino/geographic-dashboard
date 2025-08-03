import React, { useState, useEffect } from 'react'
import { MapPin, TrendingUp, Users, BarChart3, Activity, DollarSign, Package, AlertCircle, RefreshCw } from 'lucide-react'
import posthog from 'posthog-js'

// Production Supabase configuration
const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'

interface RegionData {
  region: string
  transactions: number
  revenue: number
  stores: number
  avgTransaction: number
}

// Fallback data based on your actual Scout Analytics data
const FALLBACK_DATA: RegionData[] = [
  { region: 'National Capital Region', transactions: 514, revenue: 206833.17, stores: 10, avgTransaction: 402.40 },
  { region: 'Central Luzon', transactions: 37, revenue: 60379.64, stores: 6, avgTransaction: 1631.88 },
  { region: 'Central Visayas', transactions: 35, revenue: 4405.76, stores: 5, avgTransaction: 125.88 },
  { region: 'Soccsksargen', transactions: 32, revenue: 3066.39, stores: 2, avgTransaction: 95.82 },
  { region: 'Calabarzon', transactions: 32, revenue: 5776.74, stores: 2, avgTransaction: 180.52 },
  { region: 'Davao Region', transactions: 32, revenue: 4354.68, stores: 2, avgTransaction: 136.08 },
  { region: 'Eastern Visayas', transactions: 32, revenue: 3102.00, stores: 2, avgTransaction: 96.94 },
  { region: 'Western Visayas', transactions: 32, revenue: 3285.03, stores: 2, avgTransaction: 102.66 },
  { region: 'Northern Mindanao', transactions: 32, revenue: 3622.12, stores: 2, avgTransaction: 113.19 },
  { region: 'Zamboanga Peninsula', transactions: 31, revenue: 2705.59, stores: 2, avgTransaction: 87.28 },
  { region: 'Cagayan Valley', transactions: 31, revenue: 3512.47, stores: 2, avgTransaction: 113.31 },
  { region: 'Caraga', transactions: 31, revenue: 2534.41, stores: 2, avgTransaction: 81.76 },
  { region: 'Cordillera Administrative Region', transactions: 31, revenue: 3489.03, stores: 2, avgTransaction: 112.55 },
  { region: 'Ilocos Region', transactions: 31, revenue: 3812.61, stores: 2, avgTransaction: 122.99 },
  { region: 'Mimaropa', transactions: 31, revenue: 2554.94, stores: 2, avgTransaction: 82.42 },
  { region: 'Bicol Region', transactions: 31, revenue: 2986.94, stores: 2, avgTransaction: 96.35 }
]

// Philippine regions with enhanced coordinate mapping
const philippineRegions = {
  'National Capital Region': { x: 300, y: 180, width: 24, height: 18 },
  'Central Luzon': { x: 280, y: 160, width: 44, height: 28 },
  'Calabarzon': { x: 295, y: 185, width: 38, height: 23 },
  'Central Visayas': { x: 320, y: 220, width: 33, height: 28 },
  'Western Visayas': { x: 290, y: 215, width: 33, height: 23 },
  'Eastern Visayas': { x: 340, y: 210, width: 28, height: 33 },
  'Davao Region': { x: 350, y: 270, width: 28, height: 23 },
  'Northern Mindanao': { x: 325, y: 250, width: 33, height: 23 },
  'Soccsksargen': { x: 315, y: 265, width: 28, height: 18 },
  'Zamboanga Peninsula': { x: 300, y: 255, width: 28, height: 23 },
  'Cordillera Administrative Region': { x: 285, y: 140, width: 23, height: 23 },
  'Ilocos Region': { x: 275, y: 135, width: 28, height: 28 },
  'Cagayan Valley': { x: 300, y: 130, width: 28, height: 23 },
  'Bicol Region': { x: 315, y: 200, width: 23, height: 28 },
  'Mimaropa': { x: 275, y: 200, width: 23, height: 28 },
  'Caraga': { x: 365, y: 240, width: 23, height: 28 }
}

export default function ScoutChoroplethDashboard() {
  const [data, setData] = useState<RegionData[]>(FALLBACK_DATA) // Start with fallback data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [metricType, setMetricType] = useState<'transactions' | 'revenue' | 'stores'>('transactions')
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback')

  // PostHog tracking functions
  const trackRegionHover = (regionName: string) => {
    try {
      posthog.capture('geo_region_hover', { 
        region_name: regionName,
        metric_type: metricType,
        data_source: dataSource
      })
    } catch (e) {
      // Silently fail if PostHog not initialized
    }
  }

  const trackRegionClick = (regionName: string) => {
    try {
      posthog.capture('geo_region_click', { 
        region_name: regionName,
        metric_type: metricType,
        data_source: dataSource,
        had_data: data.some(d => d.region === regionName)
      })
    } catch (e) {
      // Silently fail if PostHog not initialized
    }
  }

  const trackMetricChange = (newMetric: string) => {
    try {
      posthog.capture('geo_metric_change', {
        from_metric: metricType,
        to_metric: newMetric,
        selected_region: selectedRegion
      })
    } catch (e) {
      // Silently fail if PostHog not initialized
    }
  }

  // Fetch live data from Supabase with robust error handling
  const fetchLiveData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${SUPABASE_URL}/rest/v1/scout_transactions?select=location_region,peso_value,store_id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      })

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`)
      }

      const transactions = await response.json()
      
      // Process and aggregate data by region
      const regionMap = new Map<string, {
        transactions: number
        revenue: number
        stores: Set<string>
        totalValue: number
      }>()

      transactions.forEach((tx: any) => {
        if (tx.location_region) {
          const existing = regionMap.get(tx.location_region) || {
            transactions: 0,
            revenue: 0,
            stores: new Set(),
            totalValue: 0
          }
          
          existing.transactions += 1
          existing.revenue += parseFloat(tx.peso_value || 0)
          existing.totalValue += parseFloat(tx.peso_value || 0)
          if (tx.store_id) existing.stores.add(tx.store_id)
          
          regionMap.set(tx.location_region, existing)
        }
      })

      // Convert to final format
      const regionalData: RegionData[] = Array.from(regionMap.entries()).map(([region, stats]) => ({
        region: region === 'NCR' ? 'National Capital Region' : region,
        transactions: stats.transactions,
        revenue: stats.revenue,
        stores: stats.stores.size,
        avgTransaction: stats.transactions > 0 ? stats.totalValue / stats.transactions : 0
      })).sort((a, b) => b.transactions - a.transactions)

      setData(regionalData)
      setDataSource('live')
      
    } catch (err) {
      console.error('Error fetching live data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load live data')
      setData(FALLBACK_DATA) // Fallback to demo data
      setDataSource('fallback')
    } finally {
      setLoading(false)
    }
  }

  // Try to fetch live data on mount
  useEffect(() => {
    fetchLiveData()
  }, [])

  // Metric calculation helpers
  const getMetricValue = (regionData: RegionData) => {
    switch (metricType) {
      case 'revenue': return regionData.revenue
      case 'stores': return regionData.stores
      default: return regionData.transactions
    }
  }

  const maxValue = Math.max(...data.map(getMetricValue), 1)
  const getColorIntensity = (value: number) => {
    if (maxValue === 0) return 0.1
    return Math.max((value / maxValue) * 0.85 + 0.15, 0.1)
  }

  const getRegionColor = (regionName: string) => {
    const regionData = data.find(d => d.region === regionName)
    if (!regionData) return '#f3f4f6'
    
    const intensity = getColorIntensity(getMetricValue(regionData))
    
    const colorSchemes = {
      transactions: `rgba(59, 130, 246, ${intensity})`,
      revenue: `rgba(16, 185, 129, ${intensity})`,
      stores: `rgba(245, 158, 11, ${intensity})`
    }
    
    return colorSchemes[metricType]
  }

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'revenue': 
        return value >= 1000000 ? `₱${(value / 1000000).toFixed(1)}M` : 
               value >= 1000 ? `₱${(value / 1000).toFixed(0)}K` : `₱${value.toFixed(0)}`
      case 'stores': return value.toString()
      default: return value.toLocaleString()
    }
  }

  const selectedData = selectedRegion ? data.find(d => d.region === selectedRegion) : null

  return (
    <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 overflow-hidden">
      {/* Enhanced Header with Data Source Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <MapPin className="mr-3 h-6 w-6 text-blue-600" />
              Philippines Regional Analytics
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-600">
                {data.length} regions • Last updated: {new Date().toLocaleTimeString()}
              </p>
              
              {/* Data Source Badge */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                dataSource === 'live' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  dataSource === 'live' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                {dataSource === 'live' ? 'Live Data' : 'Demo Data'}
              </div>

              {/* Retry Button */}
              {dataSource === 'fallback' && (
                <button
                  onClick={fetchLiveData}
                  disabled={loading}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Retry Live Data</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Metric Toggle */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            {[
              { key: 'transactions', label: 'Transactions', icon: BarChart3, color: 'blue' },
              { key: 'revenue', label: 'Revenue', icon: DollarSign, color: 'green' },
              { key: 'stores', label: 'Stores', icon: Package, color: 'orange' }
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => {
                  trackMetricChange(key)
                  setMetricType(key as any)
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200 ${
                  metricType === key
                    ? `bg-${color}-100 text-${color}-700 shadow-sm`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Using demo data due to connection issue: {error}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Map Visualization */}
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-4 border border-gray-100">
              <svg
                viewBox="0 0 500 350"
                className="w-full h-96"
                style={{ maxHeight: '500px' }}
              >
                {/* Background with subtle pattern */}
                <defs>
                  <pattern id="ocean" patternUnits="userSpaceOnUse" width="6" height="6">
                    <rect width="6" height="6" fill="#dbeafe"/>
                    <circle cx="3" cy="3" r="0.8" fill="#93c5fd" opacity="0.4"/>
                  </pattern>
                  <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e40af"/>
                    <stop offset="100%" stopColor="#7c3aed"/>
                  </linearGradient>
                  <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                  </filter>
                </defs>
                
                <rect width="500" height="350" fill="url(#ocean)" />
                
                {/* Enhanced Map Title */}
                <text 
                  x="250" 
                  y="25" 
                  textAnchor="middle" 
                  className="text-base font-bold" 
                  fill="url(#titleGradient)"
                  filter="url(#dropShadow)"
                >
                  Philippines • {metricType.charAt(0).toUpperCase() + metricType.slice(1)} Distribution
                </text>

                {/* Render Philippine Regions */}
                {Object.entries(philippineRegions).map(([regionName, coords]) => {
                  const regionData = data.find(d => d.region === regionName)
                  const isHovered = hoveredRegion === regionName
                  const isSelected = selectedRegion === regionName
                  const hasData = regionData && getMetricValue(regionData) > 0
                  
                  return (
                    <g key={regionName}>
                      {/* Enhanced Region Shape with gradient */}
                      <rect
                        x={coords.x}
                        y={coords.y}
                        width={coords.width}
                        height={coords.height}
                        rx="3"
                        fill={hasData ? getRegionColor(regionName) : '#f9fafb'}
                        stroke={isSelected ? "#1d4ed8" : isHovered ? "#3b82f6" : hasData ? "#e5e7eb" : "#f3f4f6"}
                        strokeWidth={isSelected ? "3" : isHovered ? "2" : "1"}
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        filter={isSelected || isHovered ? "url(#dropShadow)" : "none"}
                        onMouseEnter={() => {
                          setHoveredRegion(regionName)
                          trackRegionHover(regionName)
                        }}
                        onMouseLeave={() => setHoveredRegion(null)}
                        onClick={() => {
                          setSelectedRegion(regionName)
                          trackRegionClick(regionName)
                        }}
                      />
                      
                      {/* Enhanced Region Label */}
                      <text
                        x={coords.x + coords.width / 2}
                        y={coords.y + coords.height / 2 + 2}
                        textAnchor="middle"
                        className="text-xs font-semibold pointer-events-none"
                        fill={hasData ? "#374151" : "#9ca3af"}
                        style={{ fontSize: '9px' }}
                      >
                        {regionName.split(' ').map(word => word.charAt(0)).join('')}
                      </text>
                      
                      {/* Enhanced Data Value on Hover/Select */}
                      {(isHovered || isSelected) && regionData && (
                        <g>
                          <rect
                            x={coords.x + coords.width / 2 - 25}
                            y={coords.y - 25}
                            width="50"
                            height="18"
                            rx="9"
                            fill="#1f2937"
                            fillOpacity="0.9"
                            className="pointer-events-none"
                          />
                          <text
                            x={coords.x + coords.width / 2}
                            y={coords.y - 12}
                            textAnchor="middle"
                            className="text-xs font-bold pointer-events-none"
                            fill="white"
                            style={{ fontSize: '10px' }}
                          >
                            {formatValue(getMetricValue(regionData), metricType)}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
                
                {/* Enhanced Legend */}
                <g transform="translate(20, 300)">
                  <text x="0" y="0" className="text-sm font-semibold fill-gray-700">
                    {metricType === 'transactions' ? 'Transaction Volume' :
                     metricType === 'revenue' ? 'Revenue Scale' : 'Store Count'}
                  </text>
                  
                  {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                    <g key={i} transform={`translate(${i * 30}, 15)`}>
                      <rect
                        width="25"
                        height="10"
                        rx="2"
                        fill={metricType === 'transactions' ? `rgba(59, 130, 246, ${intensity * 0.85 + 0.15})` :
                              metricType === 'revenue' ? `rgba(16, 185, 129, ${intensity * 0.85 + 0.15})` :
                              `rgba(245, 158, 11, ${intensity * 0.85 + 0.15})`}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                      />
                      <text x="12.5" y="28" textAnchor="middle" className="text-xs fill-gray-600">
                        {i === 0 ? 'Low' : i === 4 ? 'High' : ''}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>

          {/* Enhanced Region Details Panel */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              {selectedData ? `${selectedRegion}` : 'Region Insights'}
            </h4>
            
            {selectedData ? (
              <div className="space-y-4">
                {[
                  { label: 'Total Transactions', value: selectedData.transactions.toLocaleString(), color: 'blue', icon: BarChart3 },
                  { label: 'Total Revenue', value: formatValue(selectedData.revenue, 'revenue'), color: 'green', icon: DollarSign },
                  { label: 'Active Stores', value: selectedData.stores.toString(), color: 'orange', icon: Package },
                  { label: 'Avg Transaction', value: `₱${selectedData.avgTransaction.toFixed(0)}`, color: 'purple', icon: TrendingUp }
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 font-medium">{label}</div>
                        <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
                      </div>
                      <Icon className={`h-8 w-8 text-${color}-400`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Click on a region to view detailed metrics and performance insights.
                </div>
                
                {/* Top Regions Summary */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Top Performing Regions:
                  </div>
                  {data
                    .slice(0, 5)
                    .map((region, index) => (
                      <div 
                        key={region.region}
                        className="flex justify-between items-center text-sm cursor-pointer hover:bg-white hover:shadow-sm p-3 rounded-lg transition-all group"
                        onClick={() => {
                          setSelectedRegion(region.region)
                          trackRegionClick(region.region)
                        }}
                      >
                        <span className="font-medium group-hover:text-blue-600">
                          {index + 1}. {region.region.length > 20 ? region.region.substring(0, 20) + '...' : region.region}
                        </span>
                        <span className="text-gray-600 font-semibold">
                          {formatValue(getMetricValue(region), metricType)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-200">
          {[
            { 
              label: 'Total Transactions', 
              value: data.reduce((sum, region) => sum + region.transactions, 0).toLocaleString(),
              icon: BarChart3,
              color: 'blue'
            },
            { 
              label: 'Total Revenue', 
              value: formatValue(data.reduce((sum, region) => sum + region.revenue, 0), 'revenue'),
              icon: DollarSign,
              color: 'green'
            },
            { 
              label: 'Total Stores', 
              value: data.reduce((sum, region) => sum + region.stores, 0).toString(),
              icon: Package,
              color: 'orange'
            },
            { 
              label: 'Active Regions', 
              value: data.length.toString(),
              icon: MapPin,
              color: 'purple'
            }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <Icon className={`h-8 w-8 mx-auto mb-2 text-${color}-500`} />
              <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
              <div className="text-sm text-gray-600 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}