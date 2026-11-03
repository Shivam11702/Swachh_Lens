import { MapPin, ArrowRight } from 'lucide-react'
import { recentReports } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

const PRIORITY = {
  High: 'sw-badge-danger',
  Medium: 'sw-badge-warning',
  Low: 'sw-badge-neutral',
}

const STATUS = {
  Pending: 'sw-badge-warning',
  Assigned: 'sw-badge-info',
  Resolved: 'sw-badge-success',
}

export default function RecentReports({ reports = recentReports, onSelect }) {
  return (
    <SpotlightCard className="flex h-full flex-col" innerClassName="flex flex-1 flex-col" innerStyle={{ padding: '24px' }}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="sw-card-title">Recent Reports</h2>
          <p className="sw-card-sub">Latest reported cleanliness issues</p>
        </div>
        {onSelect && (
          <button className="sw-btn-link" onClick={() => onSelect?.('all')}>View All Reports →</button>
        )}
      </div>

      <div className="mt-4 flex-1 divide-y divide-gray-100">
        {reports.map((r) => (
          <div
            key={r.report_id || r.issue}
            className={`flex items-start gap-3 py-3.5 first:pt-1 last:pb-0 ${onSelect ? 'cursor-pointer transition-colors hover:bg-gray-50/60' : ''}`}
            onClick={() => onSelect?.(r.report_id, r)}
          >
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              <MapPin size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{r.issue}</span>
                <span className={`sw-badge ${STATUS[r.status]}`}>{r.status}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span>{r.location}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                <span>{r.time}</span>
                <span className={`sw-badge ${PRIORITY[r.priority]}`}>{r.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {onSelect && (
        <button className="sw-btn mt-4 w-full" onClick={() => onSelect?.('all')}>
          View All Reports <ArrowRight size={15} />
        </button>
      )}
    </SpotlightCard>
  )
}
