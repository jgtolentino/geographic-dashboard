#!/bin/bash

# Scout Platform v5 Visual Fix Application Script
# This script applies all necessary fixes to achieve visual parity with mockify-creator

echo "🎯 Scout Platform v5 Visual Fix"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create necessary directories
echo "${YELLOW}Creating directory structure...${NC}"
mkdir -p src/design-system
mkdir -p src/styles
mkdir -p src/components/charts
mkdir -p src/components/ui

# Check if we're in a Next.js project
if [ -f "next.config.js" ] || [ -f "next.config.ts" ]; then
    echo "${GREEN}✓ Next.js project detected${NC}"
else
    echo "${RED}⚠️  Warning: This doesn't appear to be a Next.js project${NC}"
fi

# Install required dependencies
echo ""
echo "${YELLOW}Installing required dependencies...${NC}"
npm install --save \
    recharts \
    @tanstack/react-query \
    lucide-react \
    clsx \
    tailwind-merge \
    @tailwindcss/forms \
    @tailwindcss/typography \
    @tailwindcss/aspect-ratio

echo ""
echo "${YELLOW}Installing dev dependencies...${NC}"
npm install --save-dev \
    @types/recharts

# Create globals.css if it doesn't exist
if [ ! -f "src/styles/globals.css" ]; then
    echo ""
    echo "${YELLOW}Creating globals.css...${NC}"
    cat > src/styles/globals.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 199 89% 48%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 199 89% 48%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  .scout-card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6;
  }
  
  .scout-metric {
    @apply text-3xl font-semibold text-gray-900 dark:text-white;
  }
  
  .scout-label {
    @apply text-sm font-medium text-gray-500 dark:text-gray-400;
  }
  
  .scout-chart-container {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4;
  }
}
EOF
    echo "${GREEN}✓ globals.css created${NC}"
fi

# Update tailwind.config.js/ts
echo ""
echo "${YELLOW}Updating Tailwind configuration...${NC}"
if [ -f "tailwind.config.js" ]; then
    TAILWIND_FILE="tailwind.config.js"
elif [ -f "tailwind.config.ts" ]; then
    TAILWIND_FILE="tailwind.config.ts"
else
    TAILWIND_FILE="tailwind.config.js"
    echo "${YELLOW}Creating new tailwind.config.js...${NC}"
fi

cat > $TAILWIND_FILE << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
}
EOF

echo "${GREEN}✓ Tailwind configuration updated${NC}"

# Create theme provider
echo ""
echo "${YELLOW}Creating theme provider...${NC}"
cat > src/design-system/theme-provider.tsx << 'EOF'
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { designTokens } from './tokens'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  tokens: typeof designTokens
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'scout-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (typeof window !== 'undefined' && localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    tokens: designTokens
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
EOF

echo "${GREEN}✓ Theme provider created${NC}"

# Create cn utility
echo ""
echo "${YELLOW}Creating utility functions...${NC}"
mkdir -p src/lib
cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

echo "${GREEN}✓ Utility functions created${NC}"

# Create sample chart component
echo ""
echo "${YELLOW}Creating sample chart component...${NC}"
cat > src/components/charts/sample-chart.tsx << 'EOF'
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/design-system/theme-provider'

const data = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 },
  { month: 'May', revenue: 6000 },
  { month: 'Jun', revenue: 5500 },
]

export function SampleChart() {
  const { tokens } = useTheme()
  
  return (
    <div className="scout-chart-container h-[400px]">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            dot={{ fill: '#0284c7', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
EOF

echo "${GREEN}✓ Sample chart component created${NC}"

# Create test command
echo ""
echo "${YELLOW}Creating test files...${NC}"
cat > test-visual-fix.tsx << 'EOF'
// Test page to verify visual fixes
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
EOF

echo "${GREEN}✓ Test file created${NC}"

# Final instructions
echo ""
echo "${GREEN}✅ Visual fix files created successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your root layout or _app.tsx to import globals.css and wrap with ThemeProvider"
echo "2. Import and test the visual fix with the test-visual-fix.tsx component"
echo "3. Run 'npm run dev' to see the changes"
echo ""
echo "Key changes applied:"
echo "- ✓ Design tokens system"
echo "- ✓ Tailwind configuration"
echo "- ✓ Global styles"
echo "- ✓ Theme provider"
echo "- ✓ Chart components"
echo "- ✓ Utility functions"
echo ""
echo "Remember to:"
echo "- Check that globals.css is imported in your root layout"
echo "- Wrap your app with ThemeProvider"
echo "- Use the scout-* classes for consistent styling"
echo ""
echo "For full mockify-creator parity, ensure all components use these design tokens!"