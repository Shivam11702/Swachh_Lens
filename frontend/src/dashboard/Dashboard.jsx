import { useState, useMemo } from 'react'
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
import { recentReports, mapMarkers, overviewMetrics } from './data'
import { deriveOverview, deriveRecentReports, deriveMapMarkers } from './derive'
import { navRouteFor } from './nav'

export default function Dashboard({ user, onNavigate, onLogout, onLogin, reports = [], loading, onRefresh, showUpload, onUploadOpen, onUploadClose, onUploadDone, onOpenReport }) {
  const [active, setActive] = useState('dashboard')
  const [dateFilter, setDateFilter] = useState('Last 7 Days')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const hasRealData = reports.length > 0

  const overview = useMemo(() => deriveOverview(reports), [reports])
  const score = overview?.score ?? 87
  const overviewMetricsData = overview?.metrics ?? overviewMetrics
  const recent = useMemo(() => deriveRecentReports(reports) ?? recentReports, [reports])
  const markers = useMemo(() => deriveMapMarkers(reports) ?? mapMarkers, [reports])

  const handleSelect = (id) => {
    setActive(id)
    const route = navRouteFor(id)
    if (route) {
      onNavigate?.(route)
    }
    // Non-built views keep the highlight on the current shell.
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

          {showUpload && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="sw-card-title">Report Upload</h2>
                <button className="sw-btn-link" onClick={onUploadClose}>
                  Close
                </button>
              </div>
              <SpotlightCard>
                <UploadForm onUploaded={onUploadDone} />
              </SpotlightCard>
            </div>
          )}

          <div className="mt-6 space-y-6">
            <QuickActions onAddReport={onUploadOpen} />

            <OverviewCard score={score} metrics={overviewMetricsData} />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <RecentReports reports={recent} onSelect={onOpenReport} />
              <CleanlinessMap markers={markers} onSelect={onOpenReport} />
            </div>
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Refreshing data…
            </div>
          )}

          {!hasRealData && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
              No reports yet — the dashboard is showing sample data. Submit your first report above.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
