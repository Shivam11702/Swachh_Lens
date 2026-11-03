import { TrendingUp, TrendingDown } from 'lucide-react'
import Sparkline from './Sparkline'
import { SpotlightCard } from '@/components/core/spotlight-card'

export default function MetricCard({ kpi, index = 0 }) {
  const colors = ['#22c55e', '#16a34a', '#3b82f6', '#ef4444']
  const color = colors[index % colors.length]

  return (
    <SpotlightCard innerClassName="sw-card-hover sw-card-pad" innerStyle={{ padding: '20px' }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-medium text-gray-500">{kpi.label}</div>
          <div className="mt-2 text-[32px] font-semibold leading-none tracking-tight">{kpi.value}</div>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-semibold ${
            kpi.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {kpi.delta}
        </span>
      </div>
      <div className="mt-4 flex justify-end">
        <Sparkline data={kpi.spark} color={color} width={120} height={34} />
      </div>
    </SpotlightCard>
  )
}
