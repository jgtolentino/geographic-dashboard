import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { BarChart3, TrendingUp, Users, MapPin, Download, Info } from 'lucide-react'

// Types for our geographic data
type Metric = 'transactions' | 'revenue' | 'stores' | 'growth'

interface FeatureProperties {
  region: string
  transactions: number
  revenue: number
  stores: number
  avg_transaction: number
  growth: number
  market_share: number
  centroid: [number, number]
}

interface Props {
  title?: string
  metric?: Metric
  className?: string
  width?: number
  height?: number
}

// Fixed Tailwind classes (no dynamic purging)
const METRIC_STYLES = {
  transactions: {
    label: 'Transactions',
    palette: ['#e8f4fd', '#c9e6fb', '#9bd2f7', '#5fb8f0', '#3b82f6'],
    buttonClass: 'bg-blue-600 text-white border-blue-600',
    inactiveClass: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
  },
  revenue: {
    label: 'Revenue',
    palette: ['#e8f6ef', '#c7eadc', '#8ed2bb', '#49b18f', '#10b981'],
    buttonClass: 'bg-green-600 text-white border-green-600',
    inactiveClass: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
  },
  stores: {
    label: 'Stores',
    palette: ['#fff3db', '#ffe0a8', '#ffd074', '#ffb23d', '#f59e0b'],
    buttonClass: 'bg-amber-600 text-white border-amber-600',
    inactiveClass: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
  },
  growth: {
    label: 'Growth %',
    palette: ['#f2e6ff', '#e0ccff', '#c1a6ff', '#9a78ff', '#8b5cf6'],
    buttonClass: 'bg-purple-600 text-white border-purple-600',
    inactiveClass: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
  }
}

// Simulated Supabase client (replace with actual import)
const supabaseClient = {
  rpc: async (funcName: string, params?: any) => {
    // Mock data that matches the PostGIS RPC structure
    if (funcName === 'api_choropleth_admin1') {
      return {
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'National Capital Region',
              geometry: {
                type: 'MultiPolygon',
                coordinates: [[[[121.0, 14.5], [121.1, 14.5], [121.1, 14.7], [121.0, 14.7], [121.0, 14.5]]]]
              },
              properties: {
                region: 'National Capital Region',
                transactions: 514,
                revenue: 206833.17,
                stores: 10,
                avg_transaction: 402.4,
                growth: 0,
                market_share: 51.4,
                centroid: [121.05, 14.6]
              }
            },
            {
              type: 'Feature',
              id: 'Central Luzon',
              geometry: {
                type: 'MultiPolygon',
                coordinates: [[[[120.5, 14.8], [121.2, 14.8], [121.2, 15.8], [120.5, 15.8], [120.5, 14.8]]]]
              },
              properties: {
                region: 'Central Luzon',
                transactions: 37,
                revenue: 60379.64,
                stores: 6,
                avg_transaction: 1631.88,
                growth: -39.1,
                market_share: 3.7,
                centroid: [120.85, 15.3]
              }
            },
            {
              type: 'Feature',
              id: 'Calabarzon',
              geometry: {
                type: 'MultiPolygon',
                coordinates: [[[[120.8, 13.8], [121.6, 13.8], [121.6, 14.5], [120.8, 14.5], [120.8, 13.8]]]]
              },
              properties: {
                region: 'Calabarzon',
                transactions: 32,
                revenue: 5776.74,
                stores: 2,
                avg_transaction: 180.52,
                growth: -66.7,
                market_share: 3.2,
                centroid: [121.2, 14.15]
              }
            },
            {
              type: 'Feature',
              id: 'Central Visayas',
              geometry: {
                type: 'MultiPolygon',
                coordinates: [[[[123.8, 9.8], [124.5, 9.8], [124.5, 10.8], [123.8, 10.8], [123.8, 9.8]]]]
              },
              properties: {
                region: 'Central Visayas',
                transactions: 35,
                revenue: 4405.76,
                stores: 5,
                avg_transaction: 125.88,
                growth: -15.8,
                market_share: 3.5,
                centroid: [124.15, 10.3]
              }
            },
            {
              type: 'Feature',
              id: 'Davao Region',
              geometry: {
                type: 'MultiPolygon',
                coordinates: [[[[125.0, 6.0], [126.5, 6.0], [126.5, 8.0], [125.0, 8.0], [125.0, 6.0]]]]
              },
              properties: {
                region: 'Davao Region',
                transactions: 32,
                revenue: 4354.68,
                stores: 2,
                avg_transaction: 136.08,
                growth: -72,
                market_share: 3.2,
                centroid: [125.75, 7.0]
              }
            }
          ],
          metadata: {
            metric: params?.p_metric || 'transactions',
            total_features: 5,
            generated_at: new Date().toISOString()
          }
        },
        error: null
      }
    }
    
    if (funcName === 'api_choropleth_summary') {
      return {
        data: {
          total_transactions: 1000,
          total_revenue: 316701.52,
          total_stores: 50,
          total_regions: 17,
          avg_transaction_value: 214,
          top_region_by_transactions: 'National Capital Region',
          data_span: '12 months (July 2024 - July 2025)',
          last_updated: new Date().toISOString()
        },
        error: null
      }
    }
    
    return { data: null, error: new Error('Unknown RPC function') }
  }
}

export default function ProductionChoroplethMap({
  title = 'Scout Analytics – Regional Performance',
  metric = 'transactions',
  className = '',
  width = 800,
  height = 600
}: Props) {
  const [fc, setFc] = useState<GeoJSON.FeatureCollection<GeoJSON.MultiPolygon, FeatureProperties> | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [activeMetric, setActiveMetric] = useState<Metric>(metric)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{x: number; y: number; feature?: GeoJSON.Feature<GeoJSON.MultiPolygon, FeatureProperties>} | null>(null)

  // Fetch data from Supabase PostGIS functions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [geoResponse, summaryResponse] = await Promise.all([
          supabaseClient.rpc('api_choropleth_admin1', { p_metric: activeMetric }),
          supabaseClient.rpc('api_choropleth_summary')
        ])
        
        if (geoResponse.error) throw geoResponse.error
        if (summaryResponse.error) throw summaryResponse.error
        
        setFc(geoResponse.data as any)
        setSummary(summaryResponse.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load choropleth data')
        console.error('Choropleth data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [activeMetric])

  // D3.js map computation with real projection
  const mapContext = useMemo(() => {
    if (!fc?.features?.length) return null
    
    // D3 projection fitted to Philippine bounds
    const projection = d3.geoMercator().fitSize([width, height], fc as any)
    const pathGenerator = d3.geoPath(projection)
    
    // Extract metric values for quantile scale
    const values = fc.features
      .map(f => +(f.properties[activeMetric] || 0))
      .filter(v => v > 0)  // Remove zeros for better scale
    
    if (!values.length) return null
    
    // Quantile color scale (5 bins)
    const colorScale = d3.scaleQuantile(values, METRIC_STYLES[activeMetric].palette)
    const quantiles = colorScale.quantiles()
    
    return {
      projection,
      pathGenerator,
      colorScale,
      quantiles,
      extent: d3.extent(values) as [number, number],
      values
    }
  }, [fc, activeMetric, width, height])

  // Render D3 SVG paths
  useEffect(() => {
    if (!mapContext || !fc || !svgRef.current) return
    
    const { pathGenerator, colorScale } = mapContext
    const svg = d3.select(svgRef.current)
    
    // Clear previous rendering
    svg.selectAll('*').remove()
    
    const g = svg.append('g').attr('class', 'map-features')
    
    // Render region polygons
    g.selectAll('path.region')
      .data(fc.features)
      .enter()
      .append('path')
      .attr('class', 'region')
      .attr('d', pathGenerator as any)
      .attr('fill', (d: any) => {
        const value = +(d.properties[activeMetric] || 0)
        return value > 0 ? colorScale(value) : '#f8f9fa'
      })
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .on('mousemove', function(event, d: any) {
        const [x, y] = d3.pointer(event, svgRef.current)
        setHover({ x, y, feature: d })
        d3.select(this)
          .attr('stroke-width', 1.5)
          .attr('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))')
      })
      .on('mouseleave', function() {
        setHover(null)
        d3.select(this)
          .attr('stroke-width', 0.5)
          .attr('filter', 'none')
      })
    
    // Add region labels at centroids
    g.selectAll('text.region-label')
      .data(fc.features)
      .enter()
      .append('text')
      .attr('class', 'region-label')
      .attr('x', (d: any) => {
        const centroid = mapContext.projection(d.properties.centroid)
        return centroid ? centroid[0] : 0
      })
      .attr('y', (d: any) => {
        const centroid = mapContext.projection(d.properties.centroid)
        return centroid ? centroid[1] : 0
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#374151')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', '2')
      .attr('paint-order', 'stroke fill')
      .attr('pointer-events', 'none')
      .text((d: any) => abbreviateRegion(d.properties.region))
      
  }, [mapContext, fc, activeMetric])

  // Helper functions
  const formatValue = (value: number, metricType: Metric): string => {
    if (!value) return '0'
    
    switch (metricType) {
      case 'revenue':
        return value >= 1_000_000 
          ? `₱${(value / 1_000_000).toFixed(1)}M` 
          : `₱${(value / 1_000).toFixed(0)}K`
      case 'growth':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
      case 'stores':
        return value.toString()
      default:
        return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString()
    }
  }
  
  const abbreviateRegion = (name: string): string => {
    return name.split(/\s+/).map(word => word[0]).join('')
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow border p-8 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow border p-8 ${className}`}>
        <div className="text-center text-red-600">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Error loading choropleth data</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!mapContext) {
    return (
      <div className={`bg-white rounded-xl shadow border p-8 ${className}`}>
        <div className="text-center text-gray-600">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p>No geographic data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow border overflow-hidden ${className}`}>
      {/* Header with metric selector */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <MapPin className="text-blue-600 h-6 w-6" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {summary && (
              <p className="text-sm text-gray-600">
                {summary.total_transactions.toLocaleString()} transactions • {summary.total_regions} regions • {summary.data_span}
              </p>
            )}
          </div>
        </div>

        {/* Fixed Tailwind metric selector */}
        <div className="flex gap-2">
          {(['transactions', 'revenue', 'stores', 'growth'] as Metric[]).map(m => {
            const config = METRIC_STYLES[m]
            const isActive = m === activeMetric
            return (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  isActive ? config.buttonClass : config.inactiveClass
                }`}
              >
                {config.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Map visualization */}
      <div className="p-6 relative">
        <div className="relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg border overflow-hidden">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="w-full h-auto"
            role="img"
            aria-label="Philippine regions choropleth map"
          />
          
          {/* Tooltip */}
          {hover?.feature && (
            <div
              className="absolute pointer-events-none bg-white/95 backdrop-blur border rounded-lg shadow-lg px-3 py-2 text-sm z-10"
              style={{ 
                left: hover.x + 12, 
                top: hover.y - 20,
                transform: 'translateY(-100%)'
              }}
            >
              <div className="font-semibold text-gray-900">
                {hover.feature.properties.region}
              </div>
              <div className="text-gray-700">
                {METRIC_STYLES[activeMetric].label}: {' '}
                <span className="font-medium">
                  {formatValue(hover.feature.properties[activeMetric], activeMetric)}
                </span>
              </div>
              {activeMetric === 'transactions' && (
                <div className="text-gray-600 text-xs">
                  Market share: {hover.feature.properties.market_share.toFixed(1)}%
                </div>
              )}
            </div>
          )}
          
          {/* Quantile legend */}
          {mapContext && (
            <div className="absolute right-4 bottom-4 bg-white/90 backdrop-blur border rounded-lg p-3 shadow-lg">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                {METRIC_STYLES[activeMetric].label}
              </div>
              <div className="flex items-end gap-1">
                {METRIC_STYLES[activeMetric].palette.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-3 border border-gray-300 rounded-sm"
                    style={{ backgroundColor: color }}
                    title={`Quantile ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>{formatValue(mapContext.extent[0], activeMetric)}</span>
                <span>{formatValue(mapContext.extent[1], activeMetric)}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Summary statistics */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">
                {summary.total_transactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">
                {formatValue(summary.total_revenue, 'revenue')}
              </div>
              <div className="text-sm text-gray-600">Revenue</div>
            </div>
            <div className="text-center">
              <Users className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-amber-600">
                {summary.total_stores}
              </div>
              <div className="text-sm text-gray-600">Stores</div>
            </div>
            <div className="text-center">
              <MapPin className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600">
                {summary.total_regions}
              </div>
              <div className="text-sm text-gray-600">Regions</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}