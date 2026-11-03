import { Spotlight } from '@/components/core/spotlight'
import { cn } from '@/lib/utils'

export function SpotlightCard({
  children,
  className = '',
  innerClassName = '',
  innerStyle,
  spotlightSize = 180,
  spotlightClassName = 'from-emerald-400/60 via-emerald-300/40 to-teal-200/30 blur-2xl dark:from-emerald-300/40 dark:via-emerald-200/30 dark:to-teal-100/20',
  rounded = 'rounded-2xl',
  id,
  innerProps = {},
}) {
  return (
    <div id={id} className={cn('sw-spotlight-card relative overflow-hidden p-[1px]', rounded, className)}>
      <Spotlight className={spotlightClassName} size={spotlightSize} />
      <div className={cn('sw-glass relative h-full w-full', rounded, innerClassName)} style={innerStyle} {...innerProps}>
        {children}
      </div>
    </div>
  )
}

export function SpotlightBorder({ children, className = '', spotlightSize = 124, spotlightClassName }) {
  return (
    <SpotlightCard
      className={className}
      spotlightSize={spotlightSize}
      spotlightClassName={
        spotlightClassName ||
        'from-blue-600 via-blue-500 to-blue-400 blur-3xl dark:from-blue-200 dark:via-blue-300 dark:to-blue-400'
      }
    >
      {children}
    </SpotlightCard>
  )
}
