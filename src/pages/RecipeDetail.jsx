import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SegmentControl } from '../components/SegmentControl'
import { useAppData } from '../lib/AppContext'
import { formatQuantity } from '../lib/fractions'

function ScaleStepper({ scale, onChange }) {
  const steps = [0.5, 1, 1.5, 2, 3, 4]
  const idx = steps.indexOf(scale)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--subtle)', borderRadius: 'var(--radius-full)', padding: '6px 16px' }}>
      <button onClick={() => onChange(steps[Math.max(0, idx - 1)])} disabled={idx === 0} style={{
        width: 32, height: 32, borderRadius: '50%',
        background: idx === 0 ? 'transparent' : 'var(--elevated)',
        border: '1.5px solid var(--border)', cursor: idx === 0 ? 'default' : 'pointer',
        fontSize: 18, color: idx === 0 ? 'var(--fg3)' : 'var(--fg1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: idx === 0 ? 'none' : 'var(--shadow-sm)', flexShrink: 0,
      }}>−</button>
      <div style={{ textAlign: 'center', minWidth: 60 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-mono)' }}>×{scale}</div>
        <div style={{ fontSize: 11, color: 'var(--fg3)' }}>servings</div>
      </div>
      <button onClick={() => onChange(steps[Math.min(steps.length - 1, idx + 1)])} disabled={idx === steps.length - 1} style={{
        width: 32, height: 32, borderRadius: '50%',
        background: idx === steps.length - 1 ? 'transparent' : 'var(--elevated)',
        border: '1.5px solid var(--border)', cursor: idx === steps.length - 1 ? 'default' : 'pointer',
        fontSize: 18, color: idx === steps.length - 1 ? 'var(--fg3)' : 'var(--fg1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: idx === steps.length - 1 ? 'none' : 'var(--shadow-sm)', flexShrink: 0,
      }}>+</button>
    </div>
  )
}

export function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recipes, recipesLoading } = useAppData()
  const [tab, setTab] = useState('ingredients')
  const [scale, setScale] = useState(1)

  const recipe = recipes.find(r => r.id === id)

  if (recipesLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 14, color: 'var(--fg3)' }}>Loading…</div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg1)', marginBottom: 6 }}>Recipe not found</div>
          <button onClick={() => navigate('/recipes')} style={{ color: 'var(--accent)', fontSize: 15, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to recipes
          </button>
        </div>
      </div>
    )
  }

  const servings = Math.round((recipe.servings_base || 2) * scale)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Top Nav */}
      <div style={{
        padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        display: 'flex', alignItems: 'center',
        background: 'var(--nav-bg)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)',
        gap: 8, flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: 15, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0, flexShrink: 0 }}>
          ← Recipes
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={() => navigate(`/recipes/${id}/edit`)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0 }}>
          Edit
        </button>
      </div>

      <div className="scroll-y" style={{ flex: 1, paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))` }}>
        {/* Hero */}
        <div style={{
          height: 220, flexShrink: 0,
          background: recipe.photo_url ? `url(${recipe.photo_url}) center/cover no-repeat` : 'var(--subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!recipe.photo_url && <span style={{ fontSize: 56, opacity: 0.3 }}>🍽</span>}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {recipe.categories?.join(' · ')}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--fg1)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 }}>
            {recipe.name}
          </div>

          {/* Meta strip */}
          <div style={{ display: 'flex', background: 'var(--elevated)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
            {[
              { label: 'Prep', value: recipe.prep_time || '—' },
              { label: 'Cook', value: recipe.cook_time || '—' },
              { label: 'Serves', value: `${servings}` },
              recipe.yield ? { label: 'Yield', value: recipe.yield } : null,
            ].filter(Boolean).map((m, i, arr) => (
              <div key={m.label} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                <div style={{ fontSize: 10, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Scale */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>Scale recipe</span>
            <ScaleStepper scale={scale} onChange={setScale} />
          </div>

          {/* Nutrition */}
          {recipe.nutrition && (
            <div style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', marginBottom: 10 }}>
                Nutrition {recipe.nutrition.is_estimated && '(estimated)'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Calories', value: Math.round(recipe.nutrition.calories * scale), unit: 'kcal' },
                  { label: 'Protein', value: Math.round(recipe.nutrition.protein * scale), unit: 'g' },
                  { label: 'Fat', value: Math.round(recipe.nutrition.fat * scale), unit: 'g' },
                  { label: 'Carbs', value: Math.round(recipe.nutrition.carbs * scale), unit: 'g' },
                ].map(n => (
                  <div key={n.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--fg1)' }}>
                      {n.value}<span style={{ fontSize: 11, color: 'var(--fg3)', fontFamily: 'var(--font-ui)', marginLeft: 2 }}>{n.unit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 2 }}>{n.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <SegmentControl
            options={[{ value: 'ingredients', label: 'Ingredients' }, { value: 'directions', label: 'Directions' }]}
            value={tab}
            onChange={setTab}
            style={{ width: '100%', marginBottom: 16 }}
          />

          {/* Ingredients */}
          {tab === 'ingredients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(recipe.ingredients || []).map((ing, i, arr) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 8,
                  padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg2)', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
                    {formatQuantity(ing.quantity, scale)} {ing.unit}
                  </span>
                  <span style={{ fontSize: 15, color: 'var(--fg1)' }}>
                    {ing.item}
                    {ing.notes && <span style={{ color: 'var(--fg3)', fontSize: 13 }}> — {ing.notes}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Directions */}
          {tab === 'directions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
              {(recipe.directions || []).map((dir, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, flexShrink: 0, marginTop: 2,
                  }}>
                    {dir.step || i + 1}
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg1)', margin: 0, paddingTop: 4 }}>{dir.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Source + notes */}
          {(recipe.source_label || recipe.author_notes || recipe.serving_suggestions) && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {recipe.source_label && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', display: 'block', marginBottom: 4 }}>Source</span>
                  {recipe.source_url
                    ? <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: 'var(--accent)' }}>{recipe.source_label}</a>
                    : <span style={{ fontSize: 15, color: 'var(--fg2)' }}>{recipe.source_label}</span>
                  }
                </div>
              )}
              {recipe.author_notes && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', display: 'block', marginBottom: 4 }}>Notes</span>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg2)', margin: 0 }}>{recipe.author_notes}</p>
                </div>
              )}
              {recipe.serving_suggestions && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fg3)', display: 'block', marginBottom: 4 }}>Serving Suggestions</span>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg2)', margin: 0 }}>{recipe.serving_suggestions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
