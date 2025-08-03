import '@/styles/index.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/design-system/theme-provider'
import { Navigation } from '@/components/navigation'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Scout Platform v5 - Geographic Dashboard',
  description: 'Enterprise data analytics platform with ChartVision AI integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="light" storageKey="scout-theme">
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}