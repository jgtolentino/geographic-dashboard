'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useCallback, useEffect } from 'react'
import { Map, Layers3, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// Dynamically import components to avoid SSR issues
const ScoutChoroplethDashboard = dynamic(() => import('@/components/scout-choropleth-dashboard'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Geographic Dashboard..." />
})

const MapPanel = dynamic(() => import('@/components/MapPanel'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading GL Map..." />
})

const MapPanelMapbox = dynamic(() => import('@/components/MapPanelMapbox'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Mapbox Map..." />
})

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="min-h-[600px] bg-gray-50 flex items-center justify-center rounded-lg">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export default function GeographicDashboardPage() {
  const [viewMode, setViewMode] = useState<'choropleth' | 'gl' | 'mapbox'>('choropleth')
  const [metric, setMetric] = useState<'transactions' | 'revenue' | 'stores'>('transactions')
  const [useMapbox, setUseMapbox] = useState(false)
  const [glMapData, setGlMapData] = useState<any[]>([])
  const [geoBoundaries, setGeoBoundaries] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Fetch data for GL map
  const fetchGlMapData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Call the get_gold_geo_agg RPC
      const { data, error } = await supabase.rpc('get_gold_geo_agg', {
        p_filters: {},
        p_zoom_level: 6,
        p_metric: metric
      })

      if (error) throw error

      if (data?.features) {
        // Convert GeoJSON features to points array for GL map
        const points = data.features.map((feature: any) => ({
          id: feature.properties.id,
          name: feature.properties.name,
          region: feature.properties.region,
          lng: feature.geometry.coordinates[0],
          lat: feature.geometry.coordinates[1],
          transactions: feature.properties.transactions || 0,
          revenue: feature.properties.revenue || 0,
          stores: feature.properties.stores || 0,
          avg_transaction: feature.properties.avg_transaction || 0
        }))
        setGlMapData(points)
      }

      // Also fetch boundaries for GL map
      const { data: geoData, error: geoError } = await supabase.rpc('api_choropleth_admin1', { 
        p_metric: metric 
      })
      
      if (!geoError && geoData) {
        setGeoBoundaries(geoData)
      }
    } catch (error) {
      console.error('Error fetching GL map data:', error)
      // Fallback to sample data
      setGlMapData([
        { id: 'ncr', name: 'NCR', region: 'NCR', lng: 120.9842, lat: 14.5995, transactions: 15000, revenue: 2500000, stores: 150 },
        { id: 'cebu', name: 'Cebu', region: 'Central Visayas', lng: 123.8854, lat: 10.3157, transactions: 8000, revenue: 1200000, stores: 80 },
        { id: 'davao', name: 'Davao', region: 'Davao Region', lng: 125.4554, lat: 7.0644, transactions: 6000, revenue: 900000, stores: 60 }
      ])
    } finally {
      setLoading(false)
    }
  }, [supabase, metric])

  // Fetch data when view mode changes to GL or Mapbox
  useEffect(() => {
    if ((viewMode === 'gl' || viewMode === 'mapbox') && glMapData.length === 0) {
      fetchGlMapData()
    }
  }, [viewMode, fetchGlMapData, glMapData.length])

  // Handle region click from GL map
  const handleRegionClick = useCallback((region: string) => {
    console.log('Region clicked:', region)
    // Could implement drill-down functionality here
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scout Analytics Platform</h1>
            <p className="text-gray-600 mt-2">Philippines Regional Performance Dashboard</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            {/* Metric Selector */}
            <div className="relative">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as any)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="transactions">Transactions</option>
                <option value="revenue">Revenue</option>
                <option value="stores">Stores</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-300">
              <button
                onClick={() => setViewMode('choropleth')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'choropleth'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Layers3 className="h-4 w-4 mr-2" />
                Choropleth
              </button>
              <button
                onClick={() => setViewMode('gl')}
                className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'gl'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Map className="h-4 w-4 mr-2" />
                GL Map
              </button>
              <button
                onClick={() => setViewMode('mapbox')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'mapbox'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Map className="h-4 w-4 mr-2" />
                Mapbox
              </button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <Suspense fallback={<LoadingSpinner message="Loading Map..." />}>
          {viewMode === 'choropleth' ? (
            <ScoutChoroplethDashboard />
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {loading ? (
                <LoadingSpinner message="Loading Map Data..." />
              ) : viewMode === 'mapbox' ? (
                <MapPanelMapbox
                  points={glMapData}
                  geojson={geoBoundaries}
                  metric={metric}
                  onRegionClick={handleRegionClick}
                  height="700px"
                />
              ) : (
                <MapPanel
                  points={glMapData}
                  geojson={geoBoundaries}
                  metric={metric}
                  onRegionClick={handleRegionClick}
                  height="700px"
                />
              )}
            </div>
          )}
        </Suspense>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About This View</h2>
          <div className="prose prose-sm text-gray-600 max-w-none">
            {viewMode === 'choropleth' ? (
              <>
                <p>
                  The <strong>Choropleth View</strong> provides a traditional regional map visualization using SVG paths. 
                  Each region is colored based on the selected metric intensity, making it easy to identify patterns across 
                  the Philippines at a glance.
                </p>
                <ul className="mt-2">
                  <li>Hover over regions to see detailed metrics</li>
                  <li>Click on regions to focus and zoom</li>
                  <li>View trends over time with the growth indicator</li>
                </ul>
              </>
            ) : viewMode === 'mapbox' ? (
              <>
                <p>
                  The <strong>Mapbox View</strong> provides premium map styles and satellite imagery with the same 
                  high-performance WebGL rendering. Choose from multiple Mapbox styles including streets, satellite, 
                  light, dark, and navigation themes.
                </p>
                <ul className="mt-2">
                  <li>Premium Mapbox basemap styles and satellite imagery</li>
                  <li>Same heatmap and clustering capabilities as GL Map</li>
                  <li>Smooth transitions and animations</li>
                  <li>Professional cartography with global coverage</li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  The <strong>GL Map View</strong> uses WebGL acceleration for smooth performance with large datasets. 
                  This view supports dynamic clustering, heatmaps, and seamless zoom from country level down to barangay details.
                  Uses free and open-source MapLibre with CartoDB basemaps.
                </p>
                <ul className="mt-2">
                  <li>Toggle between heatmap and point visualization</li>
                  <li>Show/hide regional boundaries and basemap</li>
                  <li>Zoom in for automatic data aggregation at city and barangay levels</li>
                  <li>Click on points or regions for detailed information</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}