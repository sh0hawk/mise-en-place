export function LogoMark({ size = 48, color = 'currentColor' }) {
  const scale = size / 170
  return (
    <svg
      width={size * (100 / 170)}
      height={size}
      viewBox="0 0 100 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fork — 4 tines */}
      <line x1="22" y1="10" x2="22" y2="52" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="27" y1="10" x2="27" y2="52" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="32" y1="10" x2="32" y2="52" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="37" y1="10" x2="37" y2="52" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M22 52 Q22 62 27 65 L32 65 Q37 62 37 52" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="29.5" y1="65" x2="29.5" y2="160" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Spoon */}
      <path d="M68 10 Q82 10 82 28 Q82 46 68 52 Q54 46 54 28 Q54 10 68 10 Z" fill="none" stroke={color} strokeWidth="1.8"/>
      <line x1="68" y1="52" x2="68" y2="160" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

export function Logo({ dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <LogoMark size={36} color={dark ? '#FAF8F5' : 'var(--accent)'} />
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 300,
          color: 'var(--fg1)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}>
          Mise en Place
        </div>
        <div style={{
          height: '0.5px',
          background: 'var(--accent)',
          opacity: 0.45,
          margin: '2px 0 3px',
        }} />
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 9,
          fontWeight: 400,
          letterSpacing: '0.18em',
          color: 'var(--fg2)',
          textTransform: 'uppercase',
        }}>
          Meal Planning
        </div>
      </div>
    </div>
  )
}
