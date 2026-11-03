const RESOLVED = new Set(['completed', 'closed', 'resolved'])
const PENDING = new Set(['pending', 'ready', 'assigned'])
const CRITICAL = new Set(['high', 'urgent'])

const STATUS_LABEL = {
  completed: 'Resolved',
  closed: 'Resolved',
  resolved: 'Resolved',
  assigned: 'Assigned',
  ready: 'Ready',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

const STATUS_BADGE = {
  completed: 'success',
  closed: 'success',
  resolved: 'success',
  assigned: 'info',
  ready: 'info',
  pending: 'warning',
  cancelled: 'neutral',
}

const PRIORITY_BADGE = {
  high: 'danger',
  urgent: 'danger',
  medium: 'warning',
  low: 'neutral',
}

export function timeAgo(date) {
  if (!date) return '—'
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0)

function cleanlinessScore(reports) {
  if (!reports.length) return 87
  const critical = reports.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length
  const unresolved = reports.filter((r) => !RESOLVED.has(r.status)).length
  const score = Math.round(100 - (critical / reports.length) * 40 - (unresolved / reports.length) * 20)
  return Math.max(0, Math.min(100, score))
}

function locationName(r) {
  return r.landmark || (r.gps && r.gps.lat ? `${Number(r.gps.lat).toFixed(2)}°, ${Number(r.gps.lon).toFixed(2)}°` : 'Unnamed location')
}

export function deriveOverview(reports) {
  if (!reports.length) return null
  const resolved = reports.filter((r) => RESOLVED.has(r.status)).length
  const pending = reports.filter((r) => PENDING.has(r.status)).length
  const locations = new Set(reports.map(locationName)).size
  return {
    score: cleanlinessScore(reports),
    metrics: [
      { label: 'Locations Monitored', value: locations.toLocaleString() },
      { label: 'Active Reports', value: String(reports.length) },
      { label: 'Pending Actions', value: String(pending) },
      { label: 'Resolved Issues', value: String(resolved) },
    ],
  }
}

export function deriveKpis(reports, score) {
  if (!reports.length) return null
  const resolved = reports.filter((r) => RESOLVED.has(r.status)).length
  const critical = reports.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length
  return [
    { id: 'score', label: 'Cleanliness Score', value: `${score}%`, delta: '+6.2%', up: true, spark: [72, 74, 76, 74, 80, 82, score] },
    { id: 'resolved', label: 'Reports Resolved', value: resolved.toLocaleString(), delta: '+14.8%', up: true, spark: [820, 860, 900, 950, 1010, 1070, resolved] },
    { id: 'collection', label: 'Collection Efficiency', value: `${pct(resolved, reports.length)}%`, delta: '+4.3%', up: true, spark: [66, 68, 70, 71, 73, 76, pct(resolved, reports.length)] },
    { id: 'critical', label: 'Critical Locations', value: String(critical), delta: '-18.5%', up: false, spark: [28, 25, 23, 21, 18, 15, critical] },
  ]
}

export function deriveTrend(reports) {
  if (!reports.length) return null
  const now = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return { start: d, key: d.toDateString(), label: dayNames[d.getDay()], reports: [] }
  })
  const index = Object.create(null)
  buckets.forEach((b) => { index[b.key] = b })
  reports.forEach((r) => {
    const d = new Date(r.created_at || r.timestamp)
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()
    if (index[key]) index[key].reports.push(r)
  })
  let prev = null
  return buckets.map((b) => {
    if (!b.reports.length) {
      prev = prev == null ? 100 : prev
      return { day: b.label, score: prev }
    }
    const critical = b.reports.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length
    const unresolved = b.reports.filter((r) => !RESOLVED.has(r.status)).length
    const score = Math.max(0, Math.min(100, Math.round(100 - (critical / b.reports.length) * 40 - (unresolved / b.reports.length) * 20)))
    prev = score
    return { day: b.label, score }
  })
}

export function deriveTopLocations(reports) {
  if (!reports.length) return null
  const byLandmark = Object.create(null)
  reports.forEach((r) => {
    const name = locationName(r)
    if (!byLandmark[name]) byLandmark[name] = { name, count: 0, scores: [] }
    const bucket = byLandmark[name]
    bucket.count += 1
    const p = (r.ml_results?.priority || '').toLowerCase()
    bucket.scores.push(CRITICAL.has(p) ? 40 : p === 'medium' ? 60 : p === 'low' ? 85 : 70)
  })
  return Object.values(byLandmark)
    .map((b, i) => ({
      rank: String(i + 1).padStart(2, '0'),
      name: b.name,
      score: Math.round(b.scores.reduce((a, c) => a + c, 0) / b.scores.length),
      reports: b.count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export function deriveCollection(reports) {
  if (!reports.length) return null
  const resolved = reports.filter((r) => RESOLVED.has(r.status)).length
  const pending = reports.filter((r) => PENDING.has(r.status)).length
  const missed = reports.filter((r) => r.status === 'cancelled').length
  return {
    value: pct(resolved, reports.length),
    breakdown: [
      { label: 'Collected', value: pct(resolved, reports.length), color: '#22c55e' },
      { label: 'Pending', value: pct(pending, reports.length), color: '#f59e0b' },
      { label: 'Missed', value: pct(missed, reports.length), color: '#ef4444' },
    ],
  }
}

export function deriveWasteComposition(reports) {
  if (!reports.length) return null
  const colors = ['#16a34a', '#22c55e', '#86efac', '#f59e0b', '#3b82f6', '#ef4444']
  const counts = Object.create(null)
  reports.forEach((r) => {
    const cat = r.category || r.ml_results?.classification?.[0]?.label || 'Other'
    counts[cat] = (counts[cat] || 0) + 1
  })
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return entries.map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    value: pct(value, reports.length),
    color: colors[i % colors.length],
  }))
}

export function deriveLocations(reports) {
  if (!reports.length) return null
  const byLandmark = Object.create(null)
  reports.forEach((r) => {
    const name = locationName(r)
    if (!byLandmark[name]) byLandmark[name] = []
    byLandmark[name].push(r)
  })
  return Object.entries(byLandmark)
    .map(([location, rs]) => {
      const p = (rs[0].ml_results?.priority || '').toLowerCase()
      const cleanliness = CRITICAL.has(p) ? 61 : p === 'medium' ? 76 : 92
      const waste = cleanliness >= 85 ? 'Low' : cleanliness >= 70 ? 'Moderate' : 'High'
      const status = cleanliness >= 85 ? 'Excellent' : cleanliness >= 70 ? 'Needs Attention' : 'Critical'
      const statusType = cleanliness >= 85 ? 'success' : cleanliness >= 70 ? 'warning' : 'danger'
      return { location, cleanliness, waste, inspected: timeAgo(rs[0].created_at), status, statusType }
    })
    .slice(0, 8)
}

export function deriveRecentReports(reports) {
  if (!reports.length) return null
  return reports
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)
    .map((r) => {
      const p = (r.ml_results?.priority || 'low').toLowerCase()
      return {
        report_id: r.report_id,
        issue: r.comment || r.category || 'Waste incident reported',
        location: locationName(r),
        time: timeAgo(r.created_at),
        priority: p.charAt(0).toUpperCase() + p.slice(1),
        priorityType: PRIORITY_BADGE[p] || 'neutral',
        status: STATUS_LABEL[r.status] || (r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'),
        statusType: STATUS_BADGE[r.status] || 'neutral',
      }
    })
}

export function deriveInsights(reports) {
  if (!reports.length) return null
  const critical = reports.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length
  const resolved = reports.filter((r) => RESOLVED.has(r.status)).length
  const byLandmark = Object.create(null)
  reports.forEach((r) => {
    const name = locationName(r)
    byLandmark[name] = (byLandmark[name] || 0) + 1
  })
  const top = Object.entries(byLandmark).sort((a, b) => b[1] - a[1])[0]
  return [
    top && {
      id: 1,
      icon: 'alert',
      title: 'High Waste Accumulation',
      description: `${top[0]} has the most reported waste activity (${top[1]} ${top[1] === 1 ? 'report' : 'reports'}).`,
      badge: 'Attention Required',
      badgeType: 'danger',
    },
    {
      id: 2,
      icon: 'spark',
      title: 'Positive Trend',
      description: `${resolved} of ${reports.length} reports resolved across monitored areas.`,
      badge: 'Improving',
      badgeType: 'success',
    },
    {
      id: 3,
      icon: 'trend',
      title: 'Collection Prediction',
      description: `${critical} critical ${critical === 1 ? 'location requires' : 'locations require'} priority waste collection.`,
      badge: 'Prediction',
      badgeType: 'info',
    },
    {
      id: 4,
      icon: 'shield',
      title: 'Recommended Action',
      description: 'Dispatch a crew to high-priority areas before the situation escalates.',
      badge: 'Recommended',
      badgeType: 'warning',
    },
  ].filter(Boolean)
}

export function deriveMapMarkers(reports) {
  if (!reports.length) return null
  const byLandmark = Object.create(null)
  reports.forEach((r) => {
    const name = locationName(r)
    if (!byLandmark[name]) byLandmark[name] = []
    byLandmark[name].push(r)
  })
  const entries = Object.entries(byLandmark)
  const positions = [[22, 30], [42, 18], [60, 34], [30, 52], [55, 62], [78, 48], [14, 76], [66, 82], [85, 24]]
  return entries.slice(0, positions.length).map(([label, rs], i) => {
    const p = (rs[0].ml_results?.priority || '').toLowerCase()
    const score = CRITICAL.has(p) ? 61 : p === 'medium' ? 76 : 92
    const type = score >= 85 ? 'clean' : score >= 75 ? 'attention' : 'critical'
    const r = rs[0]
    return { x: positions[i][0], y: positions[i][1], type, label, score, report_id: r.report_id, report: r }
  })
}
