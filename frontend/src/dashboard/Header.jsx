import { Search, Bell, Menu } from 'lucide-react'
import { TextEffect } from '@/components/core/text-effect'

export default function Header({ user, onMenu, onLogin }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <button className="sw-icon-btn lg:hidden" onClick={onMenu}>
          <Menu size={18} />
        </button>
        <div>
          <TextEffect
            as="h1"
            per="word"
            preset="fade-in-blur"
            speedReveal={2}
            className="sw-header-title"
          >
            Dashboard
          </TextEffect>
          <TextEffect
            as="p"
            per="word"
            preset="fade"
            delay={0.25}
            speedReveal={1.5}
            className="sw-header-sub"
          >
            Real-time cleanliness and waste management overview
          </TextEffect>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="sw-input" placeholder="Search locations, reports..." />
        </div>
        <button className="sw-icon-btn relative">
          <Bell size={18} />
          <span className="dot" />
        </button>
        {user ? (
          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white sm:flex">
            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        ) : (
          <button className="sw-btn sw-btn-primary hidden sm:inline-flex" onClick={onLogin}>
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
