import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { trendData } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-gray-900">{payload[0].value}% Cleanliness</div>
    </div>
  )
}

export default function TrendChart({ data = trendData }) {
  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="sw-card-title">Cleanliness Trends</h2>
          <p className="sw-card-sub">Average cleanliness score over the selected period</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M7 11 L7 3" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M3 7 L7 3 L11 7" stroke="#22c55e" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            +8.4%
          </span>
          <span className="text-xs text-gray-400">vs previous period</span>
        </div>
      </div>

      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="swTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eceef0" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#d1d5db', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#swTrend)"
              dot={false}
              activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SpotlightCard>
  )
}
