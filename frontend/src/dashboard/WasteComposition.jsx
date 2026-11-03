import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { wasteComposition } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-gray-400">{d.name}</div>
      <div className="mt-0.5 text-sm font-semibold text-gray-900">{d.value}%</div>
    </div>
  )
}

export default function WasteComposition({ data = wasteComposition }) {
  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <div>
        <h2 className="sw-card-title">Waste Composition</h2>
        <p className="sw-card-sub">Distribution by waste type</p>
      </div>

      <div className="relative mx-auto mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight">100%</span>
          <span className="text-xs text-gray-400">Total Waste</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            <span className="flex-1 text-gray-600">{item.name}</span>
            <span className="font-semibold tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  )
}
