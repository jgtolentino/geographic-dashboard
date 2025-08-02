'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FilterState } from '@/types/scout-dashboard'
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  ShoppingCart,
  Clock,
  MapPin,
  BarChart3,
  ArrowRight
} from 'lucide-react'

interface OverviewProps {
  filters: FilterState
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function Overview({ filters }: OverviewProps) {
  // Mock data
  const revenueData = [
    { month: 'Jan', revenue: 120000 },
    { month: 'Feb', revenue: 135000 },
    { month: 'Mar', revenue: 145000 },
    { month: 'Apr', revenue: 138000 },
    { month: 'May', revenue: 155000 },
    { month: 'Jun', revenue: 168000 },
  ]

  const categoryData = [
    { name: 'Beverages', value: 35, count: 4532 },
    { name: 'Snacks', value: 28, count: 3621 },
    { name: 'Personal Care', value: 20, count: 2587 },
    { name: 'Household', value: 12, count: 1552 },
    { name: 'Tobacco', value: 5, count: 647 },
  ]

  const regionData = [
    { region: 'Metro Manila', transactions: 5432, revenue: 1234567 },
    { region: 'Cebu', transactions: 3210, revenue: 876543 },
    { region: 'Davao', transactions: 2876, revenue: 654321 },
    { region: 'Iloilo', transactions: 2105, revenue: 543210 },
    { region: 'CDO', transactions: 1823, revenue: 432109 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Executive Overview</h2>
        <p className="text-muted-foreground">
          Real-time insights across all Scout Dashboard modules
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel card-transition">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Revenue
              </CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱4.87M</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-xs text-emerald-600 font-medium">+15.2%</span>
              <span className="text-xs text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel card-transition">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Transactions
              </CardDescription>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,892</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-xs text-emerald-600 font-medium">+8.7%</span>
              <span className="text-xs text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel card-transition">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Active Stores
              </CardDescription>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-xs text-emerald-600 font-medium">+23</span>
              <span className="text-xs text-muted-foreground ml-1">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel card-transition">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Avg Basket Size
              </CardDescription>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-xs text-emerald-600 font-medium">+0.3</span>
              <span className="text-xs text-muted-foreground ml-1">items per transaction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="glass-panel lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `₱${value.toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: '#0284c7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Category Mix</CardTitle>
            <CardDescription>Product category distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regional Performance</CardTitle>
              <CardDescription>Transaction volume and revenue by region</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Live Data</Badge>
              <Button variant="ghost" size="sm">
                View Map
                <MapPin className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regionData.map((region, index) => (
              <div key={region.region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{region.region}</span>
                  <span className="text-sm text-muted-foreground">
                    ₱{(region.revenue / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="relative">
                  <div className="h-8 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-azure-blue to-azure-blueDark transition-all duration-500"
                      style={{ width: `${(region.transactions / regionData[0].transactions) * 100}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {region.transactions.toLocaleString()} transactions
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel hover:shadow-elevation-2 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 bg-gradient-to-br from-azure-blue/20 to-azure-blueDark/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-azure-blue" />
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                +12%
              </Badge>
            </div>
            <CardTitle className="text-lg">Transaction Trends</CardTitle>
            <CardDescription>15,842 transactions today</CardDescription>
          </CardHeader>
        </Card>

        <Card className="glass-panel hover:shadow-elevation-2 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                78 SKUs
              </Badge>
            </div>
            <CardTitle className="text-lg">Product Mix</CardTitle>
            <CardDescription>Top: Beverages (35%)</CardDescription>
          </CardHeader>
        </Card>

        <Card className="glass-panel hover:shadow-elevation-2 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                New
              </Badge>
            </div>
            <CardTitle className="text-lg">Consumer Behavior</CardTitle>
            <CardDescription>68% branded requests</CardDescription>
          </CardHeader>
        </Card>

        <Card className="glass-panel hover:shadow-elevation-2 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Active
              </Badge>
            </div>
            <CardTitle className="text-lg">Consumer Profiling</CardTitle>
            <CardDescription>3 new segments identified</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}