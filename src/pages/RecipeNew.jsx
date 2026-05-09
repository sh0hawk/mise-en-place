import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Input, Textarea } from '../components/Input'
import { COOKBOOK_CATEGORIES } from '../lib/demo-data'
import { getCookbookIcon } from '../components/CookbookIcons'
import { useAppData } from '../lib/AppContext'
import { formatQuantity } from '../lib/fractions'

const BLANK_RECIPE = {
  name: '',
  categories: [],
  prep_time: '',
  cook_time: '',
  servings_base: 2,
  yield: '',
  author_notes: '',
  serving_suggestions: '',
  source_label: '',
  source_url: '',
  ingredients: [{ quantity: '', unit: '', item: '', notes: '' }],
  directions: [{ step: 1, text: '' }],
}

const VALID_CATEGORY_IDS = new Set(COOKBOOK_CATEGORIES.map(c => c.id))

function normalizeAIRecipe(ai) {
  const categories = (ai.categories || [])
    .map(c => COOKBOOK_CATEGORIES.find(cat => cat.id === c || cat.label === c)?.id)
    .filter(Boolean)
    .filter(c => VALID_CATEGORY_IDS.has(c))

  const ingredients = (ai.ingredients || []).filter(i => i?.item)
  const directions  = (ai.directions  || []).filter(d => d?.text)

  return {
    name:                ai.name              || '',
    categories,
    prep_time:           ai.prep_time         || '',
    cook_time:           ai.cook_time         || '',
    servings_base:       Number(ai.servings_base) || 2,
    yield:               ai.yield             || '',
    author_notes:        ai.author_notes      || '',
    serving_suggestions: ai.serving_suggestions || '',
    source_label:        ai.source_label      || '',
    source_url:          ai.source_url        || '',
    ingredients: ingredients.length
      ? ingredients.map(i => ({
          quantity: i.quantity != null ? formatQuantity(String(i.quantity)) : '',
          unit:     i.unit  || '',
          item:     i.item  || '',
          notes:    i.notes || '',
        }))
      : BLANK_RECIPE.ingredients,
    directions: directions.length
      ? directions.map((d, idx) => ({ step: idx + 1, text: d.text || '' }))
      : BLANK_RECIPE.directions,
  }
}

function CategoryPicker({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {COOKBOOK_CATEGORIES.map(cat => {
        const active = selected.includes(cat.id)
        const Icon = getCookbookIcon(cat.id)
        const iconColor = active ? '#fff' : 'var(--fg2)'
        return (
          <button
            key={cat.id}
            onClick={() => onChange(
              active ? selected.filter(c => c !== cat.id) : [...selected, cat.id]
            )}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              background: active ? 'var(--accent)' : 'var(--subtle)',
              color: active ? '#fff' : 'var(--fg2)',
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <Icon size={15} color={iconColor} />
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

function IngredientRow({ ingredient, onChange, onRemove, canRemove }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <div style={{ width: 70, flexShrink: 0 }}>
        <Input
          placeholder="Qty"
          value={ingredient.quantity}
          onChange={e => onChange({ ...ingredient, quantity: e.target.value })}
          style={{ padding: '9px 10px', fontSize: 14 }}
        />
      </div>
      <div style={{ width: 70, flexShrink: 0 }}>
        <Input
          placeholder="Unit"
          value={ingredient.unit}
          onChange={e => onChange({ ...ingredient, unit: e.target.value })}
          style={{ padding: '9px 10px', fontSize: 14 }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <Input
          placeholder="Ingredient"
          value={ingredient.item}
          onChange={e => onChange({ ...ingredient, item: e.target.value })}
          style={{ padding: '9px 12px', fontSize: 14 }}
        />
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          style={{
            width: 36, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg3)', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}


function FieldLabel({ children, uncertain }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 600, color: 'var(--fg2)',
      marginBottom: 6, textTransform: 'uppercase',
      letterSpacing: '0.06em', fontFamily: 'var(--font-ui)',
    }}>
      {children}
      {uncertain && (
        <span
          title="Review this field"
          style={{
            display: 'inline-block', width: 7, height: 7,
            borderRadius: '50%', background: '#F59E0B', flexShrink: 0,
          }}
        />
      )}
    </label>
  )
}

export function RecipeNew() {
  const navigate = useNavigate()
  const location = useLocation()

  const aiRecipe        = location.state?.recipe
  const uncertainFields = location.state?.uncertainFields || []
  const isAIPrefilled   = !!aiRecipe && Object.keys(aiRecipe).length > 1

  const [recipe, setRecipe]           = useState(() => isAIPrefilled ? normalizeAIRecipe(aiRecipe) : BLANK_RECIPE)
  const [hasInteracted, setHasInteracted] = useState(!isAIPrefilled)
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState(null)
  const { addRecipe } = useAppData()

  function u(fieldKey) { return uncertainFields.includes(fieldKey) }

  function setField(key, value) {
    setHasInteracted(true)
    setRecipe(prev => ({ ...prev, [key]: value }))
  }

  function updateIngredient(i, value) {
    const next = [...recipe.ingredients]
    next[i] = value
    setField('ingredients', next)
  }

  function removeIngredient(i) {
    setField('ingredients', recipe.ingredients.filter((_, idx) => idx !== i))
  }

  function addIngredient() {
    setField('ingredients', [...recipe.ingredients, { quantity: '', unit: '', item: '', notes: '' }])
  }

  function updateDirection(i, text) {
    const next = [...recipe.directions]
    next[i] = { ...next[i], text }
    setField('directions', next)
  }

  function removeDirection(i) {
    setField('directions', recipe.directions
      .filter((_, idx) => idx !== i)
      .map((d, idx) => ({ ...d, step: idx + 1 }))
    )
  }

  function addDirection() {
    setField('directions', [...recipe.directions, { step: recipe.directions.length + 1, text: '' }])
  }

  async function handleSave() {
    if (!recipe.name.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await addRecipe({
        name: recipe.name.trim(),
        categories: recipe.categories,
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        servings_base: recipe.servings_base || null,
        yield: recipe.yield || null,
        author_notes: recipe.author_notes || null,
        serving_suggestions: recipe.serving_suggestions || null,
        source_label: recipe.source_label || null,
        source_url: recipe.source_url || null,
        ingredients: recipe.ingredients.filter(i => i.item.trim()),
        directions: recipe.directions
          .filter(d => d.text.trim())
          .map((d, idx) => ({ ...d, step: idx + 1 })),
      })
      navigate(`/recipes/${saved.id}`, { replace: true })
    } catch (err) {
      console.error('handleSave', err)
      setSaveError('Failed to save. Check your connection and try again.')
      setSaving(false)
    }
  }

  const canSave = recipe.name.trim() && !saving && hasInteracted

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Top Nav */}
      <div style={{
        padding: '14px 16px',
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: 15, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', padding: 0 }}
        >
          Cancel
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>
          New Recipe
        </span>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            fontSize: 15, fontWeight: 600,
            color: canSave ? 'var(--accent)' : 'var(--fg3)',
            background: 'none', border: 'none',
            cursor: canSave ? 'pointer' : 'default',
            fontFamily: 'var(--font-ui)', padding: 0,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="scroll-y" style={{ flex: 1, paddingBottom: 32 }}>
        {isAIPrefilled && !hasInteracted && (
          <div style={{
            margin: '12px 20px 0', padding: '10px 14px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-md)', fontSize: 13,
            color: '#92400E', lineHeight: 1.5, fontFamily: 'var(--font-ui)',
          }}>
            Review the extracted recipe — amber dots mark fields to double-check. Edit any field to enable Save.
          </div>
        )}
        {saveError && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            {saveError}
          </div>
        )}

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <FieldLabel uncertain={u('name')}>Recipe name *</FieldLabel>
              <Input
                placeholder="e.g. Shakshuka with Feta"
                value={recipe.name}
                onChange={e => setField('name', e.target.value)}
              />
            </div>

            {/* Categories */}
            <div>
              <FieldLabel uncertain={u('categories')}>Categories</FieldLabel>
              <CategoryPicker selected={recipe.categories} onChange={v => setField('categories', v)} />
            </div>

            {/* Timing */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel uncertain={u('prep_time')}>Prep time</FieldLabel>
                <Input placeholder="10 min" value={recipe.prep_time} onChange={e => setField('prep_time', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel uncertain={u('cook_time')}>Cook time</FieldLabel>
                <Input placeholder="20 min" value={recipe.cook_time} onChange={e => setField('cook_time', e.target.value)} />
              </div>
            </div>

            {/* Servings */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldLabel uncertain={u('servings_base')}>Servings</FieldLabel>
                <Input
                  type="number"
                  placeholder="2"
                  value={recipe.servings_base || ''}
                  onChange={e => setField('servings_base', parseInt(e.target.value) || 2)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldLabel uncertain={u('yield')}>Yield</FieldLabel>
                <Input placeholder="e.g. 12 cookies" value={recipe.yield} onChange={e => setField('yield', e.target.value)} />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <FieldLabel uncertain={u('ingredients')}>Ingredients</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recipe.ingredients.map((ing, i) => (
                  <IngredientRow
                    key={i}
                    ingredient={ing}
                    onChange={v => updateIngredient(i, v)}
                    onRemove={() => removeIngredient(i)}
                    canRemove={recipe.ingredients.length > 1}
                  />
                ))}
                <button
                  onClick={addIngredient}
                  style={{
                    textAlign: 'left', fontSize: 14, color: 'var(--accent)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 0', fontFamily: 'var(--font-ui)',
                  }}
                >
                  + Add ingredient
                </button>
              </div>
            </div>

            {/* Directions */}
            <div>
              <FieldLabel uncertain={u('directions')}>Directions</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recipe.directions.map((dir, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600, flexShrink: 0, marginTop: 10,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Textarea
                        placeholder={`Step ${i + 1}…`}
                        value={dir.text}
                        onChange={e => updateDirection(i, e.target.value)}
                        style={{ minHeight: 68 }}
                      />
                    </div>
                    {recipe.directions.length > 1 && (
                      <button
                        onClick={() => removeDirection(i)}
                        style={{
                          color: 'var(--fg3)', background: 'none', border: 'none',
                          cursor: 'pointer', fontSize: 18, marginTop: 10, flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addDirection}
                  style={{
                    textAlign: 'left', fontSize: 14, color: 'var(--accent)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 0', fontFamily: 'var(--font-ui)',
                  }}
                >
                  + Add step
                </button>
              </div>
            </div>

            {/* Source */}
            <div>
              <FieldLabel uncertain={u('source_label') || u('source_url')}>Source (optional)</FieldLabel>
              <Input
                placeholder="e.g. NYT Cooking"
                value={recipe.source_label}
                onChange={e => setField('source_label', e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <Input
                placeholder="https://…"
                value={recipe.source_url}
                onChange={e => setField('source_url', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <FieldLabel uncertain={u('author_notes')}>Author notes (optional)</FieldLabel>
              <Textarea
                placeholder="Tips, variations, substitutions…"
                value={recipe.author_notes}
                onChange={e => setField('author_notes', e.target.value)}
              />
            </div>

            {/* Serving suggestions */}
            <div>
              <FieldLabel uncertain={u('serving_suggestions')}>Serving suggestions (optional)</FieldLabel>
              <Textarea
                placeholder="How to serve…"
                value={recipe.serving_suggestions}
                onChange={e => setField('serving_suggestions', e.target.value)}
              />
            </div>

            <Button variant="primary" fullWidth onClick={handleSave} disabled={!canSave} style={{ marginTop: 8 }}>
              {saving ? 'Saving…' : 'Save recipe'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
