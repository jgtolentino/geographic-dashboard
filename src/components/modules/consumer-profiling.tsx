'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DemographicTree } from '@/components/charts/demographic-tree'
import { GeoHeatmap } from '@/components/charts/geo-heatmap'
import { DataTable } from '@/components/tables/data-table'
import { FilterState } from '@/types/scout-dashboard'
import { Users, MapPin, TrendingUp, Globe } from 'lucide-react'

interface ConsumerProfilingProps {
  filters: FilterState
}

// Mock data
const ageDistributionData = [
  { name: '18-25', value: 2345, percentage: 23, color: '#0ea5e9' },
  { name: '26-35', value: 3456, percentage: 35, color: '#10b981' },
  { name: '36-50', value: 2678, percentage: 27, color: '#f59e0b' },
  { name: '50+', value: 1521, percentage: 15, color: '#ef4444' },
]

const genderDistributionData = [
  { name: 'Male', value: 4832, percentage: 48, color: '#0ea5e9' },
  { name: 'Female', value: 4968, percentage: 50, color: '#ec4899' },
  { name: 'Other', value: 200, percentage: 2, color: '#10b981' },
]

const incomeDistributionData = [
  { name: 'Below 15K', value: 1234, percentage: 12, color: '#ef4444' },
  { name: '15K-30K', value: 3456, percentage: 35, color: '#f59e0b' },
  { name: '30K-50K', value: 2987, percentage: 30, color: '#10b981' },
  { name: '50K-100K', value: 1876, percentage: 19, color: '#0ea5e9' },
  { name: 'Above 100K', value: 447, percentage: 4, color: '#8b5cf6' },
]

const demographicTreeData = {
  name: 'Total Consumers',
  value: 10000,
  children: [
    {
      name: 'Metro Manila',
      value: 6500,
      children: [
        { name: 'Makati', value: 1500 },
        { name: 'Quezon City', value: 2000 },
        { name: 'Manila', value: 1200 },
        { name: 'Pasig', value: 1000 },
        { name: 'Others', value: 800 },
      ]
    },
    {
      name: 'Provincial',
      value: 3500,
      children: [
        { name: 'Cebu', value: 1000 },
        { name: 'Davao', value: 800 },
        { name: 'Batangas', value: 700 },
        { name: 'Laguna', value: 600 },
        { name: 'Others', value: 400 },
      ]
    }
  ]
}

const geoHeatmapData = [
  { lat: 14.5995, lng: 120.9842, value: 89, label: 'Makati CBD' },
  { lat: 14.6760, lng: 121.0437, value: 76, label: 'Quezon City' },
  { lat: 14.5906, lng: 120.9799, value: 82, label: 'Manila' },
  { lat: 14.5764, lng: 121.0851, value: 68, label: 'Pasig' },
  { lat: 14.4791, lng: 120.8970, value: 45, label: 'Cavite' },
  { lat: 14.2990, lng: 121.0794, value: 54, label: 'Laguna' },
  { lat: 14.5515, lng: 121.0244, value: 71, label: 'Mandaluyong' },
  { lat: 14.5547, lng: 121.0243, value: 63, label: 'San Juan' },
]

const profileTableData = [
  {
    segment: 'Young Professionals',
    ageRange: '25-35',
    income: '30K-50K',
    location: 'Metro Manila',
    avgSpend: 2850,
    frequency: 3.2,
    loyalty: 72,
    profile: 'Tech-savvy, brand-conscious'
  },
  {
    segment: 'Family Shoppers',
    ageRange: '36-50',
    income: '50K-100K',
    location: 'Suburban',
    avgSpend: 4250,
    frequency: 2.8,
    loyalty: 85,
    profile: 'Value-focused, bulk buyers'
  },
  {
    segment: 'Budget Conscious',
    ageRange: '18-25',
    income: 'Below 30K',
    location: 'Provincial',
    avgSpend: 1450,
    frequency: 4.1,
    loyalty: 45,
    profile: 'Price-sensitive, promo-seekers'
  },
]

const lifestyleData = [
  { lifestyle: 'Health Conscious', percentage: 32 },
  { lifestyle: 'Convenience Seekers', percentage: 28 },
  { lifestyle: 'Budget Focused', percentage: 25 },
  { lifestyle: 'Premium Buyers', percentage: 15 },
]

export function ConsumerProfiling({ filters }: ConsumerProfilingProps) {
  const [activeView, setActiveView] = useState('demographics')

  // Custom label for donut charts
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Consumer Profiling</h2>
        <p className="text-muted-foreground">
          Demographics and geographic distribution of consumers
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">10,000</div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +1,234
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">12</div>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                Stable
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Geographic Coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">47</div>
              <Badge variant="secondary" className="bg-sky-100 text-sky-800">
                <MapPin className="h-3 w-3 mr-1" />
                Cities
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Avg Profile Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">82%</div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <Globe className="h-3 w-3 mr-1" />
                High
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Age Distribution */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Consumer age groups</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={ageDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      labelLine={false}
                      label={renderCustomLabel}
                      dataKey="value"
                    >
                      {ageDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Consumer gender breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={genderDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      labelLine={false}
                      label={renderCustomLabel}
                      dataKey="value"
                    >
                      {genderDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Income Distribution */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Income Distribution</CardTitle>
                <CardDescription>Monthly income brackets (PHP)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={incomeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      labelLine={false}
                      label={renderCustomLabel}
                      dataKey="value"
                    >
                      {incomeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Demographic Tree */}
          <DemographicTree 
            data={demographicTreeData}
            title="Location Hierarchy"
          />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <GeoHeatmap
            data={geoHeatmapData}
            title="Consumer Density Heatmap"
            height={600}
          />

          {/* Location Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Top Cities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Makati', 'Quezon City', 'Manila', 'Cebu', 'Davao'].map((city, idx) => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="text-sm">{city}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${90 - idx * 15}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {1500 - idx * 200}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Urban vs Rural</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Urban', value: 7500, color: '#0ea5e9' },
                        { name: 'Rural', value: 2500, color: '#10b981' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Regional Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { region: 'NCR', growth: 15 },
                    { region: 'Region IV-A', growth: 12 },
                    { region: 'Region VII', growth: 10 },
                    { region: 'Region XI', growth: 8 },
                  ].map((item) => (
                    <div key={item.region} className="flex items-center justify-between">
                      <span className="text-sm">{item.region}</span>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        +{item.growth}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Lifestyle Segments</CardTitle>
                <CardDescription>Consumer lifestyle preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lifestyleData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" />
                    <YAxis dataKey="lifestyle" type="category" />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#0ea5e9">
                      {lifestyleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(199, 89%, ${50 + index * 10}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Shopping Preferences</CardTitle>
                <CardDescription>How different segments prefer to shop</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { preference: 'In-Store Only', young: 20, middle: 40, senior: 70 },
                    { preference: 'Online First', young: 60, middle: 35, senior: 15 },
                    { preference: 'Hybrid', young: 20, middle: 25, senior: 15 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="preference" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="young" stackId="a" fill="#0ea5e9" name="18-35" />
                    <Bar dataKey="middle" stackId="a" fill="#10b981" name="36-50" />
                    <Bar dataKey="senior" stackId="a" fill="#f59e0b" name="50+" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Lifestyle Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Tech Adoption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { tech: 'Mobile App Users', percentage: 68 },
                    { tech: 'QR Payment', percentage: 54 },
                    { tech: 'E-wallet Users', percentage: 72 },
                    { tech: 'Social Commerce', percentage: 45 },
                  ].map((item) => (
                    <div key={item.tech} className="flex items-center justify-between">
                      <span className="text-sm">{item.tech}</span>
                      <Badge variant="outline">{item.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Purchase Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { driver: 'Convenience', score: 4.2 },
                    { driver: 'Price Value', score: 4.5 },
                    { driver: 'Quality', score: 4.3 },
                    { driver: 'Brand Trust', score: 3.9 },
                  ].map((item) => (
                    <div key={item.driver} className="flex items-center justify-between">
                      <span className="text-sm">{item.driver}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{item.score}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Communication Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { channel: 'SMS', effectiveness: 'High' },
                    { channel: 'Email', effectiveness: 'Medium' },
                    { channel: 'Push Notif', effectiveness: 'High' },
                    { channel: 'Social Media', effectiveness: 'Very High' },
                  ].map((item) => (
                    <div key={item.channel} className="flex items-center justify-between">
                      <span className="text-sm">{item.channel}</span>
                      <Badge 
                        variant={item.effectiveness === 'Very High' ? 'default' : 'secondary'}
                        className={item.effectiveness === 'Very High' ? 'bg-emerald-100 text-emerald-800' : ''}
                      >
                        {item.effectiveness}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {['Young Professionals', 'Family Shoppers', 'Budget Conscious', 'Premium Seekers', 'Senior Citizens', 'Students'].map((segment, idx) => {
              const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']
              return (
                <Card key={segment} className="glass-panel">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{segment}</CardTitle>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-medium">{1500 + idx * 200} consumers</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Spend</span>
                        <span className="font-medium">₱{2000 + idx * 500}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Visit Freq</span>
                        <span className="font-medium">{(3.5 - idx * 0.3).toFixed(1)}x/month</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Growth</span>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                          +{12 - idx}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <DataTable
            data={profileTableData}
            title="Consumer Profile Details"
            columns={[
              { key: 'segment', label: 'Segment', sortable: true },
              { key: 'ageRange', label: 'Age Range', sortable: true },
              { key: 'income', label: 'Income (PHP)', sortable: true },
              { key: 'location', label: 'Primary Location', sortable: true },
              { 
                key: 'avgSpend', 
                label: 'Avg Spend', 
                sortable: true,
                render: (value) => `₱${value.toLocaleString()}`
              },
              { 
                key: 'frequency', 
                label: 'Visit/Month', 
                sortable: true,
                render: (value) => value.toFixed(1)
              },
              { 
                key: 'loyalty', 
                label: 'Loyalty %', 
                sortable: true,
                render: (value) => (
                  <Badge variant={value > 70 ? 'default' : 'secondary'}>
                    {value}%
                  </Badge>
                )
              },
              { key: 'profile', label: 'Profile', sortable: false }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}