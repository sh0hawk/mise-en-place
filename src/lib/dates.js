export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day  // Monday-based week
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDay(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function formatDayFull(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isToday(date) {
  const today = new Date()
  return toDateString(date) === toDateString(today)
}

export function isPast(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatLongDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
