import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, MapPin, AlertTriangle, Image, Package, ChevronLeft, ChevronRight, Camera } from 'lucide-react'

const normalizeValue = (value, fallback = 'medium') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
}

const getPriorityBadge = (priority) => {
  const normalized = normalizeValue(priority, 'medium').toLowerCase()
  if (normalized === 'high') return 'priority-high'
  if (normalized === 'medium') return 'priority-medium'
  if (normalized === 'low') return 'priority-low'
  if (normalized === 'urgent') return 'priority-high'
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
  if (normalized === 'high' || normalized === 'urgent') return <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
  if (normalized === 'medium') return <Package className="w-3.5 h-3.5" aria-hidden="true" />
  if (normalized === 'low') return <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
  return <Package className="w-3.5 h-3.5" aria-hidden="true" />
}

const ReportSkeleton = React.forwardRef((props, ref) => (
  <motion.li
    ref={ref}
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
    className="surface-interactive rounded-[28px] p-5 animate-pulse"
    role="option"
    aria-disabled="true"
  >
    <div className="flex gap-4">
      <div className="skeleton-avatar h-20 w-20 rounded-2xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton-title w-28" />
          <div className="skeleton h-6 rounded-full w-20" />
        </div>
        <div className="skeleton-text w-11/12" />
        <div className="skeleton-text w-8/12" />
        <div className="flex items-center gap-2">
          <div className="skeleton h-7 rounded-full w-24" />
          <div className="skeleton h-7 rounded-full w-20" />
        </div>
      </div>
    </div>
  </motion.li>
))

const EmptyState = React.forwardRef((props, ref) => (
  <motion.li
    ref={ref}
    layout
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="surface rounded-[28px] p-8 text-center animate-in"
  >
    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-4">
      <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
    </div>
    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">No reports yet</div>
    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fresh uploads will appear here.</div>
  </motion.li>
))

function ReportThumbnail({ report }) {
  const [hasError, setHasError] = React.useState(false)
  const previewUrl = report.photos?.[0]?.thumbnail_url || report.photos?.[0]?.url || null

  if (previewUrl && !hasError) {
    return (
      <img
        src={previewUrl}
        alt={`Photo for ${report.report_id || 'report'}`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-white text-slate-500 dark:from-surface-700 dark:via-surface-800 dark:to-surface-900 dark:text-slate-300">
      <div className="flex flex-col items-center gap-1">
        <Camera className="h-5 w-5" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">No preview</span>
      </div>
    </div>
  )
}

const ReportCard = React.forwardRef(({ report, isSelected, onSelect, onKeyDown }, ref) => {
  const priority = normalizeValue(report.ml_results?.priority, 'medium')
  const status = normalizeValue(report.status, 'pending')
  const classification = normalizeValue(report.ml_results?.classification, 'Unknown')
  const volume = normalizeValue(report.ml_results?.volume_bin, 'Unknown')
  const photoCount = report.photos?.length || 0

  return (
    <motion.li
      ref={ref}
      layout
      key={report.report_id}
      onClick={() => onSelect(report)}
      onKeyDown={onKeyDown}
      className={`group surface-interactive rounded-2xl p-5 relative overflow-hidden border border-white/10 ${
        isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50/40 dark:bg-primary-900/10' : ''
      }`}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      role="option"
      tabIndex={0}
      aria-selected={isSelected}
    >
      {isSelected && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          className="absolute top-0 left-0 h-1 bg-primary-500"
        />
      )}

       <div className="relative flex items-start gap-4">
         <div className="relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-inner dark:bg-surface-800">
           <ReportThumbnail report={report} />
           {photoCount > 1 && (
             <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
               +{photoCount - 1}
             </span>
           )}
         </div>

         <div className="flex-1 min-w-0 space-y-2.5">
           <div className="flex flex-wrap items-start justify-between gap-2">
             <div className="min-w-0">
               <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                 {report.display_id || report.report_id || 'Unassigned'}
               </div>
               <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                 {classification !== 'Unknown' ? classification : 'Uncategorized'}
                 {volume !== 'Unknown' ? ` · ${volume}` : ''}
               </div>
             </div>
             <span className={`badge ${getPriorityBadge(report.ml_results?.priority)} flex-shrink-0`}>
               {getPriorityIcon(report.ml_results?.priority)}
               {priority.toUpperCase()}
             </span>
           </div>

           <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 line-clamp-2">
             {report.comment || 'No description provided'}
           </p>

           <div className="flex flex-wrap items-center gap-2">
             <span className={`status-pill ${getStatusBadge(report.status)} flex items-center gap-1.5 px-3 py-1.5`}>
               <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
               {status}
             </span>
             <span className="text-xs text-slate-400 dark:text-slate-500">
               {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
             </span>
           </div>
         </div>
       </div>
    </motion.li>
  )
})

export default function ReportList({
  reports = [],
  selectedReportId,
  onSelect,
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  loading = false,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" aria-hidden="true" />
            Reports
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{total} active items / {reports.length} loaded</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Page {page}/{totalPages}</div>
          <div className="hidden h-6 w-px bg-slate-200 dark:bg-surface-700 sm:block" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul className="space-y-3" aria-live="polite" role="listbox">
        <AnimatePresence mode="popLayout">
          {loading && Array.from({ length: 4 }).map((_, index) => (
            <ReportSkeleton key={index} />
          ))}

          {!loading && reports.length === 0 && <EmptyState />}

          {!loading && reports.map((report, index) => (
            <ReportCard
              key={report.report_id || report._id || index}
              report={report}
              isSelected={selectedReportId === report.report_id}
              onSelect={onSelect}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(report)
                }
              }}
              style={{ animationDelay: `${index * 50}ms` }}
            />
          ))}
        </AnimatePresence>
      </ul>

      {!loading && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-surface-700 dark:text-slate-400">
          <div>Showing {reports.length} of {total}</div>
        </div>
      )}
    </div>
  )
}
