import { useState } from 'react'

const baseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-ui)',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  transition: 'background 0.12s, color 0.12s, opacity 0.12s',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none',
}

const variants = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    padding: '12px 22px',
  },
  secondary: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    padding: '12px 22px',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--accent)',
    border: '1.5px solid var(--border)',
    padding: '10.5px 20.5px',
  },
  danger: {
    background: 'var(--error-bg)',
    color: 'var(--error)',
    padding: '12px 22px',
  },
  pill: {
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 18px',
    borderRadius: 'var(--radius-full)',
  },
  'pill-ghost': {
    background: 'transparent',
    color: 'var(--fg2)',
    border: '1.5px solid var(--border)',
    fontSize: 13,
    fontWeight: 500,
    padding: '6.5px 16.5px',
    borderRadius: 'var(--radius-full)',
  },
  icon: {
    background: 'var(--subtle)',
    color: 'var(--fg1)',
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    padding: 0,
    fontSize: 18,
  },
  'icon-round': {
    background: 'var(--accent)',
    color: '#fff',
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-full)',
    padding: 0,
    fontSize: 20,
  },
}

export function Button({ variant = 'primary', disabled, fullWidth, style, children, onClick, ...props }) {
  const [pressed, setPressed] = useState(false)

  const variantStyle = variants[variant] || variants.primary
  const disabledStyle = disabled ? {
    background: 'var(--subtle)',
    color: 'var(--fg3)',
    opacity: 0.6,
    cursor: 'not-allowed',
    border: 'none',
  } : {}

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...(fullWidth ? { width: '100%' } : {}),
        ...(pressed && !disabled ? { opacity: 0.85 } : {}),
        ...disabledStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
