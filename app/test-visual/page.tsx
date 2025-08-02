'use client'

import { SampleChart } from '@/components/charts/sample-chart'

export default function TestVisualFix() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Scout Platform v5 - Visual Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* KPI Cards */}
          <div className="scout-card">
            <p className="scout-label">Total Revenue</p>
            <p className="scout-metric">$124.5K</p>
            <p className="text-sm text-green-600">+12.5% from last month</p>
          </div>
          
          <div className="scout-card">
            <p className="scout-label">Active Users</p>
            <p className="scout-metric">2,345</p>
            <p className="text-sm text-red-600">-3.2% from last month</p>
          </div>
          
          <div className="scout-card">
            <p className="scout-label">Conversion Rate</p>
            <p className="scout-metric">3.45%</p>
            <p className="text-sm text-green-600">+0.5% from last month</p>
          </div>
        </div>
        
        {/* Chart */}
        <div className="mb-8">
          <SampleChart />
        </div>
        
        {/* Table */}
        <div className="scout-card overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    2025-07-31
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    John Doe
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    $250.00
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}