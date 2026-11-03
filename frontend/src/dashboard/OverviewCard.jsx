import { MapPin, FileText, ClipboardList, CheckCircle2 } from 'lucide-react'
import { overviewMetrics } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

const METRIC_ICONS = [MapPin, FileText, ClipboardList, CheckCircle2]

function ScaleIndicator({ value = 87 }) {
  const stops = [
    { max: 30, label: 'Poor', color: '#ef4444' },
    { max: 60, label: 'Moderate', color: '#f59e0b' },
    { max: 80, label: 'Good', color: '#84cc16' },
    { max: 100, label: 'Excellent', color: '#22c55e' },
  ]
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className="mt-2 w-full">
      <div className="relative h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#ef4444 0%,#f59e0b 28%,#84cc16 55%,#22c55e 82%,#16a34a 100%)' }}>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md"
          style={{ left: `calc(${pct}% - 8px)`, background: '#16a34a' }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-[11px] font-medium text-gray-400">
        {stops.map((s) => (
          <span key={s.label}>{s.label}</span>
        ))}
      </div>
    </div>
  )
}

export default function OverviewCard({ score = 87, metrics = overviewMetrics }) {
  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div className="lg:max-w-sm">
          <h2 className="sw-card-title">Overall Cleanliness</h2>
          <p className="sw-card-sub">Current cleanliness performance across monitored locations</p>
          <div className="mt-8 flex items-end gap-3">
            <span className="text-[64px] font-bold leading-none tracking-tight">{score}%</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">Overall Cleanliness Score</div>
          <ScaleIndicator value={score} />
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-xl lg:grid-cols-4">
          {metrics.map((m, i) => {
            const Icon = METRIC_ICONS[i]
            return (
              <div key={m.label} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon size={16} />
                </div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">{m.value}</div>
                <div className="mt-1 text-xs text-gray-500">{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </SpotlightCard>
  )
}
