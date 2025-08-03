'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ParetoChart } from '@/components/charts/pareto-chart'
import { SankeyChart } from '@/components/charts/sankey-chart'
import { DataTable } from '@/components/tables/data-table'
import { FilterState, ProductMixData } from '@/types/scout-dashboard'
import { Package, TrendingUp, ShoppingCart, ArrowRight } from 'lucide-react'

interface ProductMixProps {
  filters: FilterState
}

// Mock data
const categoryBreakdown = [
  { category: 'Beverages', brand: 'Brand A', value: 4532, percentage: 35 },
  { category: 'Beverages', brand: 'Brand B', value: 3211, percentage: 25 },
  { category: 'Snacks', brand: 'Brand C', value: 2987, percentage: 22 },
  { category: 'Personal Care', brand: 'Brand D', value: 1876, percentage: 14 },
  { category: 'Household', brand: 'Brand E', value: 987, percentage: 7 },
  { category: 'Tobacco', brand: 'Brand F', value: 432, percentage: 3 },
]

const paretoData = [
  { name: 'Shampoo 500ml', value: 3421 },
  { name: 'Coca-Cola 1.5L', value: 3102 },
  { name: 'Chips Large', value: 2876 },
  { name: 'Detergent 1kg', value: 2543 },
  { name: 'Instant Noodles', value: 2234 },
  { name: 'Cigarettes Pack', value: 1987 },
  { name: 'Soap Bar', value: 1654 },
  { name: 'Coffee 3-in-1', value: 1432 },
  { name: 'Biscuits', value: 1234 },
  { name: 'Cooking Oil 1L', value: 987 },
]

const sankeyNodes = [
  { id: 'beverages', label: 'Beverages' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'personal', label: 'Personal Care' },
  { id: 'brandA', label: 'Brand A' },
  { id: 'brandB', label: 'Brand B' },
  { id: 'brandC', label: 'Brand C' },
  { id: 'substitute1', label: 'Substitute Product 1' },
  { id: 'substitute2', label: 'Substitute Product 2' },
]

const sankeyLinks = [
  { source: 'beverages', target: 'brandA', value: 100 },
  { source: 'beverages', target: 'brandB', value: 80 },
  { source: 'snacks', target: 'brandC', value: 60 },
  { source: 'brandA', target: 'substitute1', value: 30 },
  { source: 'brandB', target: 'substitute2', value: 25 },
]

const skuTableData = [
  {
    sku: 'BEV-001',
    name: 'Coca-Cola 1.5L',
    category: 'Beverages',
    brand: 'Coca-Cola',
    transactions: 3102,
    avgBasketSize: 2.3,
    substitutionRate: 12,
    status: 'active'
  },
  {
    sku: 'SNK-002',
    name: 'Chips Large Pack',
    category: 'Snacks',
    brand: 'Brand C',
    transactions: 2876,
    avgBasketSize: 1.8,
    substitutionRate: 8,
    status: 'active'
  },
  {
    sku: 'PER-003',
    name: 'Shampoo 500ml',
    category: 'Personal Care',
    brand: 'Brand D',
    transactions: 3421,
    avgBasketSize: 1.2,
    substitutionRate: 15,
    status: 'active'
  },
]

export function ProductMix({ filters }: ProductMixProps) {
  const [activeView, setActiveView] = useState('breakdown')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Product Mix & SKU Info</h2>
        <p className="text-muted-foreground">
          Analyze product categories, brands, and substitution patterns
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total SKUs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">1,234</div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +45
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">12</div>
              <Badge variant="outline">
                <Package className="h-3 w-3 mr-1" />
                Stable
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Avg Items/Basket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">2.8</div>
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
              Substitution Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">18.5%</div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <ArrowRight className="h-3 w-3 mr-1" />
                High
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="pareto">Top SKUs</TabsTrigger>
          <TabsTrigger value="flow">Substitution</TabsTrigger>
          <TabsTrigger value="table">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stacked Bar Chart */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Category & Brand Mix</CardTitle>
                <CardDescription>Product distribution by category and brand</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[
                    { category: 'Beverages', brandA: 4532, brandB: 3211, brandC: 987 },
                    { category: 'Snacks', brandA: 2987, brandB: 1876, brandC: 1234 },
                    { category: 'Personal Care', brandA: 1987, brandB: 1654, brandC: 876 },
                    { category: 'Household', brandA: 987, brandB: 765, brandC: 543 },
                    { category: 'Tobacco', brandA: 432, brandB: 321, brandC: 234 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="brandA" stackId="a" fill="#0ea5e9" name="Brand A" />
                    <Bar dataKey="brandB" stackId="a" fill="#10b981" name="Brand B" />
                    <Bar dataKey="brandC" stackId="a" fill="#f59e0b" name="Brand C" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Basket Composition */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Basket Composition</CardTitle>
                <CardDescription>Number of items per transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[
                    { items: '1 item', count: 5432, percentage: 35 },
                    { items: '2 items', count: 4321, percentage: 28 },
                    { items: '3 items', count: 3210, percentage: 21 },
                    { items: '4-5 items', count: 1876, percentage: 12 },
                    { items: '6+ items', count: 654, percentage: 4 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="items" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pareto" className="space-y-4">
          <ParetoChart
            data={paretoData}
            title="Top SKUs by Transaction Volume"
            valueLabel="Transactions"
          />
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <SankeyChart
            nodes={sankeyNodes}
            links={sankeyLinks}
            title="Product Substitution Patterns"
          />
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <DataTable
            data={skuTableData}
            title="SKU Performance Details"
            columns={[
              { key: 'sku', label: 'SKU Code', sortable: true },
              { key: 'name', label: 'Product Name', sortable: true },
              { key: 'category', label: 'Category', sortable: true },
              { key: 'brand', label: 'Brand', sortable: true },
              { 
                key: 'transactions', 
                label: 'Transactions', 
                sortable: true,
                render: (value) => value.toLocaleString()
              },
              { 
                key: 'avgBasketSize', 
                label: 'Avg Basket', 
                sortable: true,
                render: (value) => value.toFixed(1)
              },
              { 
                key: 'substitutionRate', 
                label: 'Substitution %', 
                sortable: true,
                render: (value) => (
                  <Badge variant={value > 10 ? 'secondary' : 'outline'}>
                    {value}%
                  </Badge>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <Badge variant={value === 'active' ? 'default' : 'secondary'}>
                    {value}
                  </Badge>
                )
              }
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base">Top Growing Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Personal Care', 'Beverages', 'Snacks'].map((cat, idx) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm">{cat}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      +{15 - idx * 2}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base">High Substitution Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { from: 'Brand A Shampoo', to: 'Brand B Shampoo', rate: 78 },
                { from: 'Large Chips', to: 'Medium Chips', rate: 65 },
                { from: 'Premium Coffee', to: 'Regular Coffee', rate: 54 },
              ].map((item) => (
                <div key={item.from} className="space-y-1">
                  <div className="flex items-center text-xs">
                    <span className="text-muted-foreground">{item.from}</span>
                    <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                    <span className="font-medium">{item.to}</span>
                  </div>
                  <div className="text-xs text-right text-muted-foreground">
                    {item.rate}% substitution rate
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base">Bundle Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { items: ['Shampoo', 'Conditioner'], frequency: 68 },
                { items: ['Chips', 'Soft Drink'], frequency: 54 },
                { items: ['Coffee', 'Creamer'], frequency: 47 },
              ].map((bundle, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{bundle.items.join(' + ')}</span>
                  <Badge variant="outline">{bundle.frequency}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}