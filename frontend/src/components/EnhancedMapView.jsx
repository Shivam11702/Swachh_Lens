import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin, Layers, Maximize2, Filter, X, AlertTriangle, Package, MapPin as MapPinIcon, SlidersHorizontal, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { reverseGeocode } from '../api'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const normalizeValue = (value, fallback = 'medium') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
}

const escapeHtml = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const getPriorityColor = (priority, score) => {
  const normalized = normalizeValue(priority, 'medium').toLowerCase()
  if (normalized === 'high' || normalized === 'urgent') return '#ef4444'
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
  if (normalized === 'high' || normalized === 'urgent') return 'priority-high'
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

const StatusPulse = ({ color, size = 8, className = '' }) => (
  <motion.span
    className={className}
    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: color,
      display: 'inline-block',
    }}
  />
)

const HeatmapLayer = ({ reports, radius = 30, blur = 20, maxZoom = 17 }) => {
  const map = useMap()
  const heatmapRef = useRef(null)

  useEffect(() => {
    if (!map || !reports.length) return

    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current)
    }

    const heatPoints = reports
      .filter(r => r.gps)
      .map(r => {
        const priority = normalizeValue(r.ml_results?.priority, 'medium').toLowerCase()
        const weight = priority === 'urgent' ? 1.0 : priority === 'high' ? 0.8 : priority === 'medium' ? 0.5 : 0.3
        return [r.gps.lat, r.gps.lon, weight]
      })

    if (heatPoints.length === 0) return

    heatmapRef.current = L.heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom,
      gradient: {
        0.2: '#10b981',
        0.4: '#f59e0b',
        0.6: '#ef4444',
        0.8: '#dc2626',
        1.0: '#991b1b',
      },
    }).addTo(map)

    return () => {
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current)
      }
    }
  }, [map, reports, radius, blur, maxZoom])

  return null
}

const ClusterLayer = ({ reports, onClick, selectedId, placeNames }) => {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!map) return

    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const markers = reports
      .filter(r => r.gps)
      .map(r => {
        const color = getPriorityColor(r.ml_results?.priority, r.ml_results?.triage_score)
        const isSelected = selectedId === r.report_id

        const circleMarker = L.circleMarker([r.gps.lat, r.gps.lon], {
          radius: isSelected ? 18 : 12,
          color: isSelected ? '#ffffff' : color,
          fillColor: color,
          fillOpacity: isSelected ? 0.9 : 0.75,
          weight: isSelected ? 6 : 2,
          opacity: 1,
          className: isSelected ? 'marker-cluster marker-selected' : 'marker-cluster',
        })

        circleMarker.bindPopup(`
          <div class="p-2 min-w-[220px] max-w-[260px]">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-semibold text-slate-900">${r.display_id || r.report_id}</span>
              <span class="badge ${getPriorityBadge(r.ml_results?.priority)}">
                ${getPriorityLabel(r.ml_results?.priority)}
              </span>
            </div>
            ${r.landmark || placeNames[r.report_id] ? `<div class="text-xs text-slate-600 mb-1 flex items-start gap-1"><span>📍</span><span class="break-words">${escapeHtml(r.landmark || placeNames[r.report_id])}</span></div>` : ''}
            <div class="text-sm text-slate-600 mb-2 line-clamp-2">${escapeHtml(r.comment) || 'No comment'}</div>
            <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span class="status-pill ${getStatusBadge(r.status)}">${normalizeValue(r.status, 'pending')}</span>
              ${r.category ? `<span class="badge badge-secondary">${escapeHtml(r.category)}</span>` : ''}
              ${r.estimated_volume ? `<span class="badge badge-secondary">${escapeHtml(r.estimated_volume)}</span>` : ''}
            </div>
          </div>
        `)

        circleMarker.on('click', () => onClick(r))

        return circleMarker
      })

    layerRef.current = L.layerGroup(markers).addTo(map)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map, reports, onClick, selectedId, placeNames])

  return null
}

const Legend = ({ reports, className = '' }) => {
  const priorities = ['urgent', 'high', 'medium', 'low']
  const statuses = ['pending', 'ready', 'assigned', 'in_progress', 'completed']

  return (
    <motion.div
      className={`absolute bottom-4 left-4 z-10 glass-subtle p-3 rounded-xl shadow-glass ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 text-primary-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Legend</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{reports.filter(r => r.gps).length} markers</span>
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Priority</div>
        {priorities.map(p => (
          <div key={p} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`w-3 h-3 rounded-full ${getPriorityBadge(p)} flex items-center justify-center`} aria-hidden="true">
              <StatusPulse color={getPriorityColor(p)} size={4} />
            </span>
            <span className="capitalize">{p}</span>
          </div>
        ))}
        <div className="border-t border-slate-200 dark:border-surface-700 my-1.5" />
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Status</div>
        {statuses.map(s => (
          <div key={s} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`w-3 h-3 rounded-full status-pill ${getStatusBadge(s)}`} aria-hidden="true" />
            <span className="capitalize">{s.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const FilterPanel = React.forwardRef(({ reports, onFilterChange, filters, className = '' }, ref) => {
  const priorities = ['urgent', 'high', 'medium', 'low']
  const statuses = ['pending', 'ready', 'assigned', 'in_progress', 'completed']

  return (
    <motion.div
      ref={ref}
      className={`absolute top-16 right-4 z-10 glass-subtle p-3 rounded-xl shadow-glass w-56 ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filters</span>
        </div>
        <button 
          onClick={() => onFilterChange({ priority: '', status: '', classification: '' })}
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
                {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 block mb-1">Heatmap</label>
          <div className="flex flex-col gap-1.5">
            {['density', 'priority'].map(mode => (
              <button
                key={mode}
                onClick={() => onFilterChange({ heatmap: filters.heatmap === mode ? 'off' : mode })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                  filters.heatmap === mode
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-surface-800'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${filters.heatmap === mode ? 'border-primary-500' : 'border-slate-300 dark:border-surface-600'}`}>
                  {filters.heatmap === mode && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </span>
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

const StatsPanel = React.forwardRef(({ reports, className = '' }, ref) => {  const stats = useMemo(() => {
    const counts = { total: reports.length, urgent: 0, high: 0, medium: 0, low: 0, pending: 0, assigned: 0, completed: 0 }
    reports.forEach(r => {
      const priority = normalizeValue(r.ml_results?.priority, 'medium').toLowerCase()
      const status = normalizeValue(r.status, 'pending').toLowerCase()
      if (counts[priority] !== undefined) counts[priority]++
      if (counts[status] !== undefined) counts[status]++
    })
    return counts
  }, [reports])

  return (
    <motion.div
      ref={ref}
      className={`absolute top-16 left-4 z-10 glass-subtle p-3 rounded-xl shadow-glass ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-primary-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Stats</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="surface-interactive p-2 rounded-lg text-center">
          <div className="text-lg font-bold text-error-600 dark:text-error-400">{stats.urgent + stats.high}</div>
          <div className="text-slate-500 dark:text-slate-400">High Priority</div>
        </div>
        <div className="surface-interactive p-2 rounded-lg text-center">
          <div className="text-lg font-bold text-warning-600 dark:text-warning-400">{stats.medium}</div>
          <div className="text-slate-500 dark:text-slate-400">Medium</div>
        </div>
        <div className="surface-interactive p-2 rounded-lg text-center">
          <div className="text-lg font-bold text-success-600 dark:text-success-400">{stats.low}</div>
          <div className="text-slate-500 dark:text-slate-400">Low</div>
        </div>
        <div className="surface-interactive p-2 rounded-lg text-center">
          <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{stats.total}</div>
          <div className="text-slate-500 dark:text-slate-400">Total</div>
        </div>
      </div>
    </motion.div>
  )
})

const MapPanner = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? 13, { duration: 1.1 })
  }, [center, zoom, map])
  return null
}

const MapResizeHandler = () => {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100)
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => map.invalidateSize())
      : null
    if (observer) observer.observe(map.getContainer())
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      if (observer) observer.disconnect()
    }
  }, [map])
  return null
}

const RouteFitter = ({ route }) => {
  const map = useMap()
  useEffect(() => {
    if (!route || route.length < 2) return
    const bounds = L.latLngBounds(route)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 1 })
  }, [route, map])
  return null
}

export default function EnhancedMapView({ 
  reports = [], 
  onSelect,
  selected,
  onFilterChange,
  filters = { priority: '', status: '', heatmap: 'off' },
  route = null,
  compact = false,
  className = ''
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [viewMode, setViewMode] = useState('markers')
  const mapRef = useRef(null)
  const [placeNames, setPlaceNames] = useState({})

  const center = useMemo(() => 
    selected?.gps ? [selected.gps.lat, selected.gps.lon] : 
    (reports.length && reports[0].gps ? [reports[0].gps.lat, reports[0].gps.lon] : [12.9716, 77.5946]),
    [selected, reports]
  )

  const zoom = selected?.gps ? 14 : 11

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const tileUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = mapboxToken
    ? '© Mapbox © OpenStreetMap'
    : '&copy; OpenStreetMap contributors'

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (!r.gps) return false
      const priorityMatch = !filters.priority || normalizeValue(r.ml_results?.priority, 'medium').toLowerCase() === filters.priority
      const statusMatch = !filters.status || normalizeValue(r.status, 'pending').toLowerCase() === filters.status
      return priorityMatch && statusMatch
    })
  }, [reports, filters])

  const handleFilterChange = useCallback((newFilters) => {
    onFilterChange?.({ ...filters, ...newFilters })
  }, [filters, onFilterChange])

  // Reverse-geocode place names for reports lacking a landmark
  useEffect(() => {
    let cancelled = false
    const missing = filteredReports.filter(r => r.gps && !r.landmark && !placeNames[r.report_id])
    if (missing.length === 0) return
    Promise.all(missing.map(r =>
      reverseGeocode(r.gps.lat, r.gps.lon).then(name => ({ id: r.report_id, name })).catch(() => null)
    )).then(results => {
      if (cancelled) return
      const next = {}
      results.forEach(r => { if (r && r.name) next[r.id] = r.name })
      if (Object.keys(next).length) setPlaceNames(prev => ({ ...prev, ...next }))
    })
    return () => { cancelled = true }
  }, [filteredReports, placeNames])

  return (
    <div className={`h-full rounded-2xl overflow-hidden relative border border-white/60 dark:border-white/10 shadow-glass ${compact ? 'border-transparent shadow-none' : ''} ${className}`}>
      {!compact && (
      <div className="map-panel-header flex items-center justify-between gap-3 p-4 border-b border-white/40 dark:border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="p-2 rounded-xl bg-white/70 text-primary-600 dark:bg-white/10 dark:text-primary-400 backdrop-blur-lg"
          >
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </motion.div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live city map</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {filteredReports.length} of {reports.length} markers · {viewMode} view
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {filteredReports.length} markers
          </div>
          
          <AnimatePresence mode="popLayout">
            {viewMode !== 'heatmap' && (
              <motion.button
                key="filter"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300'
                }`}
                aria-label="Toggle filters"
                aria-pressed={showFilters}
              >
                <Filter className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode(viewMode === 'markers' ? 'heatmap' : 'markers')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'heatmap'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300'
            }`}
            aria-label="Toggle heatmap"
            aria-pressed={viewMode === 'heatmap'}
          >
            {viewMode === 'heatmap' ? <Layers className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStats(!showStats)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors"
            aria-label="Toggle stats"
            aria-pressed={showStats}
          >
            {showStats ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-surface-800 dark:hover:text-slate-300 transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      )}
      
      <div style={{ height: compact ? '100%' : 'calc(100% - 64px)' }}>
        <MapContainer 
          center={center} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }} 
          whenCreated={m => mapRef.current = m}
          preferCanvas={true}
        >
          <TileLayer url={tileUrl} attribution={attribution} />
          <MapPanner center={center} zoom={zoom} />
          <MapResizeHandler />
          {route && route.length > 1 && (
            <>
              <Polyline positions={route} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.85 }} />
              <RouteFitter route={route} />
            </>
          )}
          
          {viewMode === 'heatmap' && filters.heatmap !== 'off' && (
            <HeatmapLayer 
              reports={filteredReports}
              radius={filters.heatmap === 'priority' ? 40 : 30}
              blur={25}
            />
          )}

          {viewMode === 'markers' && (
            <ClusterLayer
              reports={filteredReports}
              onClick={onSelect}
              selectedId={selected?.report_id}
              placeNames={placeNames}
            />
          )}
        </MapContainer>
        
        <AnimatePresence>
          {!compact && showStats && <StatsPanel reports={filteredReports} />}
        </AnimatePresence>
        
        <AnimatePresence>
          {!compact && showFilters && <FilterPanel reports={reports} onFilterChange={handleFilterChange} filters={filters} />}
        </AnimatePresence>

        {!compact && <Legend reports={filteredReports} />}
      </div>
    </div>
  )
}