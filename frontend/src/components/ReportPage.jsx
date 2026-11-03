import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { fetchReport } from '../api'
import ReportDetail from './ReportDetail'
import Sidebar from '../dashboard/Sidebar'
import Header from '../dashboard/Header'
import DashboardDock from '../dashboard/DashboardDock'
import { SpotlightCard } from '@/components/core/spotlight-card'
import { cn } from '@/lib/utils'
import { navRouteFor } from '../dashboard/nav'

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'team_lead'])

export default function ReportPage({ report, reportId, teams = [], vehicles = [], user, onBack, onOpenReport, onAssigned, onLogin }) {
  const [loading, setLoading] = useState(false)
  const [localReport, setLocalReport] = useState(report)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const canAssign = !!user && ADMIN_ROLES.has(user.role)

  useEffect(() => {
    setLocalReport(report)
  }, [report])

  useEffect(() => {
    let mounted = true
    if (!localReport && reportId) {
      setLoading(true)
      fetchReport(reportId)
        .then((fresh) => { if (mounted) { setLocalReport(fresh); onAssigned?.(fresh) } })
        .catch((e) => console.error('Failed to load report', e))
        .finally(() => { if (mounted) setLoading(false) })
    }
    return () => { mounted = false }
  }, [reportId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdated = (updated) => {
    setLocalReport(updated)
    onAssigned?.(updated)
  }

  const handleOpenReport = async (id) => {
    setLoading(true)
    try {
      const fresh = await fetchReport(id)
      onOpenReport?.(fresh.report_id)
    } catch (e) {
      onOpenReport?.(id)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (id) => {
    const route = navRouteFor(id)
    if (route) {
      window.location.hash = route
    }
  }

  return (
    <div className={`sw-app ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        active="reports"
        onSelect={handleSelect}
        user={user}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen pl-0 transition-[padding] duration-300 lg:pl-[252px]">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-24">
            <DashboardDock active="reports" onSelect={handleSelect} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button className="sw-btn" onClick={onBack}>
              <ArrowLeft size={15} />
              Back to Dashboard
            </button>
            <span className="sw-badge sw-badge-neutral">
              {canAssign ? 'Admin' : 'Viewer'}
            </span>
          </div>

          <div className="mt-4">
            <Header user={user} onMenu={() => setSidebarOpen(true)} onLogin={onLogin} />
          </div>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Loading report…
            </div>
          )}

          {localReport ? (
            <div className="mt-6">
              <SpotlightCard innerClassName="sw-card-pad">
                <ReportDetail
                  report={localReport}
                  teams={teams}
                  vehicles={vehicles}
                  onAssigned={handleUpdated}
                  onOpenReport={handleOpenReport}
                  user={user}
                  canAssign={canAssign}
                />
              </SpotlightCard>
            </div>
          ) : !loading && (
            <div className="mt-6">
              <SpotlightCard innerClassName="sw-card-pad">
                <div className="py-10 text-center">
                  <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Report not found</div>
                  <div className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
                    This report could not be loaded.
                  </div>
                  <button className="sw-btn mt-6" onClick={onBack}>
                    <ArrowLeft size={15} />
                    Back to Dashboard
                  </button>
                </div>
              </SpotlightCard>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
