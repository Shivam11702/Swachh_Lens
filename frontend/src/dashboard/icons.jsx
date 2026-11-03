import {
  LayoutDashboard,
  Gauge,
  Sparkles,
  Recycle,
  FileText,
  MessageSquare,
  MapPin,
  ClipboardCheck,
  ChartLine,
  BarChart3,
  Bell,
  Settings,
  CircleHelp,
} from 'lucide-react'

export const ICONS = {
  'layout-dashboard': LayoutDashboard,
  gauge: Gauge,
  sparkles: Sparkles,
  recycle: Recycle,
  'file-text': FileText,
  'message-square': MessageSquare,
  'map-pin': MapPin,
  'clipboard-check': ClipboardCheck,
  'chart-line': ChartLine,
  'bar-chart-3': BarChart3,
  bell: Bell,
  settings: Settings,
  'circle-help': CircleHelp,
}

export function NavIcon({ name, size = 18, className }) {
  const Icon = ICONS[name] || Sparkles
  return <Icon size={size} className={className} />
}
