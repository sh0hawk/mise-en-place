import { useNavigate } from 'react-router-dom'

const CATEGORY_COLORS = {
  Breakfast: { bg: '#EAF2ED', fg: '#4A7C59' },
  Lunch:     { bg: '#FAF3E3', fg: '#B07D30' },
  Dinner:    { bg: '#F5E8E2', fg: '#C4633E' },
  Desserts:  { bg: '#FAE8E8', fg: '#B34040' },
  Appetizers:{ bg: '#E8EAF2', fg: '#3E4AC4' },
  Snacks:    { bg: '#F2EAF5', fg: '#7A3EC4' },
  Parties:   { bg: '#FAF0E3', fg: '#B07030' },
}

export function RecipeCard({ recipe, style }) {
  const navigate = useNavigate()
  const primaryCategory = recipe.categories?.[0] || 'Dinner'
  const colors = CATEGORY_COLORS[primaryCategory] || CATEGORY_COLORS.Dinner

  return (
    <div
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      style={{
        background: 'var(--elevated)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        width: 160,
        flexShrink: 0,
        cursor: 'pointer',
        ...style,
      }}
    >
      {/* Image area */}
      <div style={{
        height: 100,
        background: recipe.photo_url
          ? `url(${recipe.photo_url}) center/cover no-repeat`
          : 'var(--subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {!recipe.photo_url && (
          <span style={{ fontSize: 32, opacity: 0.4 }}>🍽</span>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}>
          {primaryCategory}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 400,
          color: 'var(--fg1)',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: 6,
        }}>
          {recipe.name}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--fg3)',
          fontFamily: 'var(--font-ui)',
        }}>
          {recipe.prep_time && `${recipe.prep_time} prep`}
          {recipe.prep_time && recipe.cook_time && ' · '}
          {recipe.cook_time && `${recipe.cook_time} cook`}
        </div>
      </div>
    </div>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div style={{
      background: 'var(--elevated)',
      borderRadius: 14,
      overflow: 'hidden',
      width: 160,
      flexShrink: 0,
    }}>
      <div style={{ height: 100, background: 'var(--subtle)' }} />
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ height: 10, width: 60, background: 'var(--subtle)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 16, width: '85%', background: 'var(--subtle)', borderRadius: 4, marginBottom: 4 }} />
        <div style={{ height: 11, width: '60%', background: 'var(--subtle)', borderRadius: 4 }} />
      </div>
    </div>
  )
}
