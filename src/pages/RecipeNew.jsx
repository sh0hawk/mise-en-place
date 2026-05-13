import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Input, Textarea } from '../components/Input'
import { COOKBOOK_CATEGORIES } from '../lib/demo-data'
import { getCookbookIcon } from '../components/CookbookIcons'
import { useAppData } from '../lib/AppContext'
import { formatQuantity } from '../lib/fractions'
import { supabase } from '../lib/supabase'

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
  photo_url: '',
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
    photo_url:           ai.photo_url         || '',
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
  const { id: editId } = useParams()
  const isEditing = !!editId

  const aiRecipe        = location.state?.recipe
  const uncertainFields = location.state?.uncertainFields || []
  const isAIPrefilled   = !isEditing && !!aiRecipe && Object.keys(aiRecipe).length > 1

  const [recipe, setRecipe]             = useState(() => isAIPrefilled ? normalizeAIRecipe(aiRecipe) : BLANK_RECIPE)
  const [loading, setLoading]           = useState(isEditing)
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { addRecipe, editRecipe, removeRecipe, recipes } = useAppData()

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('recipe-photos').upload(path, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path)
      setField('photo_url', data.publicUrl)
    } catch (err) {
      console.error('photo upload', err)
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!isEditing) return
    const existing = recipes.find(r => r.id === editId)
    if (existing) {
      setRecipe(normalizeAIRecipe(existing))
      setLoading(false)
    }
  }, [isEditing, editId, recipes])

  function u(fieldKey) { return uncertainFields.includes(fieldKey) }

  function setField(key, value) {
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

  async function handleDelete() {
    if (!isEditing || deleting) return
    setDeleting(true)
    try {
      await removeRecipe(editId)
      navigate('/recipes', { replace: true })
    } catch (err) {
      console.error('handleDelete', err)
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  async function handleSave() {
    if (!recipe.name.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    const payload = {
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
      photo_url: recipe.photo_url || null,
      ingredients: recipe.ingredients.filter(i => i.item.trim()),
      directions: recipe.directions
        .filter(d => d.text.trim())
        .map((d, idx) => ({ ...d, step: idx + 1 })),
    }
    try {
      if (isEditing) {
        await editRecipe(editId, payload)
        navigate(`/recipes/${editId}`, { replace: true })
      } else {
        const saved = await addRecipe(payload)
        navigate(`/recipes/${saved.id}`, { replace: true })
      }
    } catch (err) {
      console.error('handleSave', err)
      setSaveError('Failed to save. Check your connection and try again.')
      setSaving(false)
    }
  }

  const canSave = !!recipe.name.trim() && !saving

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
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
          {isEditing ? 'Edit Recipe' : 'New Recipe'}
        </span>
        <div style={{ width: 48 }} />
      </div>

      <div className="scroll-y" style={{ flex: 1, paddingBottom: 100 }}>
        {isAIPrefilled && uncertainFields.length > 0 && (
          <div style={{
            margin: '12px 20px 0', padding: '10px 14px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-md)', fontSize: 13,
            color: '#92400E', lineHeight: 1.5, fontFamily: 'var(--font-ui)',
          }}>
            Amber dots mark fields Claude wasn't confident about — review before saving.
          </div>
        )}
        {saveError && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            {saveError}
          </div>
        )}

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Photo */}
            <div>
              <FieldLabel>Photo (optional)</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />
              <div
                onClick={() => !photoUploading && fileInputRef.current?.click()}
                style={{
                  height: 160, borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  cursor: photoUploading ? 'default' : 'pointer', position: 'relative',
                  background: recipe.photo_url
                    ? `url(${recipe.photo_url}) center/cover no-repeat`
                    : 'var(--subtle)',
                  border: recipe.photo_url ? 'none' : '2px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {recipe.photo_url ? (
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: 12, fontWeight: 600, padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-ui)',
                    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                  }}>
                    {photoUploading ? 'Uploading…' : 'Change photo'}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--fg3)', pointerEvents: 'none' }}>
                    {photoUploading ? (
                      <div style={{ fontSize: 14, fontFamily: 'var(--font-ui)' }}>Uploading…</div>
                    ) : (
                      <>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)' }}>Add photo</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

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

          </div>
        </div>

        {/* Delete section — edit mode only */}
        {isEditing && (
          <div style={{ padding: '24px 20px 8px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                style={{
                  width: '100%', padding: '14px',
                  background: '#FAE8E8', color: '#B34040',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-ui)',
                }}
              >
                Delete Recipe
              </button>
            ) : (
              <div style={{ background: '#FAE8E8', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                <p style={{
                  color: '#B34040', fontSize: 14, margin: '0 0 12px',
                  fontWeight: 500, fontFamily: 'var(--font-ui)',
                }}>
                  Delete this recipe? This can't be undone.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    style={{
                      flex: 1, padding: '10px',
                      background: 'var(--bg)', color: 'var(--fg1)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                      fontSize: 14, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'var(--font-ui)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      flex: 1, padding: '10px',
                      background: '#B34040', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-md)',
                      fontSize: 14, fontWeight: 600,
                      cursor: deleting ? 'default' : 'pointer',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed footer Save button */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        padding: '12px 20px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        zIndex: 50,
      }}>
        <Button variant="primary" fullWidth onClick={handleSave} disabled={!canSave}>
          {saving ? 'Saving…' : 'Save recipe'}
        </Button>
      </div>
    </div>
  )
}
