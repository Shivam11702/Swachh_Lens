import { useState } from 'react'
import { MapPin, Clock, Trash2 } from 'lucide-react'
import { mapMarkers as mockMarkers } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

const MARKER_STYLE = {
  clean: { color: '#22c55e', ring: 'rgba(34,197,94,0.25)' },
  attention: { color: '#f59e0b', ring: 'rgba(245,158,11,0.25)' },
  critical: { color: '#ef4444', ring: 'rgba(239,68,68,0.25)' },
}

function CityMap() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <rect width="100" height="100" fill="#eef1ee" />
      {/* neighborhoods */}
      <rect x="4" y="6" width="26" height="24" rx="3" fill="#e6eae6" />
      <rect x="34" y="6" width="26" height="24" rx="3" fill="#e2e7e2" />
      <rect x="64" y="6" width="32" height="24" rx="3" fill="#e6eae6" />
      <rect x="4" y="36" width="26" height="24" rx="3" fill="#e2e7e2" />
      <rect x="34" y="36" width="26" height="24" rx="3" fill="#e9ede9" />
      <rect x="64" y="36" width="32" height="24" rx="3" fill="#e2e7e2" />
      <rect x="4" y="66" width="26" height="28" rx="3" fill="#e6eae6" />
      <rect x="34" y="66" width="26" height="28" rx="3" fill="#e2e7e2" />
      <rect x="64" y="66" width="32" height="28" rx="3" fill="#e6eae6" />
      {/* park */}
      <rect x="38" y="40" width="18" height="16" rx="4" fill="#d9ecd9" />
      <rect x="52" y="48" width="8" height="8" rx="3" fill="#cbe5cb" />
      {/* water */}
      <path d="M86 78 q4 -6 8 0 q4 6 6 4 v10 h-20 v-6 q4 -2 6 -8 z" fill="#d7e6ef" />
      {/* main roads */}
      <g stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round">
        <path d="M0 33 H100" />
        <path d="M0 63 H100" />
        <path d="M31 0 V100" />
        <path d="M61 0 V100" />
      </g>
      {/* secondary roads */}
      <g stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M0 48 H100" />
        <path d="M15 0 V100" />
        <path d="M46 0 V100" />
        <path d="M78 0 V100" />
        <path d="M0 78 H100" />
      </g>
      {/* subtle road outline */}
      <g stroke="#d5dad5" strokeWidth="0.3" fill="none">
        <path d="M0 33 H100 M0 63 H100 M31 0 V100 M61 0 V100" />
      </g>
    </svg>
  )
}

export default function CleanlinessMap({ markers = mockMarkers, onSelect }) {
  const [selected, setSelected] = useState(null)

  const handlePick = (m) => {
    setSelected(m)
    if (m.report_id && onSelect) onSelect(m.report_id, m.report)
  }

  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="sw-card-title">Cleanliness Map</h2>
          <p className="sw-card-sub">Live cleanliness status across the city</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Clean
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Needs Attention
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="sw-map relative h-[380px]">
          <CityMap />
          {markers.map((m) => (
            <button
              key={m.report_id || m.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              onClick={() => handlePick(m)}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                style={{ background: MARKER_STYLE[m.type].color, boxShadow: `0 0 0 6px ${MARKER_STYLE[m.type].ring}` }}
              >
                <MapPin size={12} className="text-white" />
              </span>
            </button>
          ))}
        </div>

        <div className="sw-card flex flex-col" style={{ borderRadius: '14px', padding: '18px' }}>
          {selected ? (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: MARKER_STYLE[selected.type].color, color: '#fff' }}
                >
                  <MapPin size={16} />
                </span>
                <div>
                  <div className="text-sm font-semibold">{selected.label}</div>
                  <div className="text-xs text-gray-400">Cleanliness Score</div>
                </div>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-3xl font-bold tracking-tight">{selected.score}%</span>
                <span className="pb-1 text-xs text-gray-400">score</span>
              </div>
              <div className="sw-bar-track mt-2">
                <div
                  className="sw-bar-fill"
                  style={{
                    width: `${selected.score}%`,
                    background: selected.score >= 85 ? '#22c55e' : selected.score >= 75 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center gap-3 text-gray-500">
                  <Trash2 size={15} className="text-gray-300" />
                  Waste Level
                  <span className="ml-auto font-medium text-gray-700">
                    {selected.score >= 85 ? 'Low' : selected.score >= 75 ? 'Moderate' : 'High'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Clock size={15} className="text-gray-300" />
                  Last Inspection
                  <span className="ml-auto font-medium text-gray-700">12 min ago</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <MapPin size={22} />
              </span>
              <div className="mt-3 text-sm font-medium">Select a marker</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                Click a location on the map to view its cleanliness details.
              </p>
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  )
}
