import React from 'react'

export function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) {
  const variantStyles = {
    lime: 'bg-nexus-lime/10 text-nexus-lime border-nexus-lime/30',
    cyan: 'bg-nexus-cyan/10 text-nexus-cyan border-nexus-cyan/30',
    amber: 'bg-nexus-amber/10 text-nexus-amber border-nexus-amber/30',
    crimson: 'bg-nexus-crimson/10 text-nexus-crimson border-nexus-crimson/30',
    surface: 'bg-nexus-surface text-nexus-muted border-nexus-border',
    default: 'bg-nexus-surface text-nexus-text border-nexus-border',
  }

  const dotLedClasses = {
    lime: 'nexus-led-lime',
    cyan: 'nexus-led-cyan',
    amber: 'nexus-led-amber',
    crimson: 'nexus-led-crimson',
    surface: 'nexus-led-lime',
    default: 'nexus-led-cyan',
  }

  const selectedStyle = variantStyles[variant] || variantStyles.default
  const selectedDotClass = dotLedClasses[variant] || dotLedClasses.default

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${selectedStyle} ${className}`}
    >
      {dot && <span className={`nexus-led ${selectedDotClass} w-1.5 h-1.5`} />}
      {children}
    </span>
  )
}
