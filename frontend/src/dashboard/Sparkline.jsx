export default function Sparkline({ data, color = '#22c55e', width = 96, height = 32 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - 3 - ((v - min) / range) * (height - 6)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`
  const linePath = `M${points.join(' L')}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={areaPath} fill={color} opacity="0.1" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
