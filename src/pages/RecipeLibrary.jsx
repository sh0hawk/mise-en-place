import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchInput } from '../components/Input'
import { RecipeCard, RecipeCardSkeleton } from '../components/RecipeCard'
import { COOKBOOK_CATEGORIES } from '../lib/demo-data'
import { getCookbookIcon } from '../components/CookbookIcons'
import { useAppData } from '../lib/AppContext'

function RecipeListRow({ recipe, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
      cursor: 'pointer', background: 'var(--elevated)',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 10, flexShrink: 0,
        background: recipe.photo_url ? `url(${recipe.photo_url}) center/cover no-repeat` : 'var(--subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {!recipe.photo_url && '🍽'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400,
          color: 'var(--fg1)', lineHeight: 1.25, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {recipe.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>
          {recipe.categories?.join(' · ')}
          {recipe.prep_time && ` · ${recipe.prep_time} prep`}
        </div>
      </div>
      <span style={{ fontSize: 16, color: 'var(--fg3)', flexShrink: 0 }}>›</span>
    </div>
  )
}

export function RecipeLibrary() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [view, setView] = useState('list')

  const { recipes, recipesLoading } = useAppData()
  const activeCategory = searchParams.get('category') || null

  const filtered = recipes.filter(r => {
    const matchesCategory = !activeCategory || r.categories?.includes(activeCategory)
    const q = query.toLowerCase()
    const matchesSearch = !q ||
      r.name.toLowerCase().includes(q) ||
      r.categories?.some(c => c.toLowerCase().includes(q)) ||
      r.ingredients?.some(i => i.item?.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        background: 'var(--nav-bg)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg1)', fontFamily: 'var(--font-ui)' }}>Recipes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['grid', 'list']).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, background: view === v ? 'var(--accent-subtle)' : 'var(--subtle)',
                border: 'none', cursor: 'pointer', fontSize: 16,
              }}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>
        <SearchInput placeholder="Search recipes, ingredients…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {/* Category filter */}
      <div className="scroll-x" style={{
        display: 'flex', gap: 8, padding: '10px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0,
      }}>
        <button onClick={() => setSearchParams({})} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: !activeCategory ? 'var(--accent)' : 'var(--subtle)',
          color: !activeCategory ? '#fff' : 'var(--fg2)',
          border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-ui)',
        }}>
          All
        </button>
        {COOKBOOK_CATEGORIES.map(cat => {
          const Icon = getCookbookIcon(cat.id)
          const isActive = activeCategory === cat.id
          return (
            <button key={cat.id} onClick={() => setSearchParams({ category: cat.id })} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: isActive ? 'var(--accent)' : 'var(--subtle)',
              color: isActive ? '#fff' : 'var(--fg2)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-ui)',
            }}>
              <Icon size={14} color={isActive ? '#fff' : 'var(--fg2)'} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div className="scroll-y" style={{ flex: 1, paddingBottom: `calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))` }}>
        {recipesLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '12px 16px' }}>
            {Array.from({ length: 4 }, (_, i) => <RecipeCardSkeleton key={i} />)}
          </div>
        ) : view === 'list' ? (
          <div style={{ background: 'var(--elevated)', borderRadius: 14, margin: '12px 16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg3)', fontSize: 15 }}>
                {recipes.length === 0 ? 'No recipes yet — add your first one.' : 'No recipes match your search.'}
              </div>
            ) : filtered.map(r => (
              <RecipeListRow key={r.id} recipe={r} onClick={() => navigate(`/recipes/${r.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '12px 16px' }}>
            {filtered.map(r => <RecipeCard key={r.id} recipe={r} style={{ width: '100%' }} />)}
          </div>
        )}
      </div>
    </div>
  )
}
