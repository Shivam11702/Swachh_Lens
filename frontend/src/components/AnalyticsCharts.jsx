import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, RadialBarChart, RadialBar, Label
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, PieChart as PieChartIcon, Package, Boxes } from 'lucide-react'
import { SpotlightCard } from '@/components/core/spotlight-card'

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  gradient: ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'],
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const Card = ({ title, subtitle, icon: Icon, children, trend, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={className}
  >
    <SpotlightCard className="h-full" innerClassName="p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
            {title}
          </div>
          {subtitle && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.value >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
            {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">vs last period</span>
          </div>
        )}
      </div>
      <div className="h-48">{children}</div>
    </SpotlightCard>
  </motion.div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="surface p-3 rounded-lg shadow-lg border border-slate-200 dark:border-surface-700"
      >
        <p className="font-medium text-slate-900 dark:text-slate-100">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <strong>{formatNumber(entry.value)}</strong>
          </p>
        ))}
      </motion.div>
    )
  }
  return null
}

export function ReportsOverTimeChart({ data, className = '' }) {
  return (
    <Card
      title="Reports Over Time"
      subtitle="Daily report submissions"
      icon={Activity}
      trend={{ value: 12.5 }}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReportsStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={1}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.5}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="reports"
            stroke="url(#colorReportsStroke)"
            fill="url(#colorReports)"
            strokeWidth={2}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function PriorityDistributionChart({ data, className = '' }) {
  const chartData = useMemo(() => 
    data.map((item, index) => ({
      ...item,
      fill: COLORS.gradient[index % COLORS.gradient.length],
    }))
  , [data])

  return (
    <Card
      title="Priority Distribution"
      subtitle="Report priority breakdown"
      icon={PieChartIcon}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function StatusBreakdownChart({ data, className = '' }) {
  return (
    <Card
      title="Status Breakdown"
      subtitle="Current report statuses"
      icon={BarChart2}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]} 
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function CategoryDistributionChart({ data, className = '' }) {
  const chartData = useMemo(() =>
    data.map((item, index) => ({
      ...item,
      fill: COLORS.gradient[index % COLORS.gradient.length],
    }))
  , [data])

  return (
    <Card
      title="Waste Category"
      subtitle="Breakdown by reported category"
      icon={Package}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function VolumeDistributionChart({ data, className = '' }) {
  return (
    <Card
      title="Estimated Volume"
      subtitle="Breakdown by reported volume"
      icon={Boxes}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={110} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={36}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function TeamWorkloadChart({ data, className = '' }) {
  return (
    <Card
      title="Team Workload"
      subtitle="Reports assigned per team"
      icon={BarChart2}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function RadialProgressChart({ value, label, color = COLORS.primary, size = 120, className = '' }) {
  const progress = Math.max(0, Math.min(100, value))
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <SpotlightCard className="h-full" innerClassName="p-5 h-full text-center">
        <ResponsiveContainer width={size} height={size}>
          <RadialBarChart>
            <RadialBar
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              dataKey="value"
              background={false}
              startAngle={-90}
              endAngle={270}
              minAngle={10}
            >
              <Label>
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-2xl font-bold text-slate-900 dark:text-slate-100"
                >
                  {progress.toFixed(0)}%
                </motion.span>
              </Label>
            </RadialBar>
            <RadialBar
              data={[{ value: progress, name: label }]}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              startAngle={-90}
              endAngle={270}
              background={{ fill: '#e2e8f0', fillOpacity: 0.3 }}
              cornerRadius={6}
            >
              <Cell fill={color} />
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</div>
      </SpotlightCard>
    </motion.div>
  )
}

export function AnalyticsDashboard({ reports = [], teams = [], vehicles = [] }) {
  const timeSeriesData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })
    
    return last30Days.map(date => ({
      date,
      reports: reports.filter(r => r.created_at?.startsWith(date)).length,
    }))
  }, [reports])

  const priorityData = useMemo(() => {
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 }
    reports.forEach(r => {
      const p = normalizeValue(r.ml_results?.priority, 'medium').toLowerCase()
      if (counts[p] !== undefined) counts[p]++
    })
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  }, [reports])

  const statusData = useMemo(() => {
    const counts = {}
    reports.forEach(r => {
      const s = normalizeValue(r.status, 'pending')
      counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value }))
  }, [reports])

  const teamData = useMemo(() => {
    return teams.map(t => ({
      name: t.name,
      value: reports.filter(r => r.assignment?.team_id === t.team_id).length,
    })).filter(t => t.value > 0)
  }, [teams, reports])

  const categoryData = useMemo(() => {
    const counts = {}
    reports.forEach(r => {
      const c = r.category || r.ml_results?.classification || 'Uncategorized'
      counts[c] = (counts[c] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [reports])

  const volumeData = useMemo(() => {
    const counts = {}
    reports.forEach(r => {
      const v = r.estimated_volume || r.ml_results?.volume_bin || 'Unknown'
      counts[v] = (counts[v] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [reports])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RadialProgressChart value={reports.length ? (reports.filter(r => r.status === 'completed').length / reports.length * 100) : 0} label="Completion Rate" color={COLORS.success} />
        <RadialProgressChart value={reports.length ? (reports.filter(r => r.ml_results?.priority === 'high' || r.ml_results?.priority === 'urgent').length / reports.length * 100) : 0} label="High Priority %" color={COLORS.error} />
        <RadialProgressChart value={teams.length ? (teams.filter(t => t.available).length / teams.length * 100) : 0} label="Team Availability" color={COLORS.primary} />
        <RadialProgressChart value={vehicles.length ? (vehicles.filter(v => v.available).length / vehicles.length * 100) : 0} label="Vehicle Availability" color={COLORS.info} />
      </div>
      
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportsOverTimeChart data={timeSeriesData} />
        <PriorityDistributionChart data={priorityData} />
      </div>
      
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDistributionChart data={categoryData} />
        <VolumeDistributionChart data={volumeData} />
      </div>
      
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusBreakdownChart data={statusData} />
        <TeamWorkloadChart data={teamData} />
      </div>
    </div>
  )
}

const normalizeValue = (value, fallback = 'medium') => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.label || value.name || fallback
  return fallback
}