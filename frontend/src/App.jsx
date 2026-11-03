import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import AnalyticsPage from './components/AnalyticsPage'
import ReportPage from './components/ReportPage'
import ReportsAnalyticsPage from './components/ReportsAnalyticsPage'
import PlaceholderPage from './components/PlaceholderPage'
import { navRouteFor } from './dashboard/nav'
import { OnboardingOverlay } from './components/OnboardingOverlay'
import { useSound, useHaptic } from './hooks/useInteractions'
import { fetchReports, fetchReport, fetchTeams, fetchVehicles, login as apiLogin, getMe, getToken, setAuthToken } from './api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Moon, Sun, Search, Filter, 
  RefreshCw, Settings, HelpCircle, Upload as UploadIcon,
  FileText, AlertTriangle, Users, CheckCircle2, TrendingUp,
  BarChart3, Map as MapIcon, Sparkles, Volume2, VolumeX, LayoutDashboard,
  LogIn, LogOut, User
} from 'lucide-react'
import LoginModal from './components/LoginModal'
import LoginPage from './components/LoginPage'
import { TextRoll } from './components/core/text-roll.jsx'
import { InView } from './components/core/in-view.jsx'
import Dashboard from './dashboard/Dashboard'
import CitizenDashboard from './dashboard/CitizenDashboard'

const PLACEHOLDER_PAGE_ID_BY_ROUTE = {
  '/overview': 'overview',
  '/cleanliness': 'cleanliness',
  '/waste': 'waste',
  '/complaints': 'complaints',
  '/locations': 'locations',
  '/inspections': 'inspections',
  '/notifications': 'notifications',
  '/settings': 'settings',
  '/help': 'help',
}

const Splash = () => {
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCompleted(true)
      localStorage.setItem('swachhlens_intro_shown', 'true')
      window.location.hash = '/'
    }, 3000)
    return () => clearTimeout(timeout)
  }, [])

  if (completed) return null

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-white dark:bg-gray-900'>
      <InView
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        viewOptions={{ margin: '0px 0px -200px 0px' }}
      >
        <div className='text-center'>
          <TextRoll
            className='text-8xl font-extrabold tracking-wider text-primary'
            duration={0.5}
            getEnterDelay={(i) => i * 0.04}
          >
            Swach Lens
          </TextRoll>
          <div className='mt-8 text-xl text-slate-600 dark:text-slate-400'>
            Operator Authentication System
          </div>
        </div>
      </InView>
    </div>
  )
}

const normalizeValue = (value, fallback='medium') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
}

const Header = ({ title, subtitle, actions, stats, onRefresh, loading, user }) => (
  <header className="surface-glass sticky top-0 z-sticky mx-4 mt-4 rounded-2xl p-6 animate-in">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {title}
            {stats && stats.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full">
                {stats.reduce((a, b) => a + b.value, 0)} total
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">{subtitle}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-white/10 border border-white/50 dark:border-white/15">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-xs font-semibold">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[140px] truncate">
              {user.name || user.email}
            </span>
          </div>
        )}
        {actions && actions.map((action, i) => (
          <button
            key={i}
            className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
          >
            {action.icon && <action.icon className="w-4 h-4" aria-hidden="true" />}
            {action.label}
          </button>
        ))}
        <button
          className="btn btn-ghost p-2"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
)

const FilterBar = ({ 
  search, onSearchChange, 
  statusFilter, onStatusChange,
  priorityFilter, onPriorityChange,
  onReset,
  hasFilters
}) => (
  <motion.div
    className="surface p-4 rounded-xl animate-in"
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
  >
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 w-full">
        <div className="input-with-icon relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input 
            placeholder="Search reports..." 
            value={search} 
            onChange={e => onSearchChange(e.target.value)}
            className="input pl-10" 
            aria-label="Search reports" 
          />
        </div>
        <select value={statusFilter} onChange={e => onStatusChange(e.target.value)} className="select w-full">
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
          <option value="assigned">Assigned</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={e => onPriorityChange(e.target.value)} className="select w-full">
          <option value="">All priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      {hasFilters && (
        <button 
          className="btn btn-ghost text-sm flex items-center gap-1"
          onClick={onReset}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  </motion.div>
)

const Sidebar = ({ 
  children, 
  title, 
  subtitle, 
  filters, 
  showUpload, 
  uploadContent,
  className = '' 
}) => (
  <aside className={`overflow-y-auto overscroll-contain max-h-[60vh] lg:max-h-[calc(100vh-8rem)] ${className}`}>
    <div className="surface p-5 animate-in stagger-1">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      {filters && <FilterBar {...filters} />}

      {showUpload && uploadContent}

      {children}
    </div>
  </aside>
)

const Toast = React.forwardRef(({ message, type = 'info', onClose }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, x: 300, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 300, scale: 0.9 }}
    className={`fixed bottom-4 right-4 z-toast p-4 rounded-xl shadow-lg border flex items-center gap-3 min-w-[300px] max-w-md ${
      type === 'success' ? 'toast-success' :
      type === 'error' ? 'toast-error' :
      'toast-info'
    }`}
    role="alert"
  >
    <div className="flex-1 text-sm">{message}</div>
    <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
      <X className="w-4 h-4" aria-hidden="true" />
    </button>
  </motion.div>
))

const Toaster = ({ toasts, onDismiss }) => (
  <AnimatePresence>
    {toasts.map((toast, i) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onDismiss(toast.id)}
      />
    ))}
  </AnimatePresence>
)

export default function App(){
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [mapRoute, setMapRoute] = useState(null)
  const mapAreaRef = useRef(null)
  const [mapSize, setMapSize] = useState({ w: 200, h: 200 })
  useEffect(() => {
    const el = mapAreaRef.current
    if (!el) return
    const measure = () => {
      if (selected) setMapSize({ w: el.clientWidth, h: el.clientHeight })
      else setMapSize({ w: 200, h: 200 })
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro) ro.observe(el)
    return () => { if (ro) ro.disconnect() }
  }, [selected])
  const [teams, setTeams] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('dashboard')
  const [mapFilters, setMapFilters] = useState({ priority: '', status: '', heatmap: 'off' })
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swachhlens_onboarded') !== 'true'
    }
    return false
  })

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('swachhlens_intro_shown') !== 'true'
    }
    return false
  })
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('darkMode') !== null) {
        return localStorage.getItem('darkMode') === 'true'
      }
      return true
    }
    return true
  })
  const [toasts, setToasts] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailOpen, setDetailOpen] = useState(true)
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false)
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, '') || '/')
  const [user, setUser] = useState(null)
  const [loginOpen, setLoginOpen] = useState(false)

  const navigate = useCallback((path) => {
    window.location.hash = path
  }, [])

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace(/^#/, '') || '/')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const { playSuccess, playError, playNotification, toggleEnabled, enabled: soundEnabled } = useSound()
  const { success: hapticSuccess, error: hapticError } = useHaptic()

  // pagination & filters
  const [page, setPage] = useState(1)
  const [limit] = useState(100)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    if (type === 'success') { playSuccess(); hapticSuccess() }
    if (type === 'error') { playError(); hapticError() }
    if (type === 'info') playNotification()
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [playSuccess, playError, playNotification, hapticSuccess, hapticError])

  const loadData = useCallback(async ()=>{
    setLoading(true)
    try{
      const rp = await fetchReports({ page, limit, status: statusFilter || undefined, priority: priorityFilter || undefined, search: search || undefined })
      setReports(rp.items || [])
      setTotal(rp.total || 0)
    }catch(e){
      console.error(e)
      addToast('Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, priorityFilter, search, addToast])

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      await loadData()
      if (!mounted) return
      try{
        const t = await fetchTeams()
        setTeams(t)
        const v = await fetchVehicles()
        setVehicles(v)
      }catch(e){ console.error(e) }
    })()

    const id = setInterval(()=>{ loadData().catch(e=>console.error('Polling failed', e)) }, 10000)

    let socket
    try{
      const API_BASE = import.meta.env.VITE_API_BASE || ''
      socket = io(API_BASE, { path: '/socket.io' })
      socket.on('connect', ()=> console.log('socket connected', socket.id))
      socket.on('report:created', (r)=>{ console.log('report:created', r); loadData(); addToast(`New report: ${r.report_id}`, 'success') })
      socket.on('report:updated', (r)=>{ console.log('report:updated', r); loadData() })
      socket.on('report:commented', (r)=>{ console.log('report:commented', r); loadData() })
    }catch(e){ console.warn('Socket connect failed', e) }

    return ()=>{ mounted = false; clearInterval(id); if (socket) socket.disconnect() }
  },[loadData, addToast])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (showOnboarding) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [showOnboarding])

  // Restore session if a token is persisted
  useEffect(() => {
    let mounted = true
    if (getToken()) {
      getMe().then(u => { if (mounted) setUser(u) }).catch(() => { setAuthToken(null); if (mounted) setUser(null) })
    }
    return () => { mounted = false }
  }, [])

  const handleLogin = async (email, password) => {
    const data = await apiLogin(email, password)
    setAuthToken(data.token)
    setUser(data.user)
    addToast(`Signed in as ${data.user.name || data.user.email}`, 'success')
    return data
  }

  const handleLogout = () => {
    setAuthToken(null)
    setUser(null)
    addToast('Signed out', 'info')
  }

  const handleReportUpdated = (updated) => {
    setReports((prev) => prev.map(p => p.report_id === updated.report_id ? updated : p))
    setSelected((cur) => cur && cur.report_id === updated.report_id ? updated : cur)
  }

  const openReportById = async (id) => {
    const existing = reports.find(r => r.report_id === id || r.display_id === id)
    if (existing) {
      setSelected(existing)
      return
    }
    try {
      const fresh = await fetchReport(id)
      setReports((prev) => prev.some(p => p.report_id === fresh.report_id) ? prev : [...prev, fresh])
      setSelected(fresh)
    } catch (e) {
      addToast('Could not open that report', 'error')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowUpload(true)
      }
      if (e.key === 'Escape') {
        setShowUpload(false)
        setSelected(null)
      }
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        loadData()
      }
      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        navigate('/analytics')
      }
      if (e.key === '?') {
        setKeyboardShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loadData, navigate])

  const stats = useMemo(()=>{
    const counts = { pending:0, ready:0, assigned:0, completed:0, high:0, medium:0, low:0, urgent:0 }
    reports.forEach((report)=>{
      counts[report.status] = (counts[report.status] || 0) + 1
      const priority = normalizeValue(report.ml_results?.priority, '')
      if (priority) counts[priority.toLowerCase()] = (counts[priority.toLowerCase()] || 0) + 1
    })
    return counts
  }, [reports])

  const handleUploadDone = async (created) => {
    setShowUpload(false)
    await loadData()
    if (created) setSelected(created)
    addToast('Report submitted successfully', 'success')
  }

  const handleSelect = (report) => {
    setSelected(report)
    setMapRoute(null)
    if (window.innerWidth < 1024) {
      setDetailOpen(true)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem('swachhlens_onboarded', 'true')
    addToast('Welcome to SwachhLens! Press ? for shortcuts', 'info')
  }

  const hasFilters = statusFilter || priorityFilter || search

  const statCards = [
    {
      icon: FileText,
      label: "Active reports",
      value: total,
      color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
    },
    {
      icon: AlertTriangle,
      label: "High priority",
      value: stats.high + stats.urgent,
      color: "bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300"
    },
    {
      icon: Users,
      label: "Assigned crews",
      value: stats.assigned,
      color: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
    },
    {
      icon: CheckCircle2,
      label: "Completed",
      value: stats.completed,
      color: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
    }
  ]

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Map', icon: MapIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : route === '/reports' ? (
        <ReportsAnalyticsPage
          reports={reports}
          teams={teams}
          vehicles={vehicles}
          user={user}
          onLogin={() => setLoginOpen(true)}
          onBack={() => navigate('/')}
          onOpenReport={(id, report) => {
            if (id && id !== 'all') {
              if (report) setSelected(report)
              openReportById(id)
              navigate(`/reports/${id}`)
            }
          }}
          onRefresh={loadData}
          loading={loading}
        />
      ) : route.startsWith('/reports/') ? (
        <ReportPage
          report={selected}
          reportId={decodeURIComponent(route.slice('/reports/'.length))}
          teams={teams}
          vehicles={vehicles}
          user={user}
          onLogin={() => setLoginOpen(true)}
          onBack={() => navigate('/')}
          onOpenReport={(id) => {
            setSelected(null)
            openReportById(id)
            navigate(`/reports/${id}`)
          }}
          onAssigned={handleReportUpdated}
        />
      ) : route === '/analytics' ? (
        <AnalyticsPage
          reports={reports}
          teams={teams}
          vehicles={vehicles}
          onBack={() => navigate('/')}
          onRefresh={loadData}
          loading={loading}
        />
      ) : PLACEHOLDER_PAGE_ID_BY_ROUTE[route] ? (
        <PlaceholderPage
          id={PLACEHOLDER_PAGE_ID_BY_ROUTE[route]}
          user={user}
          onLogin={() => setLoginOpen(true)}
          darkMode={darkMode}
        />
      ) : (
      <>
      <Toaster toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <OnboardingOverlay isOpen={showOnboarding} onComplete={handleOnboardingComplete} onSkip={handleOnboardingComplete} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleLogin} />
      {!showIntro && <Splash />}
      <Dashboard
        user={user}
        onLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
        onNavigate={navigate}
        reports={reports}
        loading={loading}
        onRefresh={loadData}
        showUpload={showUpload}
        onUploadOpen={() => setShowUpload(true)}
        onUploadClose={() => setShowUpload(false)}
        onUploadDone={handleUploadDone}
        onOpenReport={(id, report) => {
          if (id && id !== 'all') {
            if (report) setSelected(report)
            openReportById(id)
            navigate(`/reports/${id}`)
          }
        }}
      />
      </>
      )}
    </div>
  )
}
