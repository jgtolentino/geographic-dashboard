import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { MapRef, NavigationControl, ScaleControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer, ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { useMemo, useRef, useState, useCallback } from 'react';
import { MapPin, Layers, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface MapPanelProps {
  points?: Array<{
    id: string;
    lng: number;
    lat: number;
    name: string;
    region?: string;
    transactions?: number;
    revenue?: number;
    stores?: number;
    [key: string]: any;
  }>;
  geojson?: any;
  metric?: 'transactions' | 'revenue' | 'stores';
  onRegionClick?: (region: string) => void;
  height?: string;
}

export default function MapPanel({
  points = [],
  geojson,
  metric = 'transactions',
  onRegionClick,
  height = '600px'
}: MapPanelProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 121.03,
    latitude: 14.6,
    zoom: 6, // Start with Philippines-wide view
    pitch: 0,
    bearing: 0
  });
  
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBasemap, setShowBasemap] = useState(true);
  const [showBorders, setShowBorders] = useState(true);

  // Create heatmap layer
  const heatmapLayer = useMemo(() => {
    if (!showHeatmap || points.length === 0) return null;
    
    return new HeatmapLayer({
      id: 'transaction-heatmap',
      data: points,
      getPosition: d => [d.lng, d.lat],
      getWeight: d => d[metric] || 1,
      radiusPixels: 30,
      intensity: 1,
      threshold: 0.05,
      colorRange: [
        [255, 255, 178, 0],
        [254, 217, 118, 51],
        [254, 178, 76, 102],
        [253, 141, 60, 153],
        [240, 59, 32, 204],
        [189, 0, 38, 255]
      ]
    });
  }, [points, metric, showHeatmap]);

  // Create scatter plot layer for individual points
  const scatterLayer = useMemo(() => {
    if (showHeatmap || points.length === 0) return null;
    
    return new ScatterplotLayer({
      id: 'transaction-points',
      data: points,
      getPosition: d => [d.lng, d.lat],
      getRadius: d => Math.sqrt(d[metric] || 1) * 100,
      getFillColor: d => {
        const value = d[metric] || 0;
        const max = Math.max(...points.map(p => p[metric] || 0));
        const intensity = value / max;
        return [59, 130, 246, intensity * 255];
      },
      pickable: true,
      onClick: (info) => {
        if (info.object && onRegionClick) {
          onRegionClick(info.object.region || info.object.name);
        }
      },
      radiusMinPixels: 2,
      radiusMaxPixels: 100
    });
  }, [points, metric, showHeatmap, onRegionClick]);

  // Create GeoJSON layer for boundaries
  const borderLayer = useMemo(() => {
    if (!showBorders || !geojson) return null;
    
    return new GeoJsonLayer({
      id: 'region-borders',
      data: geojson,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [100, 100, 100, 200],
      getFillColor: f => {
        const value = f.properties?.[metric] || 0;
        const max = Math.max(...(geojson.features?.map((feat: any) => 
          feat.properties?.[metric] || 0
        ) || [1]));
        const intensity = value / max;
        return [59, 130, 246, intensity * 100];
      },
      pickable: true,
      onClick: (info) => {
        if (info.object?.properties?.region && onRegionClick) {
          onRegionClick(info.object.properties.region);
        }
      }
    });
  }, [geojson, metric, showBorders, onRegionClick]);

  // Reset view to Philippines
  const resetView = useCallback(() => {
    setViewState({
      longitude: 121.03,
      latitude: 14.6,
      zoom: 6,
      pitch: 0,
      bearing: 0
    });
  }, []);

  // Get tooltip content
  const getTooltip = useCallback(({ object }: any) => {
    if (!object) return null;
    
    const name = object.properties?.region || object.region || object.name || 'Unknown';
    const value = object.properties?.[metric] || object[metric] || 0;
    
    return {
      html: `
        <div class="bg-white px-3 py-2 rounded shadow-lg border border-gray-200">
          <div class="font-semibold">${name}</div>
          <div class="text-sm text-gray-600">
            ${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${
              metric === 'revenue' ? `₱${value.toLocaleString()}` : value.toLocaleString()
            }
          </div>
        </div>
      `,
      style: {
        backgroundColor: 'transparent',
        fontSize: '0.875rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }
    };
  }, [metric]);

  // Layer array
  const layers = [borderLayer, heatmapLayer, scatterLayer].filter(Boolean);

  return (
    <div className="relative" style={{ height }}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-white rounded-lg shadow-md p-2 space-y-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
              showHeatmap 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Heatmap</span>
          </button>
          
          <button
            onClick={() => setShowBorders(!showBorders)}
            className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
              showBorders 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Borders</span>
          </button>
          
          <button
            onClick={() => setShowBasemap(!showBasemap)}
            className={`flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
              showBasemap 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showBasemap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>Basemap</span>
          </button>
          
          <button
            onClick={resetView}
            className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-full"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapLib={maplibregl}
        mapStyle={
          showBasemap 
            ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
            : {
                version: 8,
                sources: {},
                layers: [{
                  id: 'background',
                  type: 'background',
                  paint: { 'background-color': '#f8f9fa' }
                }]
              }
        }
        style={{ width: '100%', height: '100%' }}
        reuseMaps
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />
      </Map>
      
      {/* Deck.gl Overlay */}
      <DeckGL
        viewState={viewState}
        controller={true}
        layers={layers}
        getTooltip={getTooltip}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
      />

      {/* Legend */}
      {showHeatmap && (
        <div className="absolute bottom-8 right-4 bg-white rounded-lg shadow-md p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            {metric.charAt(0).toUpperCase() + metric.slice(1)} Density
          </h4>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">Low</span>
            <div className="flex h-6 w-32">
              {[
                'rgba(255, 255, 178, 0.8)',
                'rgba(254, 217, 118, 0.8)',
                'rgba(254, 178, 76, 0.8)',
                'rgba(253, 141, 60, 0.8)',
                'rgba(240, 59, 32, 0.8)',
                'rgba(189, 0, 38, 0.8)'
              ].map((color, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
      )}
    </div>
  );
}