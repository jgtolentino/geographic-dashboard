// ====================================================================
// COMPETITIVE INTELLIGENCE MODULE - REAL SCOUT DATA ONLY
// ====================================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, TrendingUp, TrendingDown, Users, DollarSign, BarChart3, 
  Award, Star, Crown, Zap, Target, ArrowUpRight, ArrowDownRight,
  RefreshCw, AlertCircle, Package, MapPin
} from 'lucide-react'
import { 
  useBrandIntelligence, 
  useCreativeExcellence, 
  useCategoryIntelligence, 
  useGeographicIntelligence,
  useMarketOverview,
  useConsumerInsights 
} from '@/lib/scout-competitive-intelligence-service'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function CompetitiveIntelligence() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  // Real data hooks - no mock data
  const { data: brandData, loading: brandLoading, error: brandError, refresh: refreshBrands } = useBrandIntelligence()
  const { data: campaignData, loading: campaignLoading, error: campaignError, refresh: refreshCampaigns } = useCreativeExcellence()
  const { data: categoryData, loading: categoryLoading, error: categoryError, refresh: refreshCategories } = useCategoryIntelligence()
  const { data: geoData, loading: geoLoading, error: geoError, refresh: refreshGeo } = useGeographicIntelligence()
  const { data: marketData, loading: marketLoading, error: marketError, refresh: refreshMarket } = useMarketOverview()
  const { data: consumerData, loading: consumerLoading, error: consumerError, refresh: refreshConsumer } = useConsumerInsights()

  const isLoading = brandLoading || campaignLoading || categoryLoading || geoLoading || marketLoading || consumerLoading
  const hasError = brandError || campaignError || categoryError || geoError || marketError || consumerError

  const handleRefreshAll = async () => {
    await Promise.all([
      refreshBrands(),
      refreshCampaigns(),
      refreshCategories(),
      refreshGeo(),
      refreshMarket(),
      refreshConsumer()
    ])
  }

  // Market Overview Tab
  const MarketOverviewTab = () => (
    <div className="space-y-6">
      {/* Market KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{((marketData?.totalMarketSize || 0) / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Total market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData?.activeBrands || 0}</div>
            <p className="text-xs text-muted-foreground">Competing brands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData?.activeCategories || 0}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Leader</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{marketData?.marketLeader || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">{(marketData?.marketLeaderShare || 0).toFixed(1)}% share</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Leaders and Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 text-yellow-600 mr-2" />
              Market Leaders by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brandData?.slice(0, 5).map((brand, index) => (
                <div key={brand.brand} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">{brand.brand}</span>
                      <p className="text-xs text-gray-500">{brand.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₱{(brand.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">{brand.marketShare.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData && categoryData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Share Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 text-green-600 mr-2" />
            Market Share Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
            {brandData?.slice(0, 8).map((brand, index) => (
              <div key={brand.brand} className="text-center">
                <div 
                  className={`w-full rounded-lg mb-2 ${COLORS[index] ? 'bg-blue-500' : 'bg-gray-400'}`}
                  style={{ 
                    height: `${Math.max(brand.marketShare * 4, 20)}px`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                />
                <p className="text-xs font-medium text-gray-900 truncate">{brand.brand}</p>
                <p className="text-xs text-gray-500">{brand.marketShare.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Brand Intelligence Tab
  const BrandIntelligenceTab = () => (
    <div className="space-y-6">
      {/* Brand Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brandData?.slice(0, 8).map((brand) => (
              <label key={brand.brand} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.brand)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBrands([...selectedBrands, brand.brand])
                    } else {
                      setSelectedBrands(selectedBrands.filter(b => b !== brand.brand))
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{brand.brand}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(selectedBrands.length > 0 ? selectedBrands : brandData?.slice(0, 4).map(b => b.brand) || []).slice(0, 4).map((brandName) => {
          const brand = brandData?.find(b => b.brand === brandName)
          if (!brand) return null

          return (
            <Card key={brandName} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{brand.brand}</CardTitle>
                  <Badge variant="secondary">{brand.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-xl font-bold text-green-600">₱{(brand.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-bold text-blue-600">{brand.transactions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Market Share</p>
                    <p className="text-xl font-bold text-purple-600">{brand.marketShare.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Engagement</p>
                    <p className="text-xl font-bold text-orange-600">{(brand.engagementScore * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Regional Reach</span>
                      <span>{brand.regionalReach} regions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((brand.regionalReach / 17) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Store Reach</span>
                      <span>{brand.storeReach} stores</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((brand.storeReach / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  // Creative Excellence Tab
  const CreativeExcellenceTab = () => (
    <div className="space-y-6">
      {/* CES Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 text-yellow-600 mr-2" />
            Creative Excellence Score (CES) Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignData?.map((campaign, index) => (
              <div key={campaign.brand} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{campaign.brand}</p>
                    <p className="text-sm text-gray-600">{campaign.campaignCount} campaign(s)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Innovation</p>
                    <p className="font-bold text-blue-600">{(campaign.innovationScore * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Cultural</p>
                    <p className="font-bold text-green-600">{(campaign.culturalScore * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Emotional</p>
                    <p className="font-bold text-purple-600">{(campaign.emotionalScore * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">CES Score</p>
                    <p className="text-2xl font-bold text-orange-600">{campaign.cesScore.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CES Components Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Innovation Leaders</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignData
              ?.sort((a, b) => b.innovationScore - a.innovationScore)
              .slice(0, 5)
              .map((campaign) => (
                <div key={campaign.brand} className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">{campaign.brand}</span>
                  <span className="font-semibold text-blue-600">{(campaign.innovationScore * 100).toFixed(0)}%</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cultural Relevance</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignData
              ?.sort((a, b) => b.culturalScore - a.culturalScore)
              .slice(0, 5)
              .map((campaign) => (
                <div key={campaign.brand} className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">{campaign.brand}</span>
                  <span className="font-semibold text-green-600">{(campaign.culturalScore * 100).toFixed(0)}%</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emotional Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignData
              ?.sort((a, b) => b.emotionalScore - a.emotionalScore)
              .slice(0, 5)
              .map((campaign) => (
                <div key={campaign.brand} className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">{campaign.brand}</span>
                  <span className="font-semibold text-purple-600">{(campaign.emotionalScore * 100).toFixed(0)}%</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Geographic Intelligence Tab
  const GeographicIntelligenceTab = () => (
    <div className="space-y-6">
      {/* Regional Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              Regional Revenue Leaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {geoData && geoData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={geoData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="region" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={10}
                  />
                  <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {geoData?.slice(0, 5).map((region, index) => (
                <div key={region.region} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{region.region}</h4>
                    <Badge variant="outline">{region.marketShare.toFixed(1)}% share</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Top Category:</span>
                      <span className="ml-1 font-medium">{region.topCategory || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Top Brand:</span>
                      <span className="ml-1 font-medium">{region.topBrand || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stores:</span>
                      <span className="ml-1 font-medium">{region.stores}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Transaction:</span>
                      <span className="ml-1 font-medium">₱{region.avgTransaction.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h2>
          <p className="text-gray-600">Market insights and competitive analysis</p>
        </div>
        <Button 
          onClick={handleRefreshAll} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Loading competitive intelligence data...</AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading data: {brandError || campaignError || categoryError || geoError || marketError || consumerError}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="brands">Brand Intelligence</TabsTrigger>
          <TabsTrigger value="creative">Creative Excellence</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MarketOverviewTab />
        </TabsContent>

        <TabsContent value="brands">
          <BrandIntelligenceTab />
        </TabsContent>

        <TabsContent value="creative">
          <CreativeExcellenceTab />
        </TabsContent>

        <TabsContent value="geographic">
          <GeographicIntelligenceTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}