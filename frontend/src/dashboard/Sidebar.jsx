import { LogOut, Moon, Sun, X, Aperture, Leaf } from 'lucide-react'
import { navGroups } from './data'
import { NavIcon } from './icons'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-5 pt-6 pb-2">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
        <Aperture size={18} strokeWidth={2} />
        <Leaf size={9} className="absolute -bottom-0.5 -right-0.5 text-emerald-900" fill="currentColor" />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-[0.04em] text-white">SWACH LENS</div>
        <div className="text-[10.5px] text-gray-500">AI Cleanliness Monitor</div>
      </div>
    </div>
  )
}

export default function Sidebar({ active, onSelect, user, darkMode, onToggleDark, open, onClose, onLogout }) {
  return (
    <>
      {open && <div className="sw-backdrop" onClick={onClose} />}
      <aside
        className={`sw-sidebar sw-scroll fixed top-0 bottom-0 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pr-3">
          <Logo />
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto sw-scroll px-2 pb-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="sw-nav-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`sw-nav-item ${active === item.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelect(item.id)
                    onClose()
                  }}
                >
                  <span className="sw-nav-icon">
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90 text-sm font-semibold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-white">{user?.name || 'Admin User'}</div>
              <div className="truncate text-xs text-gray-500">Administrator</div>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-white"
              title="Sign out"
              onClick={onLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
            <span className="text-xs font-medium text-gray-400">Theme</span>
            <button
              onClick={onToggleDark}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-gray-200 hover:bg-white/20"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
