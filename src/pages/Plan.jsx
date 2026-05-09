import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sheet } from '../components/Sheet'
import { useAppData } from '../lib/AppContext'
import { useMealSlots } from '../hooks/useMealSlots'
import { getWeekStart, getWeekDays, toDateString, formatDay, isPast } from '../lib/dates'

const MEALTIMES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch',     label: 'Lunch',     icon: '☀️' },
  { id: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { id: 'dessert',   label: 'Dessert',   icon: '🍰' },
  { id: 'snack',     label: 'Snack',     icon: '🍎' },
]

function SlotCard({ mealtime, recipes, locked, onAdd, onRemove }) {
  const hasRecipes = recipes && recipes.length > 0

  if (!hasRecipes) {
    return (
      <div onClick={locked ? undefined : onAdd} style={{
        background: locked ? 'transparent' : 'var(--subtle)',
        border: '1.5px dashed var(--border)', borderRadius: 14,
        padding: '10px 12px', cursor: locked ? 'default' : 'pointer',
        minHeight: 64, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16, opacity: 0.5 }}>{mealtime.icon}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg3)' }}>{mealtime.label}</div>
          {!locked && <div style={{ fontSize: 13, color: 'var(--fg3)', marginTop: 2 }}>+ Add</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--elevated)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '10px 12px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{mealtime.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg3)' }}>{mealtime.label}</span>
        {!locked && (
          <button onClick={onAdd} style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            +
          </button>
        )}
      </div>
      {recipes.map(r => (
        <div key={r.slotId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg1)', flex: 1, fontFamily: 'var(--font-ui)' }}>{r.name}</span>
          {!locked && (
            <button onClick={() => onRemove(r.slotId)} style={{ fontSize: 14, color: 'var(--fg3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function AddRecipeSheet({ open, onClose, onSelect }) {
  const { recipes } = useAppData()
  const [query, setQuery] = useState('')
  const filtered = recipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <Sheet open={open} onClose={onClose} title="Choose a Recipe">
      <div style={{ padding: '12px 16px 0' }}>
        <input
          placeholder="Search recipes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', background: 'var(--subtle)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--fg1)', outline: 'none',
          }}
        />
      </div>
      <div style={{ padding: '8px 0 24px' }}>
        {filtered.map(r => (
          <button key={r.id} onClick={() => { onSelect(r); onClose() }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px', background: 'none', border: 'none',
            borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: 'var(--subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
            }}>
              🍽
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg1)' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>
                {r.categories?.join(', ')}
                {r.prep_time && ` · ${r.prep_time} prep`}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && recipes.length > 0 && (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--fg3)', fontSize: 15 }}>
            No recipes match "{query}"
          </div>
        )}
        {recipes.length === 0 && (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--fg3)', fontSize: 15 }}>
            No recipes yet — add one from the Home screen.
          </div>
        )}
      </div>
    </Sheet>
  )
}

export function Plan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [addingTo, setAddingTo] = useState(null)
  const [saving, setSaving] = useState(false)

  const { planId } = useAppData()
  const { getSlotsForDate, addSlot, removeSlot } = useMealSlots()

  const today = new Date()
  const weekStart = getWeekStart(today)
  const days = getWeekDays(weekStart)
  const todayStr = toDateString(today)

  const initialDate = searchParams.get('date') || todayStr
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const dayScrollRef = useRef(null)

  useEffect(() => {
    const idx = days.findIndex(d => toDateString(d) === todayStr)
    if (dayScrollRef.current && idx >= 0) {
      dayScrollRef.current.scrollLeft = (idx * 90) - 20
    }
  }, [])

  async function handleAddRecipe(recipe) {
    if (!addingTo) return
    setSaving(true)
    try {
      await addSlot(addingTo.date, addingTo.mealtime, recipe)
    } catch (_) {
      // error already logged
    } finally {
      setSaving(false)
    }
  }

  const selectedDay = days.find(d => toDateString(d) === selectedDate) || days[0]
  const dayPlan = getSlotsForDate(selectedDate)
  const locked = isPast(selectedDay) && selectedDate !== todayStr

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        background: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)', marginBottom: 12 }}>
          Meal Plan
        </div>
        {/* Day selector */}
        <div ref={dayScrollRef} className="scroll-x" style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
          <button onClick={() => navigate('/plan?view=archive')} style={{
            flexShrink: 0, padding: '8px 12px', borderRadius: 'var(--radius-full)',
            background: 'transparent', border: '1.5px dashed var(--border)',
            cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--fg3)',
            textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.5,
          }}>
            Past
          </button>
          {days.map(day => {
            const ds = toDateString(day)
            const active = ds === selectedDate
            const isToday_d = ds === todayStr
            const past = isPast(day) && !isToday_d
            return (
              <button key={ds} onClick={() => setSelectedDate(ds)} style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 'var(--radius-full)',
                background: active ? 'var(--accent)' : 'transparent',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', opacity: past ? 0.5 : 1,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? '#fff' : 'var(--fg3)', marginBottom: 2 }}>
                  {formatDay(day)}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: active ? '#fff' : 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>
                  {day.getDate()}
                </div>
                {isToday_d && !active && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', margin: '2px auto 0' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day Content */}
      <div className="scroll-y" style={{ flex: 1, padding: '16px 20px', paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px) + 16px)` }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--fg1)', letterSpacing: '-0.02em' }}>
            {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          {locked && <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>Read-only</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MEALTIMES.map(mt => (
            <SlotCard
              key={mt.id}
              mealtime={mt}
              recipes={dayPlan[mt.id] || []}
              locked={locked}
              onAdd={() => setAddingTo({ date: selectedDate, mealtime: mt.id })}
              onRemove={(slotId) => removeSlot(slotId)}
            />
          ))}
        </div>
      </div>

      <AddRecipeSheet
        open={!!addingTo}
        onClose={() => setAddingTo(null)}
        onSelect={handleAddRecipe}
      />
    </div>
  )
}
