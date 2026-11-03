import { MapPin } from 'lucide-react'
import { locations as mockLocations } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

const BADGE_MAP = {
  success: 'sw-badge-success',
  good: 'sw-badge-good',
  warning: 'sw-badge-warning',
  danger: 'sw-badge-danger',
}

const WASTE_DOT = {
  Low: 'bg-emerald-500',
  Moderate: 'bg-amber-500',
  High: 'bg-red-500',
}

export default function LocationMonitoring({ locations = mockLocations }) {
  return (
    <SpotlightCard innerStyle={{ paddingBottom: '10px' }}>
      <div className="sw-card-header">
        <div>
          <h2 className="sw-card-title">Location Monitoring</h2>
          <p className="sw-card-sub">Real-time cleanliness status across monitored locations</p>
        </div>
        <button className="sw-btn-link hidden text-sm sm:inline-flex">View all locations</button>
      </div>

      <div className="mt-4 sw-table-wrap">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Cleanliness</th>
              <th>Waste Level</th>
              <th>Last Inspection</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.location}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                      <MapPin size={15} />
                    </span>
                    <span className="font-medium">{loc.location}</span>
                  </div>
                </td>
                <td className="sw-tbl-muted">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 text-sm font-semibold text-gray-700 tabular-nums">{loc.cleanliness}%</span>
                    <span className="sw-bar-track w-20">
                      <span className="sw-bar-fill block" style={{ width: `${loc.cleanliness}%`, background: loc.cleanliness >= 80 ? '#22c55e' : loc.cleanliness >= 70 ? '#f59e0b' : '#ef4444' }} />
                    </span>
                  </div>
                </td>
                <td>
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={`h-2 w-2 rounded-full ${WASTE_DOT[loc.waste]}`} />
                    {loc.waste}
                  </span>
                </td>
                <td className="sw-tbl-muted">{loc.inspected}</td>
                <td>
                  <span className={`sw-badge ${BADGE_MAP[loc.statusType]}`}>
                    <span className="dot" />
                    {loc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SpotlightCard>
  )
}
