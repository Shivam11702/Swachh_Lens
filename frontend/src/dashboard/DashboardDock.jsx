import { Dock, DockIcon, DockItem, DockLabel } from '@/components/core/dock'
import { LayoutDashboard, Gauge, Sparkles, Recycle, FileText, BarChart3, MapPin, Settings } from 'lucide-react'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'cleanliness', label: 'Cleanliness', icon: Sparkles },
  { id: 'waste', label: 'Waste', icon: Recycle },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function DashboardDock({ active, onSelect }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
      <Dock className="rounded-full border border-gray-200/70 bg-white/90 px-4 shadow-[0_2px_12px_-4px_rgba(16,24,40,0.12)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-900">
        {pages.map((page) => {
          const Icon = page.icon
          const isActive = active === page.id
          return (
            <DockItem
              key={page.id}
              onClick={() => onSelect(page.id)}
              className={`aspect-square rounded-full border transition-colors duration-150 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500 shadow-md shadow-emerald-500/30'
                  : 'border-transparent bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700'
              }`}
            >
              <DockLabel>{page.label}</DockLabel>
              <DockIcon>
                <Icon
                  className={`h-full w-full ${
                    isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                />
              </DockIcon>
            </DockItem>
          )
        })}
      </Dock>
    </div>
  )
}
