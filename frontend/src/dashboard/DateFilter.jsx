import { CalendarDays } from 'lucide-react'

const OPTIONS = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom']

export default function DateFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          className={`sw-pill ${value === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt === 'Custom' && <CalendarDays size={14} />}
          {opt}
        </button>
      ))}
    </div>
  )
}
