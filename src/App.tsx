import { Routes, Route, Navigate } from 'react-router-dom'
import { ScoutDashboard } from './components/scout-dashboard'
import { ThemeProvider } from './design-system/theme-provider'

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/scout-dashboard" replace />} />
        <Route path="/scout-dashboard/*" element={<ScoutDashboard />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App