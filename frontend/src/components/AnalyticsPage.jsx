import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react'
import { AnalyticsDashboard } from './AnalyticsCharts'
import { AnimatedBackground } from './BackgroundEffects'
import { SpotlightCard } from '@/components/core/spotlight-card'

export default function AnalyticsPage({ reports, teams, vehicles, onBack, onRefresh, loading }) {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground variant="mesh" showVignette={false} />
      <div className="relative z-10 mx-4 py-4">
        <div className="surface-glass rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="btn btn-ghost p-2"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary-500" aria-hidden="true" />
              <div>
                <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Analytics</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Performance across your response network</div>
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost p-2"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <SpotlightCard innerClassName="p-4">
          <AnalyticsDashboard reports={reports} teams={teams} vehicles={vehicles} />
        </SpotlightCard>
      </div>
    </div>
  )
}
