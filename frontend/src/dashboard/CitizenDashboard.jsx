import React, { useState, useMemo } from 'react'
import './styles.css'
import Sidebar from './Sidebar'
import Header from './Header'
import DateFilter from './DateFilter'
import OverviewCard from './OverviewCard'
import RecentReports from './RecentReports'
import CleanlinessMap from './CleanlinessMap'
import QuickActions from './QuickActions'
import DashboardDock from './DashboardDock'
import UploadForm from '../components/UploadForm'
import { SpotlightCard } from '@/components/core/spotlight-card'
import { recentReports, overviewMetrics } from './data'
import { deriveOverview, deriveRecentReports } from './derive'
import { navRouteFor } from './nav'

export default function CitizenDashboard({ user, onLogout, onLogin }) {
  const [active, setActive] = useState('dashboard')
  const [dateFilter, setDateFilter] = useState('Last 7 Days')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const hasRealData = false

  const overview = useMemo(() => deriveOverview([]), [])
  const score = overview?.score ?? 87
  const overviewMetricsData = overview?.metrics ?? overviewMetrics
  const recent = useMemo(() => deriveRecentReports([]) ?? [], [reports])

  const handleSelect = (id) => {
    setActive(id)
    const route = navRouteFor(id)
    if (route) {
      onNavigate?.(route)
    }
  }

  return (
    <div className={`sw-app ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        active={active}
        onSelect={handleSelect}
        user={user}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <main className="min-h-screen pl-0 transition-[padding] duration-300 lg:pl-[252px]">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-24">
            <DashboardDock active={active} onSelect={handleSelect} />
          </div>

          <Header user={user} onMenu={() => setSidebarOpen(true)} onLogin={onLogin} />

          <div className="mt-5">
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          {true && (
            <div className="mt-6">
              <QuickActions onAddReport={onUploadOpen} />
            </div>
          )}

          <div className="mt-6 space-y-6">
            <OverviewCard score={score} metrics={overviewMetricsData} />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <RecentReports reports={recent} onSelect={onOpenReport} />
              <CleanlinessMap simplified />
            </div>
          </div>

          {true && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Refreshing data…
            </div>
          )}

          {!hasRealData && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
              No reports yet — submit your first report above.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}