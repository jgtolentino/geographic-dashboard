'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, TrendingUp, Home, BarChart } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/geographic', label: 'Geographic', icon: Map },
  { href: '/competitive', label: 'Competitive Intelligence', icon: TrendingUp },
  { href: '/test-visual', label: 'Test Visual', icon: BarChart },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Scout v5
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            100% Real Data • No Mock Services
          </div>
        </div>
      </div>
    </nav>
  )
}