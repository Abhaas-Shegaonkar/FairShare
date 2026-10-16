import React from 'react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-display font-medium tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-nexus-lime disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer'

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
  }

  const variantStyles = {
    primary:
      'bg-nexus-lime text-nexus-bg font-semibold hover:bg-[#d5ff6b] hover:shadow-nexus-glow border border-nexus-lime active:scale-[0.98]',
    lime:
      'bg-nexus-lime text-nexus-bg font-semibold hover:bg-[#d5ff6b] hover:shadow-nexus-glow border border-nexus-lime active:scale-[0.98]',
    cyan:
      'bg-nexus-cyan/10 text-nexus-cyan border border-nexus-cyan/40 hover:bg-nexus-cyan/20 hover:border-nexus-cyan hover:shadow-nexus-cyan-glow active:scale-[0.98]',
    secondary:
      'bg-nexus-surface text-nexus-text border border-nexus-border hover:bg-nexus-surface-hover hover:border-nexus-border-bright active:scale-[0.98]',
    ghost:
      'bg-transparent text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface/60 active:scale-[0.98]',
    danger:
      'bg-nexus-crimson/10 text-nexus-crimson border border-nexus-crimson/40 hover:bg-nexus-crimson/20 active:scale-[0.98]',
  }

  const selectedSize = sizeStyles[size] || sizeStyles.md
  const selectedVariant = variantStyles[variant] || variantStyles.primary

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${selectedSize} ${selectedVariant} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      <span>{children}</span>
    </button>
  )
}
