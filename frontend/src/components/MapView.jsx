import React, { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Layers, Maximize2, Filter, X, AlertTriangle, Package, MapPin as MapPinIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function MapPanner({ center }){
  const map = useMap()
  useEffect(()=>{ if (center) map.setView(center, 13) },[center, map])
  return null
}

const normalizeValue = (value, fallback='medium') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
}

const getPriorityColor = (priority, score) => {
  const normalized = normalizeValue(priority, 'medium').toLowerCase()
  if (normalized === 'high') return '#ef4444'
  if (normalized === 'medium') return '#f59e0b'
  if (normalized === 'low') return '#10b981'
  if (typeof score === 'number') {
    if (score >= 7) return '#ef4444'
    if (score >= 4) return '#f59e0b'
    return '#10b981'
  }
  return '#3b82f6'
}

const getPriorityLabel = (priority) => {
  return normalizeValue(priority, 'medium').toUpperCase()
}

const getPriorityBadge = (priority) => {
  const normalized = normalizeValue(priority, 'medium').toLowerCase()
  if (normalized === 'high') return 'priority-high'
  if (normalized === 'medium') return 'priority-medium'
  if (normalized === 'low') return 'priority-low'
  return 'badge-secondary'
}

const getStatusBadge = (status) => {
  const normalized = normalizeValue(status, 'pending').toLowerCase()
  if (normalized === 'pending') return 'status-pending'
  if (normalized === 'ready') return 'status-ready'
  if (normalized === 'assigned') return 'status-assigned'
  if (normalized === 'completed') return 'status-completed'
  if (normalized === 'cancelled') return 'status-cancelled'
  return 'status-pending'
}

const Legend = ({ reports }) => {
  const priorities = ['high', 'medium', 'low']
  const statuses = ['pending', 'ready', 'assigned']
  
  return (
    <div className="absolute bottom-4 left-4 z-10 surface p-3 rounded-xl shadow-lg border border-slate-200 dark:border-surface-700 animate-in">
      <div className="flex items-center gap-2 mb-2">
        <MapPinIcon className="w-4 h-4 text-primary-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Legend</span>
      </div>
      <div className="space-y-1.5">
        {priorities.map(p => (
          <div key={p} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`w-3 h-3 rounded-full ${getPriorityBadge(p)}`} aria-hidden="true" />
            <span className="capitalize">{p}</span>
          </div>
        ))}
        <div className="border-t border-slate-200 dark:border-surface-700 my-1.5" />
        {statuses.map(s => (
          <div key={s} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`w-3 h-3 rounded-full status-pill ${getStatusBadge(s)}`} aria-hidden="true" />
            <span className="capitalize">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FilterPanel = React.forwardRef(({ reports, onFilterChange, filters }, ref) => {
  const priorities = ['high', 'medium', 'low']
  const statuses = ['pending', 'ready', 'assigned']
  
  return (
    <motion.div
      ref={ref}
      className="absolute top-16 right-4 z-10 surface p-3 rounded-xl shadow-lg border border-slate-200 dark:border-surface-700 w-56 animate-in"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filters</span>
        </div>
        <button 
          onClick={() => onFilterChange({ priority: '', status: '' })}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors"
          aria-label="Clear filters"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 block mb-1">Priority</label>
          <div className="flex flex-wrap gap-1">
            {priorities.map(p => (
              <button
                key={p}
                onClick={() => onFilterChange({ priority: filters.priority === p ? '' : p })}
                className={`px-2 py-1 rounded-full text-xs transition-all ${
                  filters.priority === p 
                    ? `bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-800 dark:text-slate-400 dark:hover:bg-surface-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 block mb-1">Status</label>
          <div className="flex flex-wrap gap-1">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => onFilterChange({ status: filters.status === s ? '' : s })}
                className={`px-2 py-1 rounded-full text-xs transition-all ${
                  filters.status === s
                    ? `bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-800 dark:text-slate-400 dark:hover:bg-surface-700'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

const ClusterMarker = ({ report, isSelected, onClick }) => {
  const color = getPriorityColor(report.ml_results?.priority, report.ml_results?.triage_score)
  const priority = normalizeValue(report.ml_results?.priority, 'medium')
  const status = normalizeValue(report.status, 'pending')
  
  return (
    <CircleMarker
      center={[report.gps.lat, report.gps.lon]}
      radius={isSelected ? 16 : 12}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.7,
        weight: isSelected ? 3 : 2,
        opacity: 1
      }}
      eventHandlers={{ click: () => onClick(report) }}
    >
      <Popup>
        <div className="p-2 min-w-[220px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{report.report_id}</span>
            <span className={`badge ${getPriorityBadge(report.ml_results?.priority)}`}>
              {getPriorityLabel(report.ml_results?.priority)}
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{report.comment || 'No comment'}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className={`status-pill ${getStatusBadge(report.status)}`}>
              {status}
            </span>
            <span className="badge badge-secondary">{getPriorityLabel(report.ml_results?.priority)}</span>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function MapView({ reports = [], onSelect, selected }){
  const [filters, setFilters] = useState({ priority: '', status: '' })
  const [showFilters, setShowFilters] = useState(false)
  
  const center = useMemo(() => 
    selected && selected.gps ? [selected.gps.lat, selected.gps.lon] : 
    (reports && reports.length && reports[0].gps ? [reports[0].gps.lat, reports[0].gps.lon] : [12.9716, 77.5946]),
    [selected, reports]
  )
  
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const tileUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = mapboxToken
    ? '© Mapbox © OpenStreetMap'
    : '&copy; OpenStreetMap contributors'

  const mapRef = useRef()

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (!r.gps) return false
      const priorityMatch = !filters.priority || normalizeValue(r.ml_results?.priority, 'medium').toLowerCase() === filters.priority
      const statusMatch = !filters.status || normalizeValue(r.status, 'pending').toLowerCase() === filters.status
      return priorityMatch && statusMatch
    })
  }, [reports, filters])

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="h-full rounded-2xl overflow-hidden surface border border-slate-200 dark:border-surface-700 relative">
      <div className="map-panel-header flex items-center justify-between gap-3 p-4 bg-slate-50/50 dark:bg-surface-800/50 border-b border-slate-200/50 dark:border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live city map</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Track each report based on GPS and priority.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {filteredReports.length} of {reports.length} markers
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300'
            }`}
            aria-label="Toggle filters"
            aria-pressed={showFilters}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors" aria-label="Toggle layers">
            <Layers className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors" aria-label="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div style={{ height: 'calc(100% - 64px)' }}>
        <MapContainer center={center} zoom={13} style={{height:'100%', width:'100%'}} whenCreated={m=>mapRef.current = m}>
          <TileLayer url={tileUrl} attribution={attribution} />
          <MapPanner center={center} />
          
          {filteredReports.map(r => r.gps && (
            <ClusterMarker
              key={r.report_id}
              report={r}
              isSelected={selected && selected.report_id === r.report_id}
              onClick={onSelect}
            />
          ))}
        </MapContainer>
        
        {/* Legend */}
        <Legend reports={filteredReports} />
        
        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <FilterPanel 
              reports={reports} 
              onFilterChange={handleFilterChange} 
              filters={filters} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
