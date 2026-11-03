import React from 'react'
import { render, screen } from '@testing-library/react'
import { test, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom'
import ReportsAnalyticsPage from '../ReportsAnalyticsPage'

beforeAll(() => {
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

test('renders no-report empty state when no live data', () => {
  render(
    <ReportsAnalyticsPage reports={[]} teams={[]} vehicles={[]} user={{ name: 'Admin', role: 'admin' }} loading={false} />
  )
  expect(screen.getByText(/No report data yet/i)).toBeInTheDocument()
})

test('renders KPI cards when reports exist', () => {
  const reports = [
    {
      report_id: 'REP-TEST-001',
      status: 'ready',
      category: 'Household waste',
      ml_results: { priority: 'low' },
      landmark: 'Campus Gate',
      created_at: new Date().toISOString(),
    },
  ]
  render(
    <ReportsAnalyticsPage reports={reports} teams={[]} vehicles={[]} user={{ name: 'Admin', role: 'admin' }} loading={false} />
  )
  expect(screen.getByText(/Areas Monitored/i)).toBeInTheDocument()
  expect(screen.getByText(/Issues Detected/i)).toBeInTheDocument()
})
