export const trendData = [
  { day: 'Mon', score: 71 },
  { day: 'Tue', score: 74 },
  { day: 'Wed', score: 72 },
  { day: 'Thu', score: 78 },
  { day: 'Fri', score: 81 },
  { day: 'Sat', score: 84 },
  { day: 'Sun', score: 87 },
]

export const kpis = [
  {
    id: 'score',
    label: 'Cleanliness Score',
    value: '87%',
    delta: '+6.2%',
    up: true,
    spark: [72, 74, 76, 74, 80, 82, 87],
  },
  {
    id: 'resolved',
    label: 'Reports Resolved',
    value: '1,110',
    delta: '+14.8%',
    up: true,
    spark: [820, 860, 900, 950, 1010, 1070, 1110],
  },
  {
    id: 'collection',
    label: 'Collection Efficiency',
    value: '78%',
    delta: '+4.3%',
    up: true,
    spark: [66, 68, 70, 71, 73, 76, 78],
  },
  {
    id: 'critical',
    label: 'Critical Locations',
    value: '12',
    delta: '-18.5%',
    up: false,
    spark: [28, 25, 23, 21, 18, 15, 12],
  },
]

export const topLocations = [
  { rank: '01', name: 'Central Park', score: 96 },
  { rank: '02', name: 'Sector 12', score: 94 },
  { rank: '03', name: 'City Mall', score: 92 },
  { rank: '04', name: 'School Zone', score: 91 },
  { rank: '05', name: 'Railway Area', score: 89 },
]

export const collectionBreakdown = [
  { label: 'Collected', value: 78, color: '#22c55e' },
  { label: 'Pending', value: 14, color: '#f59e0b' },
  { label: 'Missed', value: 8, color: '#ef4444' },
]

export const wasteComposition = [
  { name: 'Organic', value: 42, color: '#16a34a' },
  { name: 'Plastic', value: 31, color: '#22c55e' },
  { name: 'Mixed', value: 18, color: '#86efac' },
  { name: 'Other', value: 9, color: '#f59e0b' },
]

export const locations = [
  { location: 'Central Market', cleanliness: 92, waste: 'Low', inspected: '12 min ago', status: 'Excellent', statusType: 'success' },
  { location: 'City Park', cleanliness: 76, waste: 'Moderate', inspected: '24 min ago', status: 'Needs Attention', statusType: 'warning' },
  { location: 'Railway Area', cleanliness: 61, waste: 'High', inspected: '8 min ago', status: 'Critical', statusType: 'danger' },
  { location: 'School Zone', cleanliness: 88, waste: 'Low', inspected: '35 min ago', status: 'Good', statusType: 'good' },
  { location: 'Sector 12', cleanliness: 94, waste: 'Low', inspected: '52 min ago', status: 'Excellent', statusType: 'success' },
  { location: 'City Mall', cleanliness: 82, waste: 'Moderate', inspected: '1 hr ago', status: 'Good', statusType: 'good' },
]

export const recentReports = [
  { issue: 'Overflowing Garbage Bin', location: 'Central Market', time: '12 min ago', priority: 'High', priorityType: 'danger', status: 'Pending', statusType: 'warning' },
  { issue: 'Uncollected Waste', location: 'Sector 12', time: '28 min ago', priority: 'Medium', priorityType: 'warning', status: 'Assigned', statusType: 'info' },
  { issue: 'Dirty Public Area', location: 'Railway Station', time: '1 hr ago', priority: 'Low', priorityType: 'neutral', status: 'Resolved', statusType: 'success' },
  { issue: 'Blocked Drainage', location: 'City Park', time: '2 hrs ago', priority: 'High', priorityType: 'danger', status: 'Assigned', statusType: 'info' },
  { issue: 'Illegal Dumping', location: 'Market Road', time: '3 hrs ago', priority: 'Medium', priorityType: 'warning', status: 'Pending', statusType: 'warning' },
]

export const aiInsights = [
  {
    id: 1,
    icon: 'alert',
    title: 'High Waste Accumulation',
    description: 'Market Road has experienced a 34% increase in waste accumulation compared with yesterday.',
    badge: 'Attention Required',
    badgeType: 'danger',
  },
  {
    id: 2,
    icon: 'spark',
    title: 'Positive Trend',
    description: 'City Park cleanliness improved by 12% this week.',
    badge: 'Improving',
    badgeType: 'success',
  },
  {
    id: 3,
    icon: 'trend',
    title: 'Collection Prediction',
    description: '3 locations are likely to require waste collection within the next 2 hours.',
    badge: 'Prediction',
    badgeType: 'info',
  },
  {
    id: 4,
    icon: 'shield',
    title: 'Recommended Action',
    description: 'Schedule a crew dispatch to Railway Area before 18:00 to prevent escalation.',
    badge: 'Recommended',
    badgeType: 'warning',
  },
]

export const mapMarkers = [
  { x: 22, y: 30, type: 'clean', label: 'Central Park', score: 96 },
  { x: 42, y: 18, type: 'clean', label: 'Sector 12', score: 94 },
  { x: 60, y: 34, type: 'attention', label: 'City Mall', score: 82 },
  { x: 30, y: 52, type: 'attention', label: 'Central Market', score: 92 },
  { x: 55, y: 62, type: 'clean', label: 'School Zone', score: 88 },
  { x: 78, y: 48, type: 'critical', label: 'Railway Area', score: 61 },
  { x: 14, y: 76, type: 'clean', label: 'Residential Zone', score: 90 },
  { x: 66, y: 82, type: 'attention', label: 'Industrial Park', score: 74 },
  { x: 85, y: 24, type: 'clean', label: 'East Lake', score: 93 },
]

export const overviewMetrics = [
  { label: 'Locations Monitored', value: '1,248' },
  { label: 'Active Reports', value: '96' },
  { label: 'Pending Actions', value: '42' },
  { label: 'Resolved Issues', value: '1,110' },
]

export const navGroups = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'overview', label: 'Overview', icon: 'gauge' },
      { id: 'cleanliness', label: 'Cleanliness Monitoring', icon: 'sparkles' },
      { id: 'waste', label: 'Waste Management', icon: 'recycle' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'reports', label: 'Reports', icon: 'file-text' },
      { id: 'complaints', label: 'Complaints', icon: 'message-square' },
      { id: 'locations', label: 'Locations', icon: 'map-pin' },
      { id: 'inspections', label: 'Inspections', icon: 'clipboard-check' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'analytics', label: 'Analytics', icon: 'chart-line' },
      { id: 'insights', label: 'Reports & Insights', icon: 'bar-chart-3' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: 'bell' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
      { id: 'help', label: 'Help & Support', icon: 'circle-help' },
    ],
  },
]

export const quickActions = [
  { id: 'report', label: 'Add Report', icon: 'file-plus', primary: true },
  { id: 'location', label: 'Add Location', icon: 'map-pin-plus' },
  { id: 'inspection', label: 'Schedule Inspection', icon: 'calendar-check' },
  { id: 'generate', label: 'Generate Report', icon: 'file-text' },
]
