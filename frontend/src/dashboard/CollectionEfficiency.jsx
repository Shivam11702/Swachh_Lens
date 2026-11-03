import { collectionBreakdown } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

function Radial({ value = 78 }) {
  const r = 72
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c

  return (
    <div className="relative mx-auto h-[180px] w-[180px]">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f1f2f1" strokeWidth="14" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] font-bold leading-none tracking-tight">{value}%</span>
        <span className="mt-1.5 text-xs text-gray-400">Collection Efficiency</span>
      </div>
    </div>
  )
}

export default function CollectionEfficiency({ value = 78, breakdown = collectionBreakdown }) {
  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <div>
        <h2 className="sw-card-title">Collection Efficiency</h2>
        <p className="sw-card-sub">Waste collected vs scheduled for the period</p>
      </div>

      <div className="mt-6">
        <Radial value={value} />
      </div>

      <div className="mt-6 space-y-4">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
              <span className="font-semibold tabular-nums">{item.value}%</span>
            </div>
            <div className="sw-bar-track">
              <div className="sw-bar-fill" style={{ width: `${item.value}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </SpotlightCard>
  )
}
