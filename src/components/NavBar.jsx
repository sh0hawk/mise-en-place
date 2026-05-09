import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/',         label: 'Home',     icon: HomeIcon },
  { path: '/plan',     label: 'Plan',     icon: PlanIcon },
  { path: '/recipes',  label: 'Recipes',  icon: RecipesIcon },
  { path: '/shopping', label: 'Shopping', icon: ShoppingIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V21H15V15H9V21H3V9.5Z"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}

function PlanIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8"/>
      <line x1="3" y1="9" x2="21" y2="9"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8"/>
      <line x1="8" y1="2" x2="8" y2="6"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="16" y1="2" x2="16" y2="6"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="7" y="13" width="3" height="3" rx="0.5"
        fill={active ? 'var(--accent)' : 'var(--fg3)'}/>
      <rect x="13" y="13" width="3" height="3" rx="0.5"
        fill={active ? 'var(--accent)' : 'var(--fg3)'}/>
    </svg>
  )
}

function RecipesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 19h16"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="7" x2="16" y2="7"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="11" x2="14" y2="11"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function ShoppingIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="3" y1="6" x2="21" y2="6"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8"/>
      <path d="M16 10a4 4 0 01-8 0"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={active ? 'var(--accent)' : 'var(--fg3)'}
        strokeWidth="1.8"/>
    </svg>
  )
}

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 100,
    }}>
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path ||
          (path !== '/' && location.pathname.startsWith(path))
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 0 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon active={active} />
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              color: active ? 'var(--accent)' : 'var(--fg3)',
              fontFamily: 'var(--font-ui)',
              lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export function TopNav({ title, backLabel, backPath, action }) {
  const navigate = useNavigate()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      minHeight: 56,
    }}>
      {backPath && (
        <button
          onClick={() => navigate(backPath)}
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--font-ui)',
            flexShrink: 0,
          }}
        >
          ← {backLabel || 'Back'}
        </button>
      )}
      {title && (
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--fg1)',
          fontFamily: 'var(--font-ui)',
        }}>
          {title}
        </span>
      )}
      {action && (
        <div style={{ marginLeft: 'auto' }}>
          {action}
        </div>
      )}
    </header>
  )
}
