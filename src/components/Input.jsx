import { useState } from 'react'

export function Input({ error, style, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <input
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        background: focused ? 'var(--elevated)' : 'var(--subtle)',
        border: `1.5px solid ${error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '11px 14px',
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        color: 'var(--fg1)',
        width: '100%',
        outline: 'none',
        boxShadow: focused ? '0 0 0 3px rgba(196,99,62,0.12)' : (error ? '0 0 0 3px rgba(179,64,64,0.10)' : 'none'),
        transition: 'border 0.12s, background 0.12s, box-shadow 0.12s',
        ...style,
      }}
      {...props}
    />
  )
}

export function SearchInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      border: `1.5px solid ${focused ? 'var(--accent)' : 'transparent'}`,
      boxShadow: focused ? '0 0 0 3px rgba(196,99,62,0.12)' : 'none',
      transition: 'border 0.12s, box-shadow 0.12s',
      ...style,
    }}>
      <span style={{ color: 'var(--fg3)', fontSize: 16, flexShrink: 0 }}>🔍</span>
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'var(--font-ui)',
          fontSize: 15,
          color: 'var(--fg1)',
          width: '100%',
        }}
        {...props}
      />
    </div>
  )
}

export function Textarea({ error, style, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <textarea
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        background: focused ? 'var(--elevated)' : 'var(--subtle)',
        border: `1.5px solid ${error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '11px 14px',
        fontFamily: 'var(--font-ui)',
        fontSize: 15,
        color: 'var(--fg1)',
        width: '100%',
        outline: 'none',
        resize: 'vertical',
        minHeight: 80,
        boxShadow: focused ? '0 0 0 3px rgba(196,99,62,0.12)' : 'none',
        transition: 'border 0.12s, background 0.12s, box-shadow 0.12s',
        ...style,
      }}
      {...props}
    />
  )
}
