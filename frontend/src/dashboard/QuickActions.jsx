import { FilePlus, MapPinPlus, CalendarCheck, FileText, Plus } from 'lucide-react'
import { quickActions } from './data'
import { SpotlightCard } from '@/components/core/spotlight-card'

const ICONS = {
  'file-plus': FilePlus,
  'map-pin-plus': MapPinPlus,
  'calendar-check': CalendarCheck,
  'file-text': FileText,
}

export default function QuickActions({ onAddReport }) {
  return (
    <SpotlightCard innerClassName="sw-card-pad">
      <h2 className="sw-card-title">Quick Actions</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {quickActions.map((action) => {
          const Icon = ICONS[action.icon]
          if (action.primary) {
            return (
              <button key={action.id} className="sw-btn sw-btn-primary" onClick={onAddReport}>
                <Plus size={16} />
                {action.label}
              </button>
            )
          }
          return (
            <button key={action.id} className="sw-btn">
              <Icon size={16} className="text-gray-400" />
              {action.label}
            </button>
          )
        })}
      </div>
    </SpotlightCard>
  )
}
