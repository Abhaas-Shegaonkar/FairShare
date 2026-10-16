import React from 'react'

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  variant = 'lime',
  className = '',
}) {
  const accentClasses = {
    lime: {
      text: 'text-nexus-lime',
      border: 'border-nexus-lime/30',
      glow: 'group-hover:border-nexus-lime/60',
      led: 'nexus-led-lime',
    },
    cyan: {
      text: 'text-nexus-cyan',
      border: 'border-nexus-cyan/30',
      glow: 'group-hover:border-nexus-cyan/60',
      led: 'nexus-led-cyan',
    },
    amber: {
      text: 'text-nexus-amber',
      border: 'border-nexus-amber/30',
      glow: 'group-hover:border-nexus-amber/60',
      led: 'nexus-led-amber',
    },
    crimson: {
      text: 'text-nexus-crimson',
      border: 'border-nexus-crimson/30',
      glow: 'group-hover:border-nexus-crimson/60',
      led: 'nexus-led-crimson',
    },
  }

  const currentAccent = accentClasses[variant] || accentClasses.lime

  return (
    <div
      className={`group relative nexus-corner-bracket bg-nexus-surface border border-nexus-border p-5 rounded-lg shadow-nexus-card transition-all duration-300 hover:bg-nexus-surface-hover ${currentAccent.glow} ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-nexus-muted">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className={`w-4 h-4 ${currentAccent.text} opacity-80`} />
          )}
          <span className={`nexus-led ${currentAccent.led}`} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl md:text-3xl font-mono font-bold tracking-tight text-nexus-text">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
              trendPositive
                ? 'bg-nexus-lime/10 text-nexus-lime border border-nexus-lime/30'
                : 'bg-nexus-crimson/10 text-nexus-crimson border border-nexus-crimson/30'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-nexus-muted font-sans line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  )
}
