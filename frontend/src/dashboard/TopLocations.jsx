import { MapPin } from 'lucide-react'
import { topLocations } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

export default function TopLocations({ locations = topLocations }) {
  return (
    <SpotlightCard className="flex h-full flex-col" innerClassName="flex flex-1 flex-col" innerStyle={{ padding: '24px' }}>
      <div>
        <h2 className="sw-card-title">Top Performing Locations</h2>
        <p className="sw-card-sub">Best cleanliness scores this period</p>
      </div>

      <div className="mt-5 flex flex-1 flex-col gap-1">
        {locations.map((loc, i) => (
          <div
            key={loc.name}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              i === 0 ? 'bg-emerald-50/70 ring-1 ring-emerald-100' : 'hover:bg-gray-50'
            }`}
          >
            <span className={`w-7 text-sm font-semibold ${i === 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {loc.rank}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm">
              <MapPin size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{loc.name}</div>
              <div className="mt-0.5 h-1 w-full max-w-[140px] rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${loc.score}%` }} />
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums">{loc.score}%</span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  )
}
