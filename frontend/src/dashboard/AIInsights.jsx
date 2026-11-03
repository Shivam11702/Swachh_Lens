import { AlertTriangle, Sparkles, TrendingUp, ShieldCheck, BrainCircuit } from 'lucide-react'
import { aiInsights } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

const ICONS = {
  alert: AlertTriangle,
  spark: Sparkles,
  trend: TrendingUp,
  shield: ShieldCheck,
}

const BADGE = {
  danger: 'sw-badge-danger',
  success: 'sw-badge-success',
  info: 'sw-badge-info',
  warning: 'sw-badge-warning',
}

const ICON_BG = {
  alert: 'bg-red-50 text-red-500',
  spark: 'bg-emerald-50 text-emerald-600',
  trend: 'bg-blue-50 text-blue-500',
  shield: 'bg-amber-50 text-amber-500',
}

export default function AIInsights({ insights = aiInsights }) {
  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="sw-card-title flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BrainCircuit size={15} />
            </span>
            AI Insights
          </h2>
          <p className="sw-card-sub">Automated analysis of cleanliness patterns</p>
        </div>
        <span className="sw-badge sw-badge-neutral">Updated 2 min ago</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {insights.map((insight) => {
          const Icon = ICONS[insight.icon]
          return (
            <div
              key={insight.id}
              className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${ICON_BG[insight.icon]}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{insight.title}</span>
                    <span className={`sw-badge ${BADGE[insight.badgeType]}`}>{insight.badge}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{insight.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SpotlightCard>
  )
}
