// Central navigation routing for sidebar nav items.
// Items that map to a real route navigate there; items without a page
// keep the highlight in place (no navigation).

export const NAV_ROUTES = {
  dashboard: '/',
  reports: '/reports',
  analytics: '/analytics',
  insights: '/reports',
  overview: '/overview',
  cleanliness: '/cleanliness',
  waste: '/waste',
  complaints: '/complaints',
  locations: '/locations',
  inspections: '/inspections',
  notifications: '/notifications',
  settings: '/settings',
  help: '/help',
}

export function navRouteFor(id) {
  return NAV_ROUTES[id] ?? null
}
