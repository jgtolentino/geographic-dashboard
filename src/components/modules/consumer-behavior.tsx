'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FunnelChart } from '@/components/charts/funnel-chart'
import { DataTable } from '@/components/tables/data-table'
import { FilterState } from '@/types/scout-dashboard'
import { Users, ShoppingBag, TrendingUp, MessageSquare, Target, Eye } from 'lucide-react'

interface ConsumerBehaviorProps {
  filters: FilterState
}

// Mock data
const requestTypeData = [
  { name: 'Branded', value: 4532, percentage: 45, color: '#0ea5e9' },
  { name: 'Unbranded', value: 3521, percentage: 35, color: '#10b981' },
  { name: 'Unsure', value: 2012, percentage: 20, color: '#f59e0b' },
]

const requestMethodData = [
  { method: 'Pointing', branded: 3200, unbranded: 1800, unsure: 800 },
  { method: 'Verbal', branded: 1000, unbranded: 1400, unsure: 900 },
  { method: 'Indirect', branded: 332, unbranded: 321, unsure: 312 },
]

const acceptanceFunnelData = [
  { name: 'Product Requested', value: 10065 },
  { name: 'Product Located', value: 9258 },
  { name: 'Price Checked', value: 7806 },
  { name: 'Added to Basket', value: 6543 },
  { name: 'Purchased', value: 5832 },
]

const behaviorTableData = [
  {
    segment: 'Young Adults (18-25)',
    requestType: 'Branded',
    requestMethod: 'Pointing',
    acceptanceRate: 68,
    avgBasketSize: 3.2,
    returnRate: 12,
    satisfaction: 4.2
  },
  {
    segment: 'Adults (26-35)',
    requestType: 'Unbranded',
    requestMethod: 'Verbal',
    acceptanceRate: 75,
    avgBasketSize: 4.1,
    returnRate: 8,
    satisfaction: 4.5
  },
  {
    segment: 'Middle Age (36-50)',
    requestType: 'Branded',
    requestMethod: 'Verbal',
    acceptanceRate: 82,
    avgBasketSize: 5.3,
    returnRate: 5,
    satisfaction: 4.7
  },
]

const brandPreferenceData = [
  { brand: 'Brand A', preference: 78, loyalty: 65 },
  { brand: 'Brand B', preference: 65, loyalty: 72 },
  { brand: 'Brand C', preference: 54, loyalty: 48 },
  { brand: 'Brand D', preference: 43, loyalty: 55 },
  { brand: 'Brand E', preference: 32, loyalty: 30 },
]

export function ConsumerBehavior({ filters }: ConsumerBehaviorProps) {
  const [activeView, setActiveView] = useState('overview')
  const [ageFilter, setAgeFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Consumer Behavior & Preference Signals</h2>
        <p className="text-muted-foreground">
          Analyze consumer request patterns, preferences, and shopping behaviors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="beverages">Beverages</SelectItem>
            <SelectItem value="snacks">Snacks</SelectItem>
            <SelectItem value="personal-care">Personal Care</SelectItem>
            <SelectItem value="household">Household</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Age Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Age Groups</SelectItem>
            <SelectItem value="18-25">18-25 years</SelectItem>
            <SelectItem value="26-35">26-35 years</SelectItem>
            <SelectItem value="36-50">36-50 years</SelectItem>
            <SelectItem value="50+">50+ years</SelectItem>
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Avg Request/Visit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">2.4</div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.3
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Acceptance Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">58%</div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Brand Loyalty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">72%</div>
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                Stable
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Satisfaction Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">4.3/5</div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <MessageSquare className="h-3 w-3 mr-1" />
                Good
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Journey</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Type Pie Chart */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Request Types</CardTitle>
                <CardDescription>How consumers ask for products</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={requestTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {requestTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Request Method Stacked Bar */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Request Methods by Type</CardTitle>
                <CardDescription>How different request types are communicated</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={requestMethodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="branded" stackId="a" fill="#0ea5e9" name="Branded" />
                    <Bar dataKey="unbranded" stackId="a" fill="#10b981" name="Unbranded" />
                    <Bar dataKey="unsure" stackId="a" fill="#f59e0b" name="Unsure" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Peak Request Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['10:00-12:00', '14:00-16:00', '18:00-20:00'].map((time, idx) => (
                    <div key={time} className="flex items-center justify-between">
                      <span className="text-sm">{time}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${85 - idx * 15}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {85 - idx * 15}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Common Substitutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { original: 'Premium Brand', substitute: 'Store Brand', rate: 45 },
                    { original: 'Large Size', substitute: 'Medium Size', rate: 38 },
                    { original: 'Out of Stock', substitute: 'Alternative', rate: 72 },
                  ].map((item) => (
                    <div key={item.original} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.original}</span>
                        <span className="font-medium">{item.rate}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">→ {item.substitute}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Decision Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { factor: 'Price', importance: 89 },
                    { factor: 'Brand', importance: 72 },
                    { factor: 'Availability', importance: 68 },
                    { factor: 'Promotion', importance: 54 },
                  ].map((item) => (
                    <div key={item.factor} className="flex items-center justify-between">
                      <span className="text-sm">{item.factor}</span>
                      <Badge variant="outline">{item.importance}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <FunnelChart
            data={acceptanceFunnelData}
            title="Consumer Purchase Journey"
            showPercentages={true}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Brand Preference vs Loyalty</CardTitle>
              <CardDescription>Comparison of stated preference and actual loyalty</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={brandPreferenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="preference" fill="#0ea5e9" name="Preference %" />
                  <Bar dataKey="loyalty" fill="#10b981" name="Loyalty %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Age Group Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { age: '18-25', digital: 78, inStore: 22 },
                    { age: '26-35', digital: 65, inStore: 35 },
                    { age: '36-50', digital: 45, inStore: 55 },
                    { age: '50+', digital: 25, inStore: 75 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="digital" stackId="a" fill="#0ea5e9" name="Digital First" />
                    <Bar dataKey="inStore" stackId="a" fill="#10b981" name="In-Store First" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Gender Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { category: 'Personal Care', male: 45, female: 78, other: 62 },
                    { category: 'Beverages', male: 72, female: 65, other: 68 },
                    { category: 'Snacks', male: 68, female: 72, other: 70 },
                    { category: 'Household', male: 52, female: 85, other: 78 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#0ea5e9" name="Male" />
                    <Bar dataKey="female" fill="#ec4899" name="Female" />
                    <Bar dataKey="other" fill="#10b981" name="Other" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <DataTable
            data={behaviorTableData}
            title="Consumer Behavior Details"
            columns={[
              { key: 'segment', label: 'Consumer Segment', sortable: true },
              { key: 'requestType', label: 'Primary Request Type', sortable: true },
              { key: 'requestMethod', label: 'Request Method', sortable: true },
              { 
                key: 'acceptanceRate', 
                label: 'Acceptance Rate', 
                sortable: true,
                render: (value) => (
                  <Badge variant={value > 70 ? 'default' : 'secondary'}>
                    {value}%
                  </Badge>
                )
              },
              { 
                key: 'avgBasketSize', 
                label: 'Avg Basket Size', 
                sortable: true,
                render: (value) => value.toFixed(1)
              },
              { 
                key: 'returnRate', 
                label: 'Return Rate %', 
                sortable: true,
                render: (value) => `${value}%`
              },
              {
                key: 'satisfaction',
                label: 'Satisfaction',
                sortable: true,
                render: (value) => (
                  <div className="flex items-center space-x-1">
                    <span>{value.toFixed(1)}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                )
              }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}