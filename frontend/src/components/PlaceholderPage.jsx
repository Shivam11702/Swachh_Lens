import { useState } from 'react'
import {
  LayoutDashboard, Gauge, Sparkles, Recycle, FileText, MessageSquare,
  MapPin, ClipboardCheck, ChartLine, BarChart3, Bell, Settings, CircleHelp,
  Construction,
} from 'lucide-react'
import Sidebar from '../dashboard/Sidebar'
import Header from '../dashboard/Header'
import { cn } from '@/lib/utils'
import { navRouteFor } from '../dashboard/nav'

const ICONS = {
  dashboard: LayoutDashboard,
  overview: Gauge,
  cleanliness: Sparkles,
  waste: Recycle,
  reports: FileText,
  complaints: MessageSquare,
  locations: MapPin,
  inspections: ClipboardCheck,
  analytics: ChartLine,
  insights: BarChart3,
  notifications: Bell,
  settings: Settings,
  help: CircleHelp,
}

const PLACEHOLDER_COPY = {
  overview: {
    title: 'Overview',
    subtitle: 'A high-level snapshot of campus cleanliness, waste, and operations.',
  },
  cleanliness: {
    title: 'Cleanliness Monitoring',
    subtitle: 'Track cleanliness scores and trends across every monitored zone.',
  },
  waste: {
    title: 'Waste Management',
    subtitle: 'Collection schedules, segregation rates, and waste composition.',
  },
  complaints: {
    title: 'Complaints',
    subtitle: 'Community-submitted issues, triage queue, and resolution tracking.',
  },
  locations: {
    title: 'Locations',
    subtitle: 'Manage monitored locations, zones, and their live cleanliness state.',
  },
  inspections: {
    title: 'Inspections',
    subtitle: 'Schedule and review field inspections with photo evidence.',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Push alerts, digest preferences, and notification history.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Organization profile, permissions, and system preferences.',
  },
  help: {
    title: 'Help & Support',
    subtitle: 'Guides, FAQs, and contact channels for your organization.',
  },
}

export default function PlaceholderPage({
  id = 'overview', user, onLogin, darkMode: initialDark = false,
}) {
  const [darkMode, setDarkMode] = useState(initialDark)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active, setActive] = useState(id)

  const copy = PLACEHOLDER_COPY[id] || {
    title: id.charAt(0).toUpperCase() + id.slice(1),
    subtitle: 'This section is under construction.',
  }
  const Icon = ICONS[id] || Construction

  const handleSelect = (next) => {
    setActive(next)
    const route = navRouteFor(next)
    if (route) window.location.hash = route
  }

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

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
              >
                <Icon size={22} />
              </div>
              <div>
                <div className="sw-header-title">{copy.title}</div>
                <div className="sw-header-sub">{copy.subtitle}</div>
              </div>
            </div>

            <div
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                <Construction size={28} />
              </div>
              <div className="space-y-1.5">
                <div className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>
                  {copy.title} is on its way
                </div>
                <div className="mx-auto max-w-md text-sm" style={{ color: 'var(--text-3)' }}>
                  We&apos;re building this section. Head to{' '}
                  <button
                    className={cn('underline underline-offset-2 hover:opacity-80')}
                    style={{ color: 'var(--primary)' }}
                    onClick={() => { window.location.hash = '/reports' }}
                  >
                    Reports & Analytics
                  </button>{' '}
                  to explore live data and insights in the meantime.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
