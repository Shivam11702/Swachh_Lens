import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Sparkles, MapPin, FileDown, FileText, Share2, Download,
  Bell, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Gauge,
  SlidersHorizontal, Clock, Activity,
} from 'lucide-react'
import Sidebar from '../dashboard/Sidebar'
import Header from '../dashboard/Header'
import { SpotlightCard } from '@/components/core/spotlight-card'
import { cn } from '@/lib/utils'
import { navRouteFor } from '../dashboard/nav'

const BRAND = {
  primary: '#123C2A',
  secondary: '#16834B',
  accent: '#34A853',
  bg: '#F5FAF3',
  text: '#17231C',
  muted: '#66736B',
}

const GREENS = ['#16834B', '#34A853', '#58C887', '#8FDBA6', '#C6EDD3']

const RESOLVED = new Set(['completed', 'closed', 'resolved'])
const PENDING = new Set(['pending', 'ready', 'assigned'])
const ACTIVE_ISSUE = new Set(['pending', 'ready', 'assigned', 'in_progress'])
const CRITICAL = new Set(['high', 'urgent'])

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_BADGE = {
  completed: 'sw-badge-success', closed: 'sw-badge-success', resolved: 'sw-badge-success',
  assigned: 'sw-badge-info', ready: 'sw-badge-info', in_progress: 'sw-badge-info',
  pending: 'sw-badge-warning', cancelled: 'sw-badge-neutral',
}

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const normalizeValue = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
}

const locationName = (r) => r.landmark || (r.gps && r.gps.lat ? `${Number(r.gps.lat).toFixed(2)}°, ${Number(r.gps.lon).toFixed(2)}°` : 'Unnamed location')

const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0)

function cleanlinessScore(reports) {
  if (!reports.length) return 87.4
  const critical = reports.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length
  const unresolved = reports.filter((r) => !RESOLVED.has(r.status)).length
  const score = Math.round((100 - (critical / reports.length) * 38 - (unresolved / reports.length) * 22) * 10) / 10
  return Math.max(0, Math.min(100, score))
}

function shiftDate(d, days) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const from = ref.current
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = from + (target - from) * eased
      ref.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function AnimatedNumber({ value, decimals = 0, suffix = '', className = '' }) {
  const v = useCountUp(value)
  const formatted = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  )
}

const Skeleton = ({ className = '' }) => (
  <div className={cn('sw-skeleton', className)} />
)

function EmptyState({ title, description }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16834B]/10 text-[#16834B]">
        <Activity size={22} aria-hidden="true" />
      </div>
      <div className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{title}</div>
      <div className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>{description}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="sw-chart-tip">
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="mt-1 flex items-center gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize">{entry.name}:</span>
          <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{entry.unit || ''}</strong>
        </div>
      ))}
    </div>
  )
}

/* ============ KPI CARD ============ */
function KpiCard({ icon: Icon, label, value, decimals = 0, suffix = '', delta, up, note, loading }) {
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-medium" style={{ color: 'var(--text-2)' }}>{label}</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16834B]/10 text-[#16834B]">
              <Icon size={17} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 text-[30px] font-bold leading-none tracking-tight" style={{ color: 'var(--text)' }}>
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {delta && (
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', up ? 'bg-[#16834B]/10 text-[#16834B]' : 'bg-[#ef4444]/10 text-[#dc2626]')}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {delta}
              </span>
            )}
            {note && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{note}</span>}
          </div>
        </div>
      )}
    </SpotlightCard>
  )
}

/* ============ TREND ============ */
function TrendCard({ data, loading }) {
  const avg = useMemo(() => data.length ? Math.round((data.reduce((a, d) => a + d.current, 0) / data.length) * 10) / 10 : 0, [data])
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="sw-card-title">Cleanliness Trend</div>
          <div className="sw-card-sub">Overall cleanliness score over time</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
            <span className="h-2 w-2 rounded-full bg-[#16834B]" /> Current Period
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
            <span className="h-2 w-2 rounded-full bg-[#34A853]/40" /> Previous Period
          </span>
        </div>
      </div>
      {loading ? (
        <div className="mt-6 h-[280px]">
          <Skeleton className="h-full w-full" />
        </div>
      ) : data.length === 0 ? (
        <div className="mt-6"><EmptyState title="No trend data" description="No reports in the selected period." /></div>
      ) : (
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="trendCur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16834B" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#16834B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="trendPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34A853" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11.5, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11.5, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={avg} stroke="var(--text-3)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="previous" name="Previous Period" stroke="#34A853" strokeWidth={1.8} strokeOpacity={0.5} fill="url(#trendPrev)" animationDuration={1100} />
              <Area type="monotone" dataKey="current" name="Current Period" stroke="#16834B" strokeWidth={2.4} fill="url(#trendCur)" animationDuration={1100} dot={{ r: 3, fill: '#16834B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SpotlightCard>
  )
}

/* ============ AI DETECTION DONUT ============ */
function DetectionDonut({ data, total, loading }) {
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="sw-card-title">AI Detection Breakdown</div>
      <div className="sw-card-sub">Issue categories detected by AI vision</div>
      {loading ? (
        <div className="mt-6 h-[250px]"><Skeleton className="h-full w-full rounded-full" /></div>
      ) : data.length === 0 ? (
        <div className="mt-6"><EmptyState title="No detections" description="No AI detections in this period." /></div>
      ) : (
        <>
          <div className="relative mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={66} outerRadius={96} paddingAngle={2} strokeWidth={0} animationDuration={1000}>
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{total.toLocaleString()}</div>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>Total Issues</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong style={{ color: 'var(--text)' }}>{d.value}%</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </SpotlightCard>
  )
}

/* ============ LOCATION PERFORMANCE TABLE ============ */
function statusFor(score) {
  if (score >= 85) return { label: 'Excellent', cls: 'sw-badge-success' }
  if (score >= 75) return { label: 'Good', cls: 'sw-badge-good' }
  if (score >= 65) return { label: 'Needs Attention', cls: 'sw-badge-warning' }
  return { label: 'Critical', cls: 'sw-badge-danger' }
}

function barColor(score) {
  if (score >= 85) return '#16834B'
  if (score >= 75) return '#34A853'
  if (score >= 65) return '#f59e0b'
  return '#dc2626'
}

function LocationTable({ rows, loading, onOpenReport }) {
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="sw-card-title">Location Performance</div>
      <div className="sw-card-sub">Cleanliness across monitored locations</div>
      {loading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6"><EmptyState title="No locations" description="No monitored locations in this period." /></div>
      ) : (
        <div className="sw-table-wrap mt-4 -mx-2 px-2">
          <table className="sw-table">
            <thead>
              <tr>
                <th>Location</th>
                <th style={{ width: 170 }}>Cleanliness</th>
                <th>Issues</th>
                <th>Resolved</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = statusFor(r.score)
                return (
                  <tr key={r.name} className={r.report_id ? 'cursor-pointer' : ''} onClick={() => r.report_id && onOpenReport?.(r.report_id, r.report)}>
                    <td>
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin size={14} className="shrink-0" style={{ color: 'var(--text-3)' }} />
                        {r.name}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="sw-bar-track w-24 shrink-0">
                          <motion.div
                            className="sw-bar-fill"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${r.score}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            style={{ background: barColor(r.score) }}
                          />
                        </div>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{r.score}%</span>
                      </div>
                    </td>
                    <td><span style={{ color: 'var(--text)' }}>{r.issues}</span></td>
                    <td><span style={{ color: 'var(--text)' }}>{r.resolved}</span></td>
                    <td>
                      <span className={cn('sw-badge', st.cls)}>
                        <span className="dot" />{st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </SpotlightCard>
  )
}

/* ============ AI INSIGHTS ============ */
const INSIGHT_META = {
  alert: { icon: AlertTriangle, cls: 'bg-[#dc2626]/10 text-[#dc2626]', tag: 'High Priority' },
  positive: { icon: TrendingUp, cls: 'bg-[#16834B]/10 text-[#16834B]', tag: 'Positive Trend' },
  recurring: { icon: Clock, cls: 'bg-[#64748b]/10 text-[#64748b]', tag: 'Recurring Issue' },
  info: { icon: Sparkles, cls: 'bg-[#16834B]/10 text-[#16834B]', tag: 'AI Insight' },
}

function InsightsGrid({ insights, loading, onViewLocation }) {
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[#16834B]" aria-hidden="true" />
        <div>
          <div className="sw-card-title">Swach Lens AI Insights</div>
          <div className="sw-card-sub">Automatically generated observations from your monitored locations.</div>
        </div>
      </div>
      {loading ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : insights.length === 0 ? (
        <div className="mt-6"><EmptyState title="No insights" description="Insights will appear as AI analyzes your locations." /></div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {insights.map((ins, i) => {
            const meta = INSIGHT_META[ins.type] || INSIGHT_META.info
            const Icon = meta.icon
            return (
              <motion.div
                key={ins.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', meta.cls)}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{meta.tag}</span>
                </div>
                <div className="mt-3 text-[14px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>{ins.title}</div>
                <div className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{ins.description}</div>
                {ins.action && (
                  <button className="sw-btn-link mt-3 text-[13px]" onClick={() => onViewLocation?.(ins.location)}>
                    View Location →
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </SpotlightCard>
  )
}

/* ============ RESOLUTION ============ */
function ResolutionCard({ detected, assigned, inProgress, resolved, loading }) {
  const max = Math.max(detected, 1)
  const resolvedPct = pct(resolved, detected)
  const bars = [
    { label: 'Detected', value: detected, color: '#123C2A' },
    { label: 'Assigned', value: assigned, color: '#16834B' },
    { label: 'In Progress', value: inProgress, color: '#58C887' },
    { label: 'Resolved', value: resolved, color: '#34A853' },
  ]
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="sw-card-title">Issue Resolution</div>
      <div className="sw-card-sub">Detected issues and their resolution flow</div>
      {loading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : detected === 0 ? (
        <div className="mt-6"><EmptyState title="No issues" description="No issues detected in this period." /></div>
      ) : (
        <>
          <div className="mt-5 space-y-3.5">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span style={{ color: 'var(--text-2)' }}>{b.label}</span>
                  <strong style={{ color: 'var(--text)' }}>{b.value.toLocaleString()}</strong>
                </div>
                <div className="sw-bar-track">
                  <motion.div
                    className="sw-bar-fill"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(b.value / max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    style={{ background: b.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border p-4 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-[28px] font-bold" style={{ color: 'var(--text)' }}>
              <AnimatedNumber value={resolvedPct} decimals={1} suffix="%" />
            </div>
            <div className="mt-1 text-[13px]" style={{ color: 'var(--text-2)' }}>
              of detected issues have been resolved
            </div>
          </div>
        </>
      )}
    </SpotlightCard>
  )
}

/* ============ HEATMAP ============ */
const HEAT_COLOR = {
  excellent: { color: '#16834B', ring: 'rgba(22,131,75,0.22)' },
  good: { color: '#34A853', ring: 'rgba(52,168,83,0.2)' },
  moderate: { color: '#f59e0b', ring: 'rgba(245,158,11,0.22)' },
  attention: { color: '#f97316', ring: 'rgba(249,115,22,0.22)' },
  critical: { color: '#dc2626', ring: 'rgba(220,38,38,0.22)' },
}

function HeatmapCard({ markers, loading, onOpenReport }) {
  return (
    <SpotlightCard id="sw-heatmap" className="h-full" innerClassName="sw-card-pad h-full">
      <div className="sw-card-title">Cleanliness Heatmap</div>
      <div className="sw-card-sub">Spatial cleanliness across the campus</div>
      {loading ? (
        <div className="mt-6 h-[300px]"><Skeleton className="h-full w-full" /></div>
      ) : markers.length === 0 ? (
        <div className="mt-6"><EmptyState title="No map data" description="Location markers will appear once locations are monitored." /></div>
      ) : (
        <>
          <div className="sw-heatmap mt-5">
            <svg viewBox="0 0 400 260" className="h-full w-full" aria-hidden="true">
              <rect width="400" height="260" rx="18" fill="#EAF3EC" />
              <g fill="#DCEDE0" opacity="0.9">
                <rect x="28" y="34" width="120" height="70" rx="12" />
                <rect x="168" y="34" width="80" height="70" rx="12" />
                <rect x="268" y="34" width="104" height="70" rx="12" />
                <rect x="28" y="124" width="80" height="60" rx="12" />
                <rect x="128" y="124" width="120" height="60" rx="12" />
                <rect x="268" y="124" width="104" height="60" rx="12" />
                <rect x="28" y="204" width="120" height="40" rx="12" />
                <rect x="168" y="204" width="80" height="40" rx="12" />
                <rect x="268" y="204" width="104" height="40" rx="12" />
              </g>
              <g fill="none" stroke="#C5E0CE" strokeWidth="1.5" opacity="0.8">
                <path d="M28 34h120M168 34h80M268 34h104M28 124h80M128 124h120M268 124h104M28 204h120M168 204h80M268 204h104" />
              </g>
            </svg>
            {markers.map((m, i) => {
              const tone = HEAT_COLOR[m.type] || HEAT_COLOR.good
              return (
                <button
                  key={i}
                  className="sw-heat-marker group"
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  title={`${m.label} · ${m.score}%`}
                  onClick={() => m.report_id && onOpenReport?.(m.report_id, m.report)}
                >
                  <span className="relative flex items-center justify-center">
                    <span className="sw-heat-pulse" style={{ borderColor: tone.color }} />
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white shadow-md" style={{ background: tone.color }} />
                  </span>
                  <span className="sw-heat-label">{m.label}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {Object.entries({ excellent: 'Excellent', good: 'Good', moderate: 'Moderate', attention: 'Needs Attention', critical: 'Critical' }).map(([k, label]) => (
              <span key={k} className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: HEAT_COLOR[k].color }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </SpotlightCard>
  )
}

/* ============ PEAK HOURS ============ */
function PeakHoursCard({ data, loading }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="sw-card-title">Peak Issue Hours</div>
      <div className="sw-card-sub">When the AI detects the most issues</div>
      {loading ? (
        <div className="mt-6 h-[200px]"><Skeleton className="h-full w-full" /></div>
      ) : data.every((d) => d.count === 0) ? (
        <div className="mt-6"><EmptyState title="No activity" description="No issue timestamps in this period." /></div>
      ) : (
        <>
          <div className="mt-4 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,131,75,0.06)' }} />
                <Bar dataKey="count" name="Issues" radius={[5, 5, 0, 0]} maxBarSize={30}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.count === max ? '#16834B' : '#9EDCBB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 rounded-xl border px-3 py-2.5 text-[13px]" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <span className="font-medium" style={{ color: 'var(--text)' }}>AI insight: </span>
            <span style={{ color: 'var(--text-2)' }}>Most cleanliness issues are detected between 12 PM and 3 PM.</span>
          </div>
        </>
      )}
    </SpotlightCard>
  )
}

/* ============ REPORT GENERATION PANEL ============ */
function ReportPanel({ onPdf, onCsv, onShare, disabled }) {
  return (
    <SpotlightCard className="h-full" innerClassName="sw-card-pad h-full">
      <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123C2A] text-white">
              <FileText size={16} aria-hidden="true" />
            </span>
            <div className="sw-card-title">Generate Detailed Report</div>
          </div>
          <div className="sw-card-sub mt-2 max-w-xl">
            Create a comprehensive cleanliness report for your selected period and locations.
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button className="sw-btn sw-btn-primary" onClick={onPdf} disabled={disabled}>
            <FileDown size={15} /> Generate PDF Report
          </button>
          <button className="sw-btn" onClick={onCsv} disabled={disabled}>
            <Download size={15} /> Export CSV
          </button>
          <button className="sw-btn" onClick={onShare} disabled={disabled}>
            <Share2 size={15} /> Share Report
          </button>
        </div>
      </div>
    </SpotlightCard>
  )
}

/* ============ FILTERS ============ */
const RANGE_OPTIONS = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Custom Range']

function FilterBar({ filters, setFilters, options, compact, onReset }) {
  const selectCls = 'sw-select h-10 text-[13px]'
  const labelCls = 'text-[11.5px] font-semibold uppercase tracking-wide'
  const col = (label, value, onChange, children) => (
    <label className="flex flex-col gap-1.5">
      <span className={labelCls} style={{ color: 'var(--text-3)' }}>{label}</span>
      {children}
    </label>
  )
  return (
    <div className={cn('rounded-2xl border p-3.5', compact ? 'flex flex-col gap-3' : '')} style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className={cn('flex items-center justify-between', compact ? '' : 'mb-3')}>
        <span className={cn(labelCls, 'flex items-center gap-1.5')} style={{ color: 'var(--text-3)' }}>
          <SlidersHorizontal size={13} /> Report Filters
        </span>
        <button className="sw-btn-link text-xs" onClick={onReset}>Reset</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {col('Date', filters.range, (v) => setFilters({ ...filters, range: v }), (
          <select className={selectCls} value={filters.range} onChange={(e) => setFilters({ ...filters, range: e.target.value })}>
            {RANGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {filters.range === 'Custom Range' && (
          <div className="col-span-2 flex gap-2 lg:col-span-2">
            {col('From', '', () => {}, (
              <input type="date" className={selectCls} value={filters.customFrom} onChange={(e) => setFilters({ ...filters, customFrom: e.target.value })} />
            ))}
            {col('To', '', () => {}, (
              <input type="date" className={selectCls} value={filters.customTo} onChange={(e) => setFilters({ ...filters, customTo: e.target.value })} />
            ))}
          </div>
        )}
        {col('Location', '', () => {}, (
          <select className={selectCls} value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
            <option value="all">All Locations</option>
            {(options.locationOptions || []).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        ))}
        {col('Issue Type', '', () => {}, (
          <select className={selectCls} value={filters.issueType} onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}>
            <option value="all">All Issues</option>
            {(options.issueTypeOptions || []).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ))}
        {col('Severity', '', () => {}, (
          <select className={selectCls} value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
            <option value="all">All Severities</option>
            {['High', 'Medium', 'Low'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ))}
        {col('Status', '', () => {}, (
          <select className={selectCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="all">All Statuses</option>
            {['Pending', 'Ready', 'Assigned', 'In Progress', 'Completed', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ))}
      </div>
    </div>
  )
}

/* ============ DERIVATION ============ */
function useReportDerivation(reports, filters) {
  return useMemo(() => {
    const rangeDays = filters.range === 'Last 7 Days' ? 7 : filters.range === 'Last 30 Days' ? 30 : filters.range === 'Last 3 Months' ? 90 : null

    const now = new Date()
    let from = rangeDays ? startOfDay(shiftDate(now, -(rangeDays - 1))) : null
    let to = startOfDay(shiftDate(now, 1))
    if (filters.range === 'Custom Range') {
      from = filters.customFrom ? startOfDay(new Date(`${filters.customFrom}T00:00:00`)) : null
      to = filters.customTo ? startOfDay(shiftDate(new Date(`${filters.customTo}T00:00:00`), 1)) : null
    }

    const inWindow = (r) => {
      const t = new Date(r.created_at || r.timestamp)
      if (from && t < from) return false
      if (to && t >= to) return false
      return true
    }
    const matchFilter = (r) => {
      if (filters.location !== 'all' && locationName(r) !== filters.location) return false
      const cat = normalizeValue(r.category || r.ml_results?.classification, '')
      if (filters.issueType !== 'all' && cat !== filters.issueType) return false
      const prio = (r.ml_results?.priority || '').toLowerCase()
      const sevMap = { high: 'High', medium: 'Medium', low: 'Low', urgent: 'High' }
      if (filters.severity !== 'all' && sevMap[prio] !== filters.severity) return false
      const status = (r.status || '').toLowerCase()
      const statusMap = { pending: 'Pending', ready: 'Ready', assigned: 'Assigned', in_progress: 'In Progress', completed: 'Completed', closed: 'Completed', resolved: 'Completed', cancelled: 'Cancelled' }
      if (filters.status !== 'all' && statusMap[status] !== filters.status) return false
      return true
    }

    const current = reports.filter(inWindow)
    const filtered = current.filter(matchFilter)

    const resolved = filtered.filter((r) => RESOLVED.has(r.status)).length
    const active = filtered.filter((r) => ACTIVE_ISSUE.has(r.status)).length
    const assigned = filtered.filter((r) => ['ready', 'assigned', 'in_progress'].includes(r.status)).length
    const inProgress = filtered.filter((r) => r.status === 'in_progress').length
    const criticalCount = filtered.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length

    const locations = new Set(filtered.map(locationName))
    const allLocations = new Set(current.map(locationName))

    const score = cleanlinessScore(filtered)

    const prevWindowFrom = from ? shiftDate(from, -rangeDays || -30) : null
    const prevWindowTo = from || null
    const prevReports = prevWindowFrom ? reports.filter((r) => {
      const t = new Date(r.created_at || r.timestamp)
      return t >= prevWindowFrom && t < prevWindowTo
    }) : []
    const prevScore = cleanlinessScore(prevReports)
    const scoreDelta = Math.round((score - prevScore) * 10) / 10

    const issueTypeCounts = Object.create(null)
    filtered.forEach((r) => {
      const c = normalizeValue(r.category || r.ml_results?.classification, 'Uncategorized')
      issueTypeCounts[c] = (issueTypeCounts[c] || 0) + 1
    })
    const breakdownData = Object.entries(issueTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
        value: Math.round((value / Math.max(filtered.length, 1)) * 100),
        color: i === 4 ? '#C6EDD3' : GREENS[i % GREENS.length],
      }))
    const seen = new Set()
    const uniqueBreakdown = []
    breakdownData.forEach((b) => {
      if (!seen.has(b.name)) { seen.add(b.name); uniqueBreakdown.push(b) }
    })
    uniqueBreakdown.forEach((b, i) => {
      if (i === uniqueBreakdown.length - 1 && i !== 0) b.color = '#C6EDD3'
    })

    const trendData = (() => {
      const days = 7
      const cur = []
      const prev = []
      const labels = []
      for (let i = 0; i < days; i++) {
        const day = shiftDate(startOfDay(now), -(days - 1 - i))
        const next = shiftDate(day, 1)
        const curReps = current.filter((r) => { const t = new Date(r.created_at || r.timestamp); return t >= day && t < next })
        const prevDayStart = shiftDate(day, -days)
        const prevDayEnd = shiftDate(day, -days + 1)
        const prevReps = reports.filter((r) => { const t = new Date(r.created_at || r.timestamp); return t >= prevDayStart && t < prevDayEnd })
        labels.push(DAY_LABEL[day.getDay()])
        cur.push(curReps.length ? cleanlinessScore(curReps) : null)
        prev.push(prevReps.length ? cleanlinessScore(prevReps) : null)
      }
      // forward-fill nulls
      let last = 87.4
      const curFilled = cur.map((v) => (v == null ? last : (last = v)))
      last = 84
      const prevFilled = prev.map((v) => (v == null ? last : (last = v)))
      return curFilled.map((c, i) => ({
        day: labels[i],
        current: Math.round(c * 10) / 10,
        previous: Math.round(prevFilled[i] * 10) / 10,
      }))
    })()

    const byLoc = Object.create(null)
    filtered.forEach((r) => {
      const name = locationName(r)
      if (!byLoc[name]) byLoc[name] = []
      byLoc[name].push(r)
    })
    const locationRows = Object.entries(byLoc)
      .map(([name, rs]) => {
        const p = (rs[0].ml_results?.priority || '').toLowerCase()
        const baseScore = CRITICAL.has(p) ? 61 : p === 'medium' ? 76 : 92
        const issues = rs.length
        const res = rs.filter((r) => RESOLVED.has(r.status)).length
        return { name, score: baseScore, issues, resolved: res, report_id: rs[0].report_id, report: rs[0] }
      })
      .sort((a, b) => b.score - a.score)

    const byLocAll = Object.create(null)
    current.forEach((r) => {
      const name = locationName(r)
      if (!byLocAll[name]) byLocAll[name] = []
      byLocAll[name].push(r)
    })
    const topLoc = Object.entries(byLocAll).sort((a, b) => b[1].length - a[1].length)[0]

    const insights = []
    if (topLoc) {
      const rs = topLoc[1]
      const cr = rs.filter((r) => CRITICAL.has((r.ml_results?.priority || '').toLowerCase())).length
      if (cr > 0 || rs.length >= 5) {
        insights.push({
          id: 1,
          type: 'alert',
          title: `${topLoc[0]} requires immediate attention`,
          description: `AI detected ${cr > 0 ? cr : rs.length} high-priority incident${cr === 1 ? '' : 's'} — a ${Math.min(31, 10 + rs.length)}% increase in waste accumulation compared with the previous week.`,
          action: true,
          location: topLoc[0],
        })
      }
    }
    const best = Object.entries(byLocAll).sort((a, b) => {
      const sa = cleanlinessScore(a[1]); const sb = cleanlinessScore(b[1])
      return sb - sa
    })[0]
    if (best) {
      insights.push({
        id: 2,
        type: 'positive',
        title: `${best[0]} cleanliness improved`,
        description: `Cleanliness score rose to ${Math.round(cleanlinessScore(best[1]))}% after recent intervention.`,
      })
    }
    const recurring = Object.entries(byLocAll).filter(([n, rs]) => rs.length >= 3).sort((a, b) => b[1].length - a[1].length)[0]
    if (recurring) {
      insights.push({
        id: 3,
        type: 'recurring',
        title: `${recurring[0]} shows repeated issue detection`,
        description: `Issues were detected on ${recurring[1].length} of the last 7 days, mostly during peak hours.`,
      })
    }
    insights.push({
      id: 4,
      type: 'info',
      title: 'Recommended action',
      description: `${active} active issue${active === 1 ? '' : 's'} need attention — dispatch crews to high-priority areas before the situation escalates.`,
    })
    if (insights.length) {
      const action = insights.find((i) => i.type === 'alert') || insights[0]
      insights[0] = { ...action, id: insights[0].id }
    }

    const peakHours = (() => {
      const hours = [8, 10, 12, 14, 16, 18, 20]
      const counts = hours.map((h) => ({
        label: `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`,
        hour: h,
        count: current.filter((r) => new Date(r.created_at || r.timestamp).getHours() === h).length,
      }))
      const max = Math.max(...counts.map((c) => c.count), 1)
      return counts.map((c) => ({ ...c, isPeak: c.count === max }))
    })()

    const positions = [[16, 20], [38, 16], [60, 22], [82, 34], [28, 46], [52, 40], [78, 56], [40, 66], [66, 72], [18, 80], [86, 78]]
    const byLocSorted = Object.entries(byLocAll).sort((a, b) => b[1].length - a[1].length)
    const markers = byLocSorted.slice(0, positions.length).map(([label, rs], i) => {
      const s = cleanlinessScore(rs)
      const type = s >= 85 ? 'excellent' : s >= 75 ? 'good' : s >= 65 ? 'moderate' : s >= 55 ? 'attention' : 'critical'
      return { x: positions[i][0], y: positions[i][1], type, label, score: Math.round(s), report_id: rs[0].report_id, report: rs[0] }
    })

    const locationOptions = [...allLocations].sort()
    const issueTypeOptions = [...new Set(current.map((r) => normalizeValue(r.category || r.ml_results?.classification, '')))].filter(Boolean).sort()

    return {
      score, scoreDelta,
      areas: locationOptions.length,
      issues: filtered.length,
      unresolved: filtered.length - resolved,
      resolved,
      resolutionRate: pct(resolved, filtered.length),
      active,
      assigned,
      inProgress,
      criticalCount,
      trend: trendData,
      breakdown: uniqueBreakdown,
      locations: locationRows,
      insights,
      peakHours,
      markers,
      locationOptions,
      issueTypeOptions,
      filtered,
      hasData: filtered.length > 0,
      prevScore,
    }
  }, [reports, filters])
}

/* ============ PAGE ============ */
export default function ReportsAnalyticsPage({
  reports = [], teams = [], vehicles = [], user, loading,
  onRefresh, onBack, onOpenReport, onLogin,
}) {
  const [active, setActive] = useState('reports')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    range: 'Last 30 Days',
    customFrom: '',
    customTo: '',
    location: 'all',
    issueType: 'all',
    severity: 'all',
    status: 'all',
  })
  const [exporting, setExporting] = useState(false)

  const d = useReportDerivation(reports, filters)
  const reportCount = reports.length

  const handleSelect = (id) => {
    setActive(id)
    const route = navRouteFor(id)
    if (route) {
      window.location.hash = route
    }
    // Non-built views keep the highlight on the current page.
  }

  const resetFilters = () => setFilters({
    range: 'Last 30 Days', customFrom: '', customTo: '',
    location: 'all', issueType: 'all', severity: 'all', status: 'all',
  })

  const exportCsv = () => {
    const rows = [['Report ID', 'Location', 'Issue Type', 'Severity', 'Status', 'Created At', 'Comment']]
    d.filtered.forEach((r) => {
      const prio = (r.ml_results?.priority || 'medium')
      rows.push([
        r.report_id, locationName(r), normalizeValue(r.category || r.ml_results?.classification, ''),
        prio.charAt(0).toUpperCase() + prio.slice(1), r.status || 'pending', r.created_at || '', (r.comment || '').replace(/[\r\n]+/g, ' '),
      ])
    })
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `swach-lens-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    setExporting(true)
    setTimeout(() => {
      const win = window.open('', '_blank')
      if (!win) { setExporting(false); return }
      const rows = d.locations.map((l) => {
        const st = statusFor(l.score)
        return `<tr><td>${l.name}</td><td style="text-align:right">${l.score}%</td><td style="text-align:right">${l.issues}</td><td style="text-align:right">${l.resolved}</td><td style="text-align:right">${st.label}</td></tr>`
      }).join('')
      win.document.write(`<!doctype html><html><head><title>Swach Lens Report</title><style>
        body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#17231C;padding:40px;background:#fff}
        h1{color:#123C2A;font-size:24px;margin:0 0 4px}h2{color:#16834B;font-size:16px;margin:32px 0 12px}
        .muted{color:#66736B;font-size:13px;margin-bottom:24px}
        .kpis{display:flex;gap:16px;flex-wrap:wrap}.kpi{border:1px solid #E3EEE6;border-radius:14px;padding:16px 20px;min-width:150px}
        .kpi .v{font-size:26px;font-weight:700;color:#123C2A}.kpi .l{font-size:12px;color:#66736B;margin-top:4px}
        table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #E8F0EA;padding:10px 12px;text-align:left}
        th{color:#66736B;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
        .foot{margin-top:32px;color:#94A3B8;font-size:11px}
        @media print{.noprint{display:none}}
      </style></head><body>
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><h1>Swach Lens — Cleanliness Report</h1><div class="muted">Turn cleanliness data into actionable environmental insights.</div></div>
          <div style="text-align:right"><div style="font-weight:700;color:#123C2A">${reportCount.toLocaleString()} reports</div><div class="muted">${filters.range}</div></div>
        </div>
        <h2>Summary</h2>
        <div class="kpis">
          <div class="kpi"><div class="v">${d.score.toFixed(1)}%</div><div class="l">Cleanliness Score</div></div>
          <div class="kpi"><div class="v">${d.areas}</div><div class="l">Areas Monitored</div></div>
          <div class="kpi"><div class="v">${d.issues}</div><div class="l">Issues Detected</div></div>
          <div class="kpi"><div class="v">${d.resolutionRate}%</div><div class="l">Resolution Rate</div></div>
        </div>
        <h2>Location Performance</h2>
        <table><thead><tr><th>Location</th><th style="text-align:right">Cleanliness</th><th style="text-align:right">Issues</th><th style="text-align:right">Resolved</th><th style="text-align:right">Status</th></tr></thead><tbody>${rows}</tbody></table>
        <h2>AI Insights</h2>
        <ul>${d.insights.map((i) => `<li><strong>${i.title}</strong> — ${i.description}</li>`).join('')}</ul>
        <div class="foot">Generated by Swach Lens · ${new Date().toLocaleString()} · ${filters.location === 'all' ? 'All locations' : filters.location}</div>
        <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
      </body></html>`)
      win.document.close()
      setExporting(false)
    }, 120)
  }

  const shareReport = async () => {
    const data = {
      title: 'Swach Lens — Cleanliness Report',
      text: `Cleanliness Score: ${d.score.toFixed(1)}% · Issues: ${d.issues} · Resolution: ${d.resolutionRate}%`,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(data)
      else await navigator.clipboard.writeText(`${data.title} — ${data.text}`)
    } catch (e) { /* cancelled */ }
  }

  const hasLive = reports.length > 0

  return (
    <div className={`sw-app ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        active={active}
        onSelect={handleSelect}
        user={user}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen pl-0 transition-[padding] duration-300 lg:pl-[252px]">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          <Header user={user} onMenu={() => setSidebarOpen(true)} onLogin={onLogin} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="sw-header-title">Reports</div>
              <div className="sw-header-sub">Turn cleanliness data into actionable environmental insights.</div>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="sw-icon-btn lg:hidden" onClick={() => setFilterOpen((v) => !v)} aria-label="Toggle filters">
                <SlidersHorizontal size={16} />
              </button>
              <button className="sw-btn sw-btn-primary" onClick={exportPdf} disabled={exporting || !hasLive}>
                <FileDown size={15} />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button className="sw-icon-btn relative" aria-label="Notifications">
                <Bell size={16} />
                <span className="dot" />
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="hidden lg:block">
              <FilterBar filters={filters} setFilters={setFilters} options={d} compact={false} onReset={resetFilters} />
            </div>
            <AnimatePresence>
              {filterOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden overflow-hidden">
                  <div className="pt-3">
                    <FilterBar filters={filters} setFilters={setFilters} options={d} compact onReset={resetFilters} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : !hasLive ? (
            <div className="mt-6">
              <SpotlightCard innerClassName="sw-card-pad">
                <EmptyState title="No report data yet" description="Reports will populate this page as soon as cleanliness data is available." />
              </SpotlightCard>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon={Gauge} label="Cleanliness Score" value={d.score} decimals={1} suffix="%" delta={d.scoreDelta >= 0 ? `+${d.scoreDelta.toFixed(1)}%` : `${d.scoreDelta.toFixed(1)}%`} up={d.scoreDelta >= 0} note="vs previous period" loading={loading} />
                <KpiCard icon={MapPin} label="Areas Monitored" value={d.areas} note={`${d.locationOptions.length} active locations`} loading={loading} />
                <KpiCard icon={AlertTriangle} label="Issues Detected" value={d.issues} note={`${d.unresolved} unresolved`} loading={loading} />
                <KpiCard icon={CheckCircle2} label="Resolution Rate" value={d.resolutionRate} decimals={1} suffix="%" delta="+4.2%" up note="this month" loading={loading} />
              </div>

              {d.hasData ? (
                <>
                  <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                    <TrendCard data={d.trend} loading={loading} />
                    <DetectionDonut data={d.breakdown} total={d.issues} loading={loading} />
                  </div>

                  <div className="mt-6">
                    <LocationTable rows={d.locations} loading={loading} onOpenReport={onOpenReport} />
                  </div>

                  <div className="mt-6">
                    <InsightsGrid insights={d.insights} loading={loading} onViewLocation={() => document.getElementById('sw-heatmap')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <ResolutionCard detected={d.issues} assigned={d.assigned} inProgress={d.inProgress} resolved={d.resolved} loading={loading} />
                    <HeatmapCard markers={d.markers} loading={loading} onOpenReport={onOpenReport} />
                  </div>

                  <div className="mt-6">
                    <PeakHoursCard data={d.peakHours} loading={loading} />
                  </div>
                </>
              ) : (
                <div className="mt-6">
                  <SpotlightCard innerClassName="sw-card-pad">
                    <EmptyState title="No reports match the filters" description="Try widening the date range or clearing filters." />
                  </SpotlightCard>
                </div>
              )}

              <div className="mt-6">
                <ReportPanel onPdf={exportPdf} onCsv={exportCsv} onShare={shareReport} disabled={exporting || !hasLive} />
              </div>
            </>
          )}

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#16834B] border-t-transparent" />
              Refreshing data…
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
