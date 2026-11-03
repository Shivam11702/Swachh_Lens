import React, { useState, useEffect, useCallback } from 'react'
import { assignReport, fetchReport, patchReport, updateReportStatus, addComment, fetchRoute, DEFAULT_DEPOT } from '../api'
import { useReverseGeocode } from '../hooks/useReverseGeocode'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, MapPin, Clock, AlertTriangle, Image, Brain, Package, MapPin as MapPinIcon, CheckCircle, Loader2, MapPinned, Pencil, MessageSquare, Send, Copy, ArrowRight, CheckCircle2, PlayCircle, XCircle, AlertCircle, Navigation, ExternalLink, Crosshair, Route as RouteIcon } from 'lucide-react'

const normalizeValue = (value, fallback='medium') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
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

const getPriorityIcon = (priority) => {
  const normalized = normalizeValue(priority, 'medium').toLowerCase()
  if (normalized === 'high') return <AlertTriangle className="w-4 h-4" aria-hidden="true" />
  if (normalized === 'medium') return <Package className="w-4 h-4" aria-hidden="true" />
  if (normalized === 'low') return <MapPinIcon className="w-4 h-4" aria-hidden="true" />
  return <Package className="w-4 h-4" aria-hidden="true" />
}

const getPriorityColor = (priority) => {
  const normalized = normalizeValue(priority, 'medium').toLowerCase()
  if (normalized === 'high') return 'text-error-600 dark:text-error-400'
  if (normalized === 'medium') return 'text-warning-600 dark:text-warning-400'
  if (normalized === 'low') return 'text-success-600 dark:text-success-400'
  return 'text-slate-500 dark:text-slate-400'
}

const EmptyState = () => (
  <div className="surface p-8 text-center animate-in" role="status">
    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-4">
      <MapPinIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
    </div>
    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">No report selected</div>
    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose an incident from the list or map to review details.</div>
  </div>
)

const SectionTitle = ({ icon: Icon, children, action }) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
      {children}
    </div>
    {action}
  </div>
)

const PhotoGrid = ({ photos }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    }}
  >
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((p, i) => (
        <motion.div
          key={i}
          className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-surface-800 group"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
        >
          <img 
            src={p.thumbnail_url || p.url} 
            alt={`Report photo ${i + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="text-white text-sm font-medium truncate block max-w-full">{p.filename || `Photo ${i + 1}`}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
)

const formatMlValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'classification' && Array.isArray(value)) {
    return value.map(v => (typeof v === 'object' ? v.label : v)).filter(Boolean).join(', ') || '—'
  }
  if (Array.isArray(value)) {
    return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ')
  }
  return String(value)
}

const MLInsights = ({ mlResults }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <SectionTitle icon={Brain}>ML insights</SectionTitle>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
      {mlResults && Object.entries(mlResults).map(([key, value]) => (
        <div key={key} className="surface-quiet p-3 rounded-lg min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 break-words">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <div className="font-mono text-sm text-slate-900 dark:text-slate-100 break-words min-w-0">
            {formatMlValue(key, value)}
          </div>
        </div>
      ))}
      {(!mlResults || Object.keys(mlResults).length === 0) && (
        <div className="text-sm text-slate-500 dark:text-slate-400">No ML insights yet.</div>
      )}
    </div>
    <details className="surface-quiet rounded-lg overflow-hidden">
      <summary className="p-3 cursor-pointer flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
        <Brain className="w-4 h-4" aria-hidden="true" />
        Raw JSON
      </summary>
      <pre className="overflow-x-auto p-4 text-xs text-slate-700 dark:text-slate-300 font-mono border-t border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
        {JSON.stringify(mlResults || {}, null, 2)}
      </pre>
    </details>
  </motion.div>
)

const AssignmentForm = ({ teams, vehicles, onAssign, reportId, assigning, assignment, onCancel }) => {
  const [teamId, setTeamId] = useState(assignment?.team_id || '')
  const [vehicleId, setVehicleId] = useState(assignment?.vehicle_id || '')
  const [scheduledTime, setScheduledTime] = useState(assignment?.scheduled_time ? new Date(assignment.scheduled_time).toISOString().slice(0, 16) : '')
  const [note, setNote] = useState(assignment?.note || '')
  const editing = !!assignment

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!teamId || !vehicleId) return
    onAssign(teamId, vehicleId, scheduledTime ? new Date(scheduledTime).toISOString() : null, note)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Team</label>
        <select 
          className="select" 
          value={teamId} 
          onChange={e=>setTeamId(e.target.value)}
          disabled={assigning}
        >
          <option value="">Select team</option>
          {teams.map(t=> <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Vehicle</label>
        <select 
          className="select" 
          value={vehicleId} 
          onChange={e=>setVehicleId(e.target.value)}
          disabled={assigning}
        >
          <option value="">Select vehicle</option>
          {vehicles.map(v=> <option key={v.vehicle_id} value={v.vehicle_id}>{v.type} ({v.vehicle_id})</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Scheduled time</label>
          <input
            type="datetime-local"
            className="input"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            disabled={assigning}
          />
        </div>
        <div>
          <label className="label">Note</label>
          <input
            type="text"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            disabled={assigning}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row pt-2">
        <button 
          type="submit" 
          className="btn btn-primary flex-1 justify-center" 
          disabled={assigning || !teamId || !vehicleId}
        >
          {assigning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              Saving…
            </>
          ) : (
            editing ? 'Save changes' : 'Assign report'
          )}
        </button>
        {editing && (
          <button 
            type="button" 
            className="btn btn-secondary flex-1 justify-center" 
            onClick={onCancel}
            disabled={assigning}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

const formatDistance = (m) => {
  if (m == null) return '—'
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

const formatDuration = (s) => {
  if (s == null) return '—'
  const mins = Math.round(s / 60)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const stepText = (step) => {
  if (step.instruction) return step.instruction
  const dir = step.modifier ? step.modifier.replace('-', ' ') : 'continue'
  const type = step.type || 'continue'
  if (type === 'depart') return `Start${step.name ? ` on ${step.name}` : ''}`
  if (type === 'arrive') return `Arrive at destination${step.name ? ` (${step.name})` : ''}`
  if (type === 'roundabout') return `Take the roundabout${step.name ? ` (${step.name})` : ''}`
  return `${type === 'turn' ? 'Turn' : 'Head'} ${dir}${step.name ? ` onto ${step.name}` : ''}`
}

const DirectionsPanel = ({ report, onRoute }) => {
  const dest = report?.gps
  const [start, setStart] = useState(DEFAULT_DEPOT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [route, setRouteState] = useState(null)

  const load = useCallback(async (s) => {
    if (!dest) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetchRoute(s, { lat: dest.lat, lon: dest.lon })
      setRouteState(r)
      onRoute && onRoute(r.coordinates)
    } catch (e) {
      setError('Could not calculate route')
      onRoute && onRoute(null)
    } finally {
      setLoading(false)
    }
  }, [dest, onRoute])

  useEffect(() => {
    load(start)
    return () => { onRoute && onRoute(null) }
  }, [load, start, onRoute])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setStart({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'My location' }),
      () => setError('Could not get your location')
    )
  }

  if (!dest) return null

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lon}&destination=${dest.lat},${dest.lon}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SectionTitle
        icon={RouteIcon}
        action={
          <button
            type="button"
            className="btn btn-secondary flex items-center gap-1.5 text-xs"
            onClick={useMyLocation}
          >
            <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
            Use my location
          </button>
        }
      >
        Directions for cleaner
      </SectionTitle>

      <div className="surface-quiet p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="w-4 h-4 text-primary-500" aria-hidden="true" />
          <span>
            From <span className="font-medium text-slate-800 dark:text-slate-200">{start.label}</span> to report location
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Calculating route…
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-error-600 dark:text-error-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
          </div>
        )}

        {route && !loading && (
          <>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-primary-500" aria-hidden="true" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {route.distance != null ? formatDistance(route.distance) : '—'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-500" aria-hidden="true" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {route.duration != null ? formatDuration(route.duration) : '—'}
                </span>
              </div>
            </div>
            {route.straight && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Straight-line estimate (live road routing unavailable).
              </div>
            )}
            {route.steps && route.steps.length > 0 && (
              <ol className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {route.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex-shrink-0 w-5 text-right font-medium text-slate-400">{i + 1}.</span>
                    <span>
                      {stepText(s)} <span className="text-slate-400">({formatDistance(s.distance)})</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary w-full justify-center flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" /> Open in Maps
        </a>
      </div>
    </motion.div>
  )
}

const DetailsEditForm = ({ report, onSave, onCancel, busy }) => {
  const [comment, setComment] = useState(report.comment || '')
  const [category, setCategory] = useState(report.category || '')
  const [volume, setVolume] = useState(report.estimated_volume || '')
  const [landmark, setLandmark] = useState(report.landmark || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ comment, category, estimated_volume: volume, landmark })
  }

  return (
    <form onSubmit={handleSubmit} className="surface-quiet p-4 rounded-lg space-y-4">
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px]"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe the report"
          disabled={busy}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Category</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
            <option value="">Select</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Volume</label>
          <select className="select" value={volume} onChange={(e) => setVolume(e.target.value)} disabled={busy}>
            <option value="">Select</option>
            {VOLUME_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Landmark</label>
          <input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Nearby landmark" disabled={busy} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={busy}>
          {busy ? <><Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />Saving…</> : 'Save details'}
        </button>
        <button type="button" className="btn btn-secondary flex-1 justify-center" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}

const STATUS_TRANSITIONS = {
  pending: ['ready', 'cancelled'],
  ready: ['assigned', 'pending'],
  assigned: ['in_progress', 'ready', 'cancelled'],
  in_progress: ['completed', 'assigned'],
  completed: ['closed', 'in_progress'],
  cancelled: ['pending'],
}

const STATUS_ACTION_META = {
  ready: { label: 'Mark ready', icon: CheckCircle2 },
  assigned: { label: 'Assign', icon: Truck },
  in_progress: { label: 'Start cleanup', icon: PlayCircle },
  completed: { label: 'Complete', icon: CheckCircle },
  closed: { label: 'Close', icon: CheckCircle2 },
  pending: { label: 'Reopen', icon: ArrowRight },
  cancelled: { label: 'Cancel', icon: XCircle },
}

const CATEGORY_OPTIONS = [
  'Household waste',
  'Plastic & packaging',
  'Organic / food waste',
  'Construction & debris',
  'Hazardous waste',
  'E-waste',
  'Mixed / unknown',
]

const VOLUME_OPTIONS = [
  'Small (1 bag)',
  'Medium (a few bags)',
  'Large (half truck)',
  'Very large (full truck)',
  'Unknown',
]

export default function ReportDetail({ report, teams = [], vehicles = [], onAssigned, onOpenReport, user, onRoute, canAssign = true }){
  const [assigning, setAssigning] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsBusy, setDetailsBusy] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const { name: geocodedName, loading: geocoding } = useReverseGeocode(report?.gps?.lat, report?.gps?.lon, !!report)

  if (!report) return <EmptyState />

  const reportLabel = report.display_id || report.report_id
  const assignment = report.assignment
  const canReassign = assignment && (report.status === 'assigned' || report.status === 'in_progress')
  const duplicateOf = report.ml_results?.duplicate_of

  const PRIMARY_ACTION = {
    pending:     { label: 'Mark ready', to: 'ready', icon: CheckCircle2, run: () => doStatusChange('ready') },
    ready:       { label: 'Assign crew', to: 'assigned', icon: Truck, run: () => setEditingAssignment(true) },
    assigned:    { label: 'Start cleanup', to: 'in_progress', icon: PlayCircle, run: () => doStatusChange('in_progress') },
    in_progress: { label: 'Mark completed', to: 'completed', icon: CheckCircle, run: () => doStatusChange('completed') },
    completed:   { label: 'Close report', to: 'closed', icon: CheckCircle2, run: () => doStatusChange('closed') },
    cancelled:   { label: 'Reopen', to: 'pending', icon: ArrowRight, run: () => doStatusChange('pending') },
  }
  const primary = PRIMARY_ACTION[report.status] || null
  const otherActions = (STATUS_TRANSITIONS[report.status] || []).filter(t => !primary || t !== primary.to)

  const teamName = assignment ? (teams.find(t => t.team_id === assignment.team_id)?.name || assignment.team_id) : null
  const vehicleLabel = assignment ? (vehicles.find(v => v.vehicle_id === assignment.vehicle_id)?.type || assignment.vehicle_id) : null

  const doAssign = async (teamId, vehicleId, scheduledTime, note) => {
    setAssigning(true)
    const optimistic = { ...report, assignment: { team_id: teamId, vehicle_id: vehicleId, scheduled_time: scheduledTime || null, note: note || null }, status: 'assigned' }
    onAssigned && onAssigned(optimistic)
    try{
      const payload = { team_id: teamId, vehicle_id: vehicleId, scheduled_time: scheduledTime, note }
      const updated = await assignReport(report.report_id, payload)
      onAssigned && onAssigned(updated)
      setEditingAssignment(false)
    }catch(e){
      console.error(e)
      alert('Assignment failed — reverting')
      try{ 
        const fresh = await fetchReport(report.report_id)
        onAssigned && onAssigned(fresh) 
      }catch(err){ console.error('Revert fetch failed', err) }
    } finally { setAssigning(false) }
  }

  const doStatusChange = async (status) => {
    setStatusBusy(true)
    const optimistic = { ...report, status }
    onAssigned && onAssigned(optimistic)
    try{
      const updated = await updateReportStatus(report.report_id, status)
      onAssigned && onAssigned(updated)
    }catch(e){
      console.error(e)
      alert('Status update failed — reverting')
      try{ 
        const fresh = await fetchReport(report.report_id)
        onAssigned && onAssigned(fresh) 
      }catch(err){ console.error('Revert fetch failed', err) }
    } finally { setStatusBusy(false) }
  }

  const doPatchDetails = async (payload) => {
    setDetailsBusy(true)
    try{
      const updated = await patchReport(report.report_id, payload)
      onAssigned && onAssigned(updated)
      setEditingDetails(false)
    }catch(e){
      console.error(e)
      alert('Update failed')
    } finally { setDetailsBusy(false) }
  }

  const handleAddComment = async () => {
    const text = newComment.trim()
    if (!text) return
    setCommentBusy(true)
    try{
      const updated = await addComment(report.report_id, text, user?.name || user?.email || 'Operator')
      onAssigned && onAssigned(updated)
      setNewComment('')
    }catch(e){
      console.error(e)
      alert('Comment failed')
    } finally { setCommentBusy(false) }
  }

  const normalizedPriority = normalizeValue(report.ml_results?.priority, 'Medium')
  const normalizedCategory = report.category || normalizeValue(report.ml_results?.classification, 'Uncategorized')
  const normalizedVolume = report.estimated_volume || normalizeValue(report.ml_results?.volume_bin, 'Unknown')
  const priorityColor = getPriorityColor(report.ml_results?.priority)
  const locationLabel = report.landmark || geocodedName || (report.gps ? `${report.gps.lat.toFixed(4)}, ${report.gps.lon.toFixed(4)}` : 'Not available')

  return (
    <motion.div 
      className="surface animate-in" 
      initial={{ opacity:0, y:10 }} 
      animate={{ opacity:1, y:0 }} 
      transition={{ duration:0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {reportLabel}
            <span className={`status-pill ${getStatusBadge(report.status)}`}>
              {normalizeValue(report.status, 'pending')}
            </span>
          </h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'No timestamp'}
          </div>
        </div>
      </div>

      {/* Duplicate detection banner */}
      {duplicateOf && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 text-sm text-warning-800 dark:text-warning-200 mt-4">
          <Copy className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1">
            This report looks like a duplicate of <span className="font-semibold">{duplicateOf}</span>.
          </span>
          {onOpenReport && (
            <button
              type="button"
              className="btn btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs"
              onClick={() => onOpenReport(duplicateOf)}
            >
              Open original <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Primary action + secondary transitions */}
      {canAssign && (
      <div className="mt-4">
        {primary && (
          <button
            type="button"
            className="btn btn-primary w-full justify-center sm:w-auto"
            onClick={primary.run}
            disabled={statusBusy}
          >
            <primary.icon className="w-4 h-4" aria-hidden="true" />
            {primary.label}
          </button>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {primary ? 'Other actions:' : 'Actions:'}
          </span>
          {otherActions.map((next) => {
            const meta = STATUS_ACTION_META[next]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <button
                key={next}
                type="button"
                className="btn btn-secondary flex items-center gap-1.5 text-xs"
                onClick={() => doStatusChange(next)}
                disabled={statusBusy}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {meta.label}
              </button>
            )
          })}
          {statusBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-400" aria-hidden="true" />}
        </div>
      </div>
      )}

      {/* Stats Grid */}
      {/* Key facts - flat, quiet, no extra cards */}
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Priority</div>
          <div className="mt-0.5">
            <span className={`badge ${getPriorityBadge(report.ml_results?.priority)} flex items-center gap-1`}>
              <span className={priorityColor} aria-hidden="true">
                {getPriorityIcon(report.ml_results?.priority)}
              </span>
              {normalizedPriority.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</div>
          <div className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100">{normalizedCategory}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Volume</div>
          <div className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100">{normalizedVolume}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Location</div>
          <div className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={locationLabel}>
            {locationLabel}
          </div>
          {report.gps && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {report.gps.lat.toFixed(4)}, {report.gps.lon.toFixed(4)}
              {geocoding && <span className="ml-1">· locating…</span>}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SectionTitle
            icon={Image}
            action={
              !editingDetails && canAssign ? (
                <button
                  type="button"
                  className="btn btn-secondary flex items-center gap-1.5 text-xs"
                  onClick={() => setEditingDetails(true)}
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  Edit details
                </button>
              ) : undefined
            }
          >
            Details
          </SectionTitle>
          {editingDetails && canAssign ? (
            <DetailsEditForm
              report={report}
              onSave={doPatchDetails}
              onCancel={() => setEditingDetails(false)}
              busy={detailsBusy}
            />
          ) : (
            <div className="surface-quiet p-4 rounded-lg">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {report.comment || 'No additional description was provided for this report.'}
              </p>
              {(report.category || report.estimated_volume || report.landmark) && (
                <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-surface-700/80 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  {report.landmark && <div>Landmark: {report.landmark}</div>}
                  {report.category && <div>Category: {report.category}</div>}
                  {report.estimated_volume && <div>Volume: {report.estimated_volume}</div>}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Photos */}
        {(report.photos||[]).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <SectionTitle icon={Image} action={
              <span className="badge badge-secondary">{report.photos.length}</span>
            }>
              Photos
            </SectionTitle>
            <PhotoGrid photos={report.photos} />
          </motion.div>
        )}

        {/* ML Insights */}
        <MLInsights mlResults={report.ml_results} />

        {/* Comments thread */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <SectionTitle icon={MessageSquare} action={
            <span className="badge badge-secondary">{(report.comments || []).length}</span>
          }>
            Comments
          </SectionTitle>
          <div className="surface-quiet p-4 rounded-lg space-y-4">
            {(report.comments || []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {report.comments.map((c, i) => (
                  <li key={c._id || i} className="flex gap-3">
                    <span className="flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-xs font-semibold">
                      {(c.author || 'A').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{c.author || 'Anonymous'}</span>
                        {c.created_at && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 break-words">{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-end gap-2 pt-1">
              <textarea
                className="input min-h-[40px] flex-1"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                disabled={commentBusy}
              />
              <button
                type="button"
                className="btn btn-primary flex items-center gap-1.5"
                onClick={handleAddComment}
                disabled={commentBusy || !newComment.trim()}
              >
                {commentBusy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                Send
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Assignment Section */}
      {canAssign && (
      <motion.div
        className="surface p-5 border-t border-slate-200 dark:border-surface-700"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <SectionTitle
          icon={Truck}
          action={
            (assignment && !editingAssignment && canReassign) ? (
              <button
                type="button"
                className="btn btn-secondary flex items-center gap-2"
                onClick={() => setEditingAssignment(true)}
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
                Change
              </button>
            ) : undefined
          }
        >
          {assignment ? 'Assigned crew' : 'Assign cleanup team'}
        </SectionTitle>
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {assignment ? 'Current dispatch for this location.' : 'Dispatch the right crew and vehicle for this location.'}
        </div>

        {assignment && !editingAssignment ? (
          <div className="surface-quiet p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <Truck className="w-4 h-4 text-primary-500" aria-hidden="true" />
              {teamName}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Vehicle: {vehicleLabel}
            </div>
            {assignment.scheduled_time && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Scheduled: {new Date(assignment.scheduled_time).toLocaleString()}
              </div>
            )}
            {assignment.note && (
              <div className="text-xs text-slate-500 dark:text-slate-400">Note: {assignment.note}</div>
            )}
          </div>
        ) : (
          <AssignmentForm 
            teams={teams} 
            vehicles={vehicles} 
            onAssign={doAssign}
            reportId={report.report_id}
            assigning={assigning}
            assignment={assignment}
            onCancel={() => setEditingAssignment(false)}
          />
        )}
      </motion.div>
      )}

      {assignment && (
        <DirectionsPanel report={report} onRoute={onRoute} />
      )}
    </motion.div>
  )
}