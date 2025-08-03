import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle, Clock, Activity } from 'lucide-react'

interface TestResult {
  suite: string
  status: 'pass' | 'fail' | 'running' | 'pending'
  passed: number
  failed: number
  duration?: number
  lastRun?: string
}

export function TestStatusDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { suite: 'Smoke Tests', status: 'pending', passed: 0, failed: 0 },
    { suite: 'Sanity Tests', status: 'pending', passed: 0, failed: 0 },
    { suite: 'Unit Tests', status: 'pending', passed: 0, failed: 0 },
    { suite: 'UAT Tests', status: 'pending', passed: 0, failed: 0 }
  ])
  
  const [overallHealth, setOverallHealth] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Mock function to simulate test execution
  const runTests = async () => {
    setIsRunning(true)
    
    // Simulate running each test suite
    const suites = ['Smoke Tests', 'Sanity Tests', 'Unit Tests', 'UAT Tests']
    
    for (let i = 0; i < suites.length; i++) {
      // Update status to running
      setTestResults(prev => prev.map((result, idx) => 
        idx === i ? { ...result, status: 'running' } : result
      ))
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock results
      const passed = Math.floor(Math.random() * 10) + 5
      const failed = Math.floor(Math.random() * 3)
      const duration = Math.floor(Math.random() * 30) + 10
      
      setTestResults(prev => prev.map((result, idx) => 
        idx === i ? {
          ...result,
          status: failed === 0 ? 'pass' : 'fail',
          passed,
          failed,
          duration,
          lastRun: new Date().toISOString()
        } : result
      ))
    }
    
    setIsRunning(false)
  }

  // Calculate overall health score
  useEffect(() => {
    const totalTests = testResults.reduce((sum, r) => sum + r.passed + r.failed, 0)
    const passedTests = testResults.reduce((sum, r) => sum + r.passed, 0)
    
    if (totalTests > 0) {
      setOverallHealth(Math.round((passedTests / totalTests) * 100))
    }
  }, [testResults])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Status Dashboard</h1>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isRunning 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Test Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-4xl font-bold ${getHealthColor(overallHealth)}`}>
                {overallHealth}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {overallHealth >= 90 ? 'Excellent' : 
                 overallHealth >= 70 ? 'Good' : 
                 overallHealth >= 50 ? 'Fair' : 'Poor'}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{testResults.reduce((sum, r) => sum + r.passed, 0)} tests passed</p>
              <p>{testResults.reduce((sum, r) => sum + r.failed, 0)} tests failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Suite Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testResults.map((result, index) => (
          <Card key={index} className={result.status === 'running' ? 'border-blue-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{result.suite}</CardTitle>
                {getStatusIcon(result.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Passed:</span>
                  <span className="font-medium text-green-600">{result.passed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">{result.failed}</span>
                </div>
                {result.duration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{result.duration}s</span>
                  </div>
                )}
                {result.lastRun && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last run: {new Date(result.lastRun).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>npm test</span>
              <span className="text-xs text-gray-600">Run all tests</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>npm run test:smoke</span>
              <span className="text-xs text-gray-600">Quick validation</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>npm run test:unit:watch</span>
              <span className="text-xs text-gray-600">Watch mode</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>npm run test:qa</span>
              <span className="text-xs text-gray-600">Visual QA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Passed</span>
        </div>
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span>Failed</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span>Running</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  )
}

export default TestStatusDashboard