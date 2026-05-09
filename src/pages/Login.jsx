import { useState } from 'react'
import { signIn } from '../lib/auth'
import { LogoMark } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.65s linear infinite',
    }} />
  )
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
          stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75"/>
    </svg>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password || loading) return
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await signIn(email.trim(), password)
      if (authError) {
        const parts = [
          authError.message,
          authError.status ? `status=${authError.status}` : null,
          authError.name ? `name=${authError.name}` : null,
        ].filter(Boolean)
        setError(parts.join(' · ') || 'Unknown error')
        setLoading(false)
      }
    } catch (thrown) {
      setError(`Thrown: ${thrown?.message ?? String(thrown)}`)
      setLoading(false)
    }
    // On success onAuthStateChange in App.jsx fires → session set → this screen unmounts
  }

  return (
    <div style={{
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      paddingTop: 'max(40px, env(safe-area-inset-top, 40px))',
      paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
    }}>
      {/* Branding */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <LogoMark size={48} color="var(--accent)" />
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 38,
          fontWeight: 300,
          color: 'var(--fg1)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          Mise en Place
        </div>
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 10,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: 'var(--fg2)',
        }}>
          Meal Planning
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {/* Email */}
        <div>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 500,
            color: 'var(--fg2)', marginBottom: 6, fontFamily: 'var(--font-ui)',
          }}>
            Email
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        {/* Password */}
        <div>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 500,
            color: 'var(--fg2)', marginBottom: 6, fontFamily: 'var(--font-ui)',
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ paddingRight: 46 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: 'var(--fg3)', lineHeight: 1, display: 'flex',
              }}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!email.trim() || !password || loading}
          style={{ marginTop: 4 }}
        >
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner /> Signing in…
              </span>
            : 'Sign in'
          }
        </Button>

        {error && (
          <div style={{ fontSize: 13, color: 'var(--error)', textAlign: 'center', lineHeight: 1.5 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  )
}
