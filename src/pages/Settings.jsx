import { useState, useEffect } from 'react'

function SettingsRow({ label, sublabel, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      {action}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: value ? 'var(--accent)' : 'var(--border)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: value ? 21 : 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: 'var(--shadow-sm)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

export function Settings() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system'
  })
  const [syncStatus] = useState('Connected')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  function cycleTheme() {
    const order = ['system', 'light', 'dark']
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  const themeLabel = { system: 'System', light: 'Light', dark: 'Dark' }[theme]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>Settings</span>
      </div>

      <div className="scroll-y" style={{ flex: 1, paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))` }}>
        {/* Appearance */}
        <div style={{ padding: '20px 16px 6px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', marginBottom: 8 }}>
            Appearance
          </div>
        </div>
        <div style={{ background: 'var(--elevated)', borderRadius: 14, margin: '0 16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <SettingsRow
            label="Theme"
            sublabel={`Currently: ${themeLabel}`}
            action={
              <button
                onClick={cycleTheme}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--accent)',
                  background: 'var(--accent-subtle)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {themeLabel}
              </button>
            }
          />
        </div>

        {/* Household */}
        <div style={{ padding: '20px 16px 6px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', marginBottom: 8 }}>
            Account
          </div>
        </div>
        <div style={{ background: 'var(--elevated)', borderRadius: 14, margin: '0 16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <SettingsRow
            label="Household"
            sublabel="Shared account — both phones see the same data"
            action={
              <span style={{
                fontSize: 12,
                background: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}>
                Active
              </span>
            }
          />
          <SettingsRow
            label="Sync status"
            sublabel="Real-time via Supabase"
            action={
              <span style={{
                fontSize: 12,
                background: syncStatus === 'Connected' ? 'var(--success-bg)' : 'var(--warning-bg)',
                color: syncStatus === 'Connected' ? 'var(--success)' : 'var(--warning)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}>
                {syncStatus}
              </span>
            }
          />
        </div>

        {/* About */}
        <div style={{ padding: '20px 16px 6px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', marginBottom: 8 }}>
            About
          </div>
        </div>
        <div style={{ background: 'var(--elevated)', borderRadius: 14, margin: '0 16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <SettingsRow label="App name" action={<span style={{ fontSize: 15, color: 'var(--fg2)', fontFamily: 'var(--font-display)' }}>Mise en Place</span>} />
          <SettingsRow label="Version" action={<span style={{ fontSize: 14, color: 'var(--fg3)', fontFamily: 'var(--font-mono)' }}>0.1.0</span>} />
        </div>

        <div style={{ padding: '24px 20px', fontSize: 13, color: 'var(--fg3)', textAlign: 'center', lineHeight: 1.6 }}>
          Mise en Place — Meal planning for two.<br />
          Both phones share the same household data in real time.
        </div>
      </div>
    </div>
  )
}
