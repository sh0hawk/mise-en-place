import { useState } from 'react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Sheet } from '../components/Sheet'
import { SHOPPING_CATEGORIES_ORDER } from '../lib/demo-data'
import { useAppData } from '../lib/AppContext'

function CheckIcon({ checked }) {
  if (checked) {
    return (
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--accent)', border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    )
  }
  return <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
}

function AddItemSheet({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState('Other')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onAdd({ ingredient: name.trim(), quantity: qty, unit, category })
      setName(''); setQty(''); setUnit(''); setCategory('Other')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Item">
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Item</label>
          <Input placeholder="e.g. Milk" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quantity</label>
            <Input placeholder="2" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit</label>
            <Input placeholder="cups" value={unit} onChange={e => setUnit(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%', background: 'var(--subtle)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '11px 14px',
              fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--fg1)', outline: 'none',
            }}
          >
            {SHOPPING_CATEGORIES_ORDER.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!name.trim() || submitting} style={{ marginTop: 4 }}>
          {submitting ? 'Adding…' : 'Add to list'}
        </Button>
      </div>
    </Sheet>
  )
}

export function Shopping() {
  const [addOpen, setAddOpen] = useState(false)
  const [showChecked, setShowChecked] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)

  const {
    shoppingItems,
    shoppingChecked,
    shoppingTotal,
    coreLoading,
    toggleShoppingItem,
    addShoppingItem,
    clearCheckedItems,
    clearAllItems,
  } = useAppData()

  async function handleClearAll() {
    await clearAllItems()
    setConfirmClear(false)
  }

  const grouped = SHOPPING_CATEGORIES_ORDER.reduce((acc, cat) => {
    const catItems = shoppingItems.filter(i => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})
  // Anything with an unrecognised category falls into Other
  const knownCats = new Set(SHOPPING_CATEGORIES_ORDER)
  const extraItems = shoppingItems.filter(i => !knownCats.has(i.category))
  if (extraItems.length > 0) grouped['Other'] = [...(grouped['Other'] || []), ...extraItems]

  const visibleItems = (list) => showChecked ? list : list.filter(i => !i.is_checked)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        background: 'var(--nav-bg)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>Shopping</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {confirmClear ? (
              <>
                <button onClick={() => setConfirmClear(false)} style={{
                  fontSize: 13, color: 'var(--fg2)', background: 'var(--subtle)',
                  border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
                }}>
                  Cancel
                </button>
                <button onClick={handleClearAll} style={{
                  fontSize: 13, color: '#B34040', background: '#FAE8E8',
                  border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600,
                }}>
                  Clear all
                </button>
              </>
            ) : (
              <>
                {shoppingChecked > 0 && (
                  <button onClick={clearCheckedItems} style={{
                    fontSize: 13, color: 'var(--error)', background: 'var(--error-bg)',
                    border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                    cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
                  }}>
                    Clear checked
                  </button>
                )}
                {shoppingTotal > 0 && (
                  <button onClick={() => setConfirmClear(true)} style={{
                    fontSize: 13, color: '#B34040', background: '#FAE8E8',
                    border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                    cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
                  }}>
                    Clear list
                  </button>
                )}
                <button onClick={() => setAddOpen(true)} style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 20, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  +
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%',
            width: `${shoppingTotal > 0 ? (shoppingChecked / shoppingTotal) * 100 : 0}%`,
            background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setShowChecked(!showChecked)} style={{
            fontSize: 12, color: 'var(--fg3)', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0,
          }}>
            {showChecked ? 'Hide' : 'Show'} checked
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg2)' }}>
            {shoppingChecked} / {shoppingTotal} items
          </span>
        </div>
      </div>

      {/* List */}
      <div className="scroll-y" style={{ flex: 1, paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))` }}>
        {coreLoading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg3)', fontSize: 14 }}>
            Loading…
          </div>
        ) : shoppingTotal === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg1)', marginBottom: 6 }}>Your list is empty</div>
            <div style={{ fontSize: 14, color: 'var(--fg3)' }}>Add meals to your plan, or tap + to add items manually.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => {
            const visible = visibleItems(catItems)
            if (visible.length === 0) return null
            return (
              <div key={cat}>
                <div style={{
                  padding: '14px 16px 6px', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: 'var(--fg3)', fontFamily: 'var(--font-ui)', background: 'var(--bg)',
                }}>
                  {cat}
                </div>
                <div style={{
                  background: 'var(--elevated)', margin: '0 16px',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                }}>
                  {visible.map((item, i) => (
                    <div key={item.id} onClick={() => toggleShoppingItem(item.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                      borderBottom: i < visible.length - 1 ? '1px solid #F0EDE8' : 'none',
                      cursor: 'pointer',
                    }}>
                      <CheckIcon checked={item.is_checked} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 15,
                          color: item.is_checked ? 'var(--fg3)' : 'var(--fg1)',
                          textDecoration: item.is_checked ? 'line-through' : 'none',
                          fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {item.ingredient}
                          {item.is_manual && (
                            <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>manual</span>
                          )}
                        </div>
                        {(item.quantity || item.unit) && (
                          <div style={{
                            fontSize: 12,
                            color: item.is_checked ? 'var(--fg3)' : 'var(--fg2)',
                            fontFamily: 'var(--font-mono)', marginTop: 2,
                          }}>
                            {[item.quantity, item.unit].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      <AddItemSheet open={addOpen} onClose={() => setAddOpen(false)} onAdd={addShoppingItem} />
    </div>
  )
}
