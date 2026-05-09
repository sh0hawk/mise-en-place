import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { RecipeCard, RecipeCardSkeleton } from '../components/RecipeCard'
import { Sheet } from '../components/Sheet'
import { COOKBOOK_CATEGORIES } from '../lib/demo-data'
import { getCookbookIcon } from '../components/CookbookIcons'
import { useAppData } from '../lib/AppContext'
import { useMealSlots } from '../hooks/useMealSlots'
import {
  getGreeting, formatLongDate, getWeekDays, getWeekStart,
  isToday, isPast, toDateString,
} from '../lib/dates'

function DayCard({ date, recipes = [], active, past, onClick }) {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  const num = date.getDate()

  if (active) {
    return (
      <div onClick={onClick} style={{
        background: 'var(--accent)', borderRadius: 14, padding: '12px 14px',
        width: 120, flexShrink: 0, cursor: 'pointer', color: '#fff',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8, marginBottom: 4 }}>{day}</div>
        <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-ui)', lineHeight: 1, marginBottom: 8 }}>{num}</div>
        {recipes.length > 0 ? (
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9, lineHeight: 1.3 }}>
            {recipes.slice(0, 2).map(r => r.name).join(', ')}
            {recipes.length > 2 && ` +${recipes.length - 2}`}
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7 }}>Nothing planned</div>
        )}
      </div>
    )
  }

  return (
    <div onClick={onClick} style={{
      background: past ? 'transparent' : 'var(--elevated)',
      border: `1.5px ${past ? 'dashed' : 'solid'} var(--border)`,
      borderRadius: 14, padding: '12px 14px', width: 110,
      flexShrink: 0, cursor: 'pointer', opacity: past ? 0.5 : 1,
      boxShadow: past ? 'none' : 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg3)', marginBottom: 4 }}>{day}</div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--fg1)', lineHeight: 1, marginBottom: 8 }}>{num}</div>
      {recipes.length > 0 ? (
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg2)', lineHeight: 1.3 }}>
          {recipes[0].name}
          {recipes.length > 1 && <span style={{ color: 'var(--fg3)' }}> +{recipes.length - 1}</span>}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--fg3)' }}>Empty</div>
      )}
    </div>
  )
}

function CookbookPill({ category, active, onClick }) {
  const Icon = getCookbookIcon(category.id)
  const iconColor = active ? '#fff' : 'var(--fg2)'
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '10px 14px', borderRadius: 'var(--radius-full)',
      background: active ? 'var(--accent)' : 'var(--elevated)',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      cursor: 'pointer', flexShrink: 0, transition: 'all 0.12s',
    }}>
      <Icon size={20} color={iconColor} />
      <span style={{ fontSize: 11, fontWeight: 600, color: iconColor, fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>
        {category.label}
      </span>
    </button>
  )
}

function ImportSheet({ open, onClose }) {
  const navigate = useNavigate()
  const methods = [
    { icon: '✏️', label: 'Enter manually', desc: 'Type in all the details yourself', path: '/recipes/new?method=manual' },
    { icon: '🔗', label: 'Import from URL', desc: 'Paste a link to a recipe page', path: '/recipes/new?method=url' },
    { icon: '📷', label: 'Scan a photo', desc: 'Photo from your camera roll', path: '/recipes/new?method=photo' },
    { icon: '📹', label: 'Import from video', desc: 'YouTube, TikTok, Instagram', path: '/recipes/new?method=video' },
    { icon: '📸', label: 'Take a photo', desc: 'Use your camera now', path: '/recipes/new?method=camera' },
  ]
  return (
    <Sheet open={open} onClose={onClose} title="Add Recipe">
      <div style={{ padding: '8px 0 16px' }}>
        {methods.map(m => (
          <button key={m.label} onClick={() => { onClose(); navigate(m.path) }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 20px', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>{m.label}</div>
              <div style={{ fontSize: 13, color: 'var(--fg3)', marginTop: 2 }}>{m.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

function SectionHeader({ label, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', fontFamily: 'var(--font-ui)' }}>
        {label}
      </span>
      {action && (
        <button onClick={onAction} style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0 }}>
          {action}
        </button>
      )}
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [importOpen, setImportOpen] = useState(false)
  const [activeCookbook, setActiveCookbook] = useState(null)

  const { recipes, recipesLoading, shoppingChecked, shoppingTotal } = useAppData()
  const { getRecipesForDate } = useMealSlots()
  const dayScrollRef = useRef(null)
  const todayCardRef = useRef(null)

  const today = new Date()
  const weekStart = getWeekStart(today)
  const days = getWeekDays(weekStart)
  const todayStr = toDateString(today)

  useEffect(() => {
    const container = dayScrollRef.current
    const card = todayCardRef.current
    if (container && card) {
      container.scrollLeft = card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2
    }
  }, [])

  // Chef's Specials: seeded Mon–Sun so both phones see the same 3 recipes
  const mondaySeed = parseInt(toDateString(weekStart).replace(/-/g, '').slice(-5))
  const specials = recipes.length >= 3
    ? [...recipes].sort((a, b) => {
        // Deterministic pseudo-shuffle using the week seed
        const ha = (parseInt(a.id?.replace(/-/g, '').slice(0, 8), 16) || 1) * mondaySeed
        const hb = (parseInt(b.id?.replace(/-/g, '').slice(0, 8), 16) || 2) * mondaySeed
        return (ha % 997) - (hb % 997)
      }).slice(0, 3)
    : recipes.slice(0, 3)

  const fresh = [...recipes]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px) + 24px)` }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <Logo />
      </div>

      {/* Greeting */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 300, color: 'var(--fg1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {getGreeting()}.
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg2)', marginTop: 6, fontFamily: 'var(--font-ui)' }}>
          {formatLongDate(today)}
        </div>
      </div>

      {/* Day Scroller */}
      <div style={{ padding: '20px 0 0' }}>
        <div style={{ paddingLeft: 20, marginBottom: 10 }}>
          <SectionHeader label="This Week" action="Full plan ›" onAction={() => navigate('/plan')} />
        </div>
        <div ref={dayScrollRef} className="scroll-x" style={{ paddingLeft: 20, paddingRight: 20, display: 'flex', gap: 10 }}>
          <div onClick={() => navigate('/plan?view=archive')} style={{
            background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 14,
            padding: '12px 10px', width: 64, flexShrink: 0, cursor: 'pointer', opacity: 0.4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4, textAlign: 'center' }}>Past weeks</span>
          </div>
          {days.map(day => {
            const ds = toDateString(day)
            const isActiveDay = ds === todayStr
            return (
              <div key={ds} ref={isActiveDay ? todayCardRef : null} style={{ flexShrink: 0 }}>
                <DayCard
                  date={day}
                  recipes={getRecipesForDate(ds)}
                  active={isActiveDay}
                  past={isPast(day) && !isActiveDay}
                  onClick={() => navigate(`/plan?date=${ds}`)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Shopping List Widget */}
      <div style={{ padding: '20px 20px 0' }}>
        <div onClick={() => navigate('/shopping')} style={{
          background: 'var(--elevated)', borderRadius: 14, padding: '14px 16px',
          boxShadow: 'var(--shadow-md)', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>Shopping list</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>Open ›</span>
          </div>
          <div style={{ height: 4, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: `${shoppingTotal > 0 ? (shoppingChecked / shoppingTotal) * 100 : 0}%`,
              background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg2)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            {shoppingChecked} / {shoppingTotal} items
          </div>
        </div>
      </div>

      {/* Cookbooks */}
      <div style={{ padding: '20px 0 0' }}>
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          <SectionHeader label="Cookbooks" action="See all ›" onAction={() => navigate('/recipes')} />
        </div>
        <div className="scroll-x" style={{ paddingLeft: 20, paddingRight: 20, display: 'flex', gap: 10 }}>
          {COOKBOOK_CATEGORIES.map(cat => (
            <CookbookPill
              key={cat.id}
              category={cat}
              active={activeCookbook === cat.id}
              onClick={() => {
                setActiveCookbook(activeCookbook === cat.id ? null : cat.id)
                navigate(`/recipes?category=${cat.id}`)
              }}
            />
          ))}
        </div>
      </div>

      {/* Add Recipe */}
      <div style={{ padding: '20px 20px 0' }}>
        <Button variant="primary" fullWidth onClick={() => setImportOpen(true)}>
          + Add recipe
        </Button>
      </div>

      {/* Chef's Specials */}
      <div style={{ padding: '24px 0 0' }}>
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          <SectionHeader label="Chef's Specials" action="Resets Monday" />
        </div>
        <div className="scroll-x" style={{ paddingLeft: 20, paddingRight: 20, display: 'flex', gap: 12 }}>
          {recipesLoading
            ? Array.from({ length: 3 }, (_, i) => <RecipeCardSkeleton key={i} />)
            : specials.map(r => <RecipeCard key={r.id} recipe={r} />)
          }
        </div>
      </div>

      {/* Fresh Additions */}
      <div style={{ padding: '24px 0 0' }}>
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          <SectionHeader label="Fresh Additions" />
        </div>
        <div className="scroll-x" style={{ paddingLeft: 20, paddingRight: 20, display: 'flex', gap: 12 }}>
          {recipesLoading
            ? Array.from({ length: 3 }, (_, i) => <RecipeCardSkeleton key={i} />)
            : fresh.length > 0
              ? fresh.map(r => <RecipeCard key={r.id} recipe={r} />)
              : <div style={{ fontSize: 14, color: 'var(--fg3)', padding: '20px 0' }}>No recipes yet. Add your first one above.</div>
          }
        </div>
      </div>

      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
