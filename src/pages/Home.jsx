import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractFromUrl, extractFromPhoto } from '../lib/recipeExtraction'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { RecipeCard, RecipeCardSkeleton } from '../components/RecipeCard'
import { Sheet } from '../components/Sheet'
import { COOKBOOK_CATEGORIES } from '../lib/demo-data'
import { getCookbookIcon, getCookbookColor } from '../components/CookbookIcons'
import { useAppData } from '../lib/AppContext'
import { useMealSlots } from '../hooks/useMealSlots'
import {
  getGreeting, formatLongDate, getWeekDays, getWeekStart,
  isToday, isPast, toDateString,
} from '../lib/dates'

function DayCard({ date, recipes = [], active, past, onClick }) {
  const touchStartX = useRef(null)
  const didScroll = useRef(false)

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    didScroll.current = false
  }

  function handleTouchMove(e) {
    if (touchStartX.current !== null && Math.abs(e.touches[0].clientX - touchStartX.current) > 8) {
      didScroll.current = true
    }
  }

  function handleClick() {
    if (didScroll.current) return
    onClick?.()
  }

  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  const num = date.getDate()

  if (active) {
    return (
      <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onClick={handleClick} style={{
        background: 'var(--accent)', borderRadius: 14, padding: '12px 14px',
        width: 120, flexShrink: 0, cursor: 'pointer', color: '#fff',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8, marginBottom: 4 }}>{day} · NOW</div>
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
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onClick={handleClick} style={{
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
  const iconColor = active ? '#fff' : getCookbookColor(category.id)
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      width: 64, flexShrink: 0,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: active ? 'var(--accent)' : 'var(--subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s',
      }}>
        <Icon size={22} color={iconColor} />
      </div>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: active ? 'var(--accent)' : 'var(--fg2)',
        fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
      }}>
        {category.label}
      </span>
    </button>
  )
}

function IconPencil() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconLink() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconImage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#A8A29E" strokeWidth="1.75" strokeLinejoin="round"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="#A8A29E" strokeWidth="1.5"/>
      <path d="M21 15l-5-5L5 21" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="#A8A29E" strokeWidth="1.75"/>
      <path d="M10 8l6 4-6 4V8z" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#A8A29E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="4" stroke="#A8A29E" strokeWidth="1.75"/>
    </svg>
  )
}

const URL_MSGS   = ['Fetching recipe…', 'Reading ingredients…', 'Almost done…']
const PHOTO_MSGS = ['Reading your photo…', 'Identifying ingredients…', 'Almost done…']

function SheetSpinner() {
  return (
    <div style={{
      width: 28, height: 28,
      border: '2.5px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
      margin: '0 auto 16px',
    }} />
  )
}

function ImportSheet({ open, onClose }) {
  const navigate = useNavigate()
  const [view, setView] = useState('list')
  const [urlValue, setUrlValue] = useState('')
  const [loadingMode, setLoadingMode] = useState('url')
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) { setView('list'); setUrlValue(''); setErrorMsg(''); setLoadingMsgIdx(0) }
  }, [open])

  const loadingMsgs = loadingMode === 'url' ? URL_MSGS : PHOTO_MSGS

  useEffect(() => {
    if (view !== 'loading') return
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % loadingMsgs.length), 2000)
    return () => clearInterval(id)
  }, [view, loadingMsgs.length])

  async function runUrlExtraction(url) {
    setLoadingMode('url'); setLoadingMsgIdx(0); setFallbackUrl(url); setView('loading')
    try {
      const { recipe, uncertainFields } = await extractFromUrl(url)
      onClose()
      navigate('/recipes/new', { state: { recipe, uncertainFields } })
    } catch {
      setErrorMsg("We couldn't extract a recipe from that URL. The page may be paywalled or the recipe format wasn't recognized.")
      setView('error')
    }
  }

  function handleUrlPaste(e) {
    const text = e.clipboardData.getData('text').trim()
    if (/^https?:\/\//i.test(text)) {
      e.preventDefault()
      setUrlValue(text)
      runUrlExtraction(text)
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setLoadingMode('photo'); setLoadingMsgIdx(0); setFallbackUrl(''); setView('loading')
    try {
      const { recipe, uncertainFields } = await extractFromPhoto(file)
      onClose()
      navigate('/recipes/new', { state: { recipe, uncertainFields } })
    } catch {
      setErrorMsg("We couldn't read a recipe from that photo. Try a clearer image or enter the recipe manually.")
      setView('error')
    }
  }

  function switchToManual() {
    onClose()
    navigate('/recipes/new', { state: { recipe: { source_url: fallbackUrl }, uncertainFields: [] } })
  }

  const rowStyle = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 20px', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)',
  }
  const labelStyle = { fontSize: 15, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }
  const descStyle  = { fontSize: 13, color: 'var(--fg3)', marginTop: 2 }

  let body
  if (view === 'list') {
    body = (
      <div style={{ padding: '8px 0 16px' }}>
        <button style={rowStyle} onClick={() => { onClose(); navigate('/recipes/new') }}>
          <IconPencil />
          <div><div style={labelStyle}>Enter manually</div><div style={descStyle}>Type in all the details yourself</div></div>
        </button>
        <button style={rowStyle} onClick={() => setView('url-input')}>
          <IconLink />
          <div><div style={labelStyle}>Import from URL</div><div style={descStyle}>Paste a link to a recipe page</div></div>
        </button>
        <button style={rowStyle} onClick={() => fileInputRef.current?.click()}>
          <IconImage />
          <div><div style={labelStyle}>Scan a photo</div><div style={descStyle}>Photo from your camera roll</div></div>
        </button>
        <button style={{ ...rowStyle, opacity: 0.5, cursor: 'default', borderBottom: 'none' }}>
          <IconPlay />
          <div><div style={labelStyle}>Import from video</div><div style={descStyle}>Coming soon</div></div>
        </button>
      </div>
    )
  } else if (view === 'url-input') {
    body = (
      <div style={{ padding: '16px 20px 28px' }}>
        <button
          onClick={() => setView('list')}
          style={{ fontSize: 14, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px', fontFamily: 'var(--font-ui)' }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg1)', marginBottom: 12, fontFamily: 'var(--font-ui)' }}>
          Paste a recipe URL
        </div>
        <input
          type="url"
          inputMode="url"
          autoFocus
          placeholder="https://…"
          value={urlValue}
          onChange={e => setUrlValue(e.target.value)}
          onPaste={handleUrlPaste}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '11px 14px', fontSize: 15,
            background: 'var(--subtle)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-md)', color: 'var(--fg1)',
            fontFamily: 'var(--font-ui)', outline: 'none',
            marginBottom: 12,
          }}
        />
        <button
          onClick={() => runUrlExtraction(urlValue)}
          disabled={!/^https?:\/\//i.test(urlValue)}
          style={{
            width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
            background: /^https?:\/\//i.test(urlValue) ? 'var(--accent)' : 'var(--border)',
            color: '#fff', border: 'none', cursor: /^https?:\/\//i.test(urlValue) ? 'pointer' : 'default',
            fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-ui)',
          }}
        >
          Extract recipe
        </button>
      </div>
    )
  } else if (view === 'loading') {
    body = (
      <div style={{ padding: '48px 20px', textAlign: 'center' }}>
        <SheetSpinner />
        <div style={{ fontSize: 15, color: 'var(--fg2)', fontFamily: 'var(--font-ui)' }}>
          {loadingMsgs[loadingMsgIdx]}
        </div>
      </div>
    )
  } else if (view === 'error') {
    body = (
      <div style={{ padding: '24px 20px 32px' }}>
        <div style={{
          background: 'var(--error-bg)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', fontSize: 14, color: 'var(--error)',
          lineHeight: 1.5, marginBottom: 20,
        }}>
          {errorMsg}
        </div>
        <button
          onClick={switchToManual}
          style={{ fontSize: 15, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'block', marginBottom: 12 }}
        >
          Switch to manual entry →
        </button>
        {loadingMode === 'url' && (
          <button
            onClick={() => setView('url-input')}
            style={{ fontSize: 15, color: 'var(--fg2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
          >
            Try a different URL →
          </button>
        )}
      </div>
    )
  }

  return (
    <Sheet open={open} onClose={view === 'loading' ? undefined : onClose} title="Add Recipe">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
      {body}
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
  const nextWeekStart = new Date(weekStart)
  nextWeekStart.setDate(nextWeekStart.getDate() + 7)
  const days = [...getWeekDays(weekStart), ...getWeekDays(nextWeekStart)]
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
          <SectionHeader label="This Week" />
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
          <div onClick={() => navigate(`/plan?date=${toDateString(nextWeekStart)}`)} style={{
            background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 14,
            padding: '12px 10px', width: 64, flexShrink: 0, cursor: 'pointer', opacity: 0.4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4, textAlign: 'center' }}>Next Week ›</span>
          </div>
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
        <div className="scroll-x" style={{ paddingLeft: 16, paddingRight: 16, display: 'flex', gap: 10 }}>
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
          {recipesLoading || recipes.length < 3
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
