export function SegmentControl({ options, value, onChange, style }) {
  return (
    <div style={{
      background: 'var(--subtle)',
      borderRadius: 10,
      padding: 3,
      display: 'inline-flex',
      ...style,
    }}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--fg1)' : 'var(--fg2)',
              padding: '7px 16px',
              borderRadius: 8,
              background: active ? 'var(--elevated)' : 'transparent',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
