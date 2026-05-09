const FRACTIONS = {
  0.25: '¼', 0.5: '½', 0.75: '¾',
  0.125: '⅛', 0.375: '⅜', 0.625: '⅝', 0.875: '⅞',
  0.333: '⅓', 0.667: '⅔',
}

export function formatQuantity(raw, scale = 1) {
  if (!raw) return ''
  const str = String(raw).trim()

  // Parse the raw quantity
  let value
  if (str.includes('/')) {
    const [num, den] = str.split('/')
    value = parseFloat(num) / parseFloat(den)
  } else if (Object.values(FRACTIONS).some(f => str.startsWith(f))) {
    const entry = Object.entries(FRACTIONS).find(([, sym]) => str.startsWith(sym))
    if (entry) {
      const rest = str.slice(entry[1].length).trim()
      value = parseFloat(entry[0]) + (rest ? parseFloat(rest) : 0)
    }
  } else {
    value = parseFloat(str)
  }

  if (isNaN(value)) return str

  value *= scale

  const whole = Math.floor(value)
  const frac = Math.round((value - whole) * 1000) / 1000

  // Find closest fraction symbol
  let fracStr = ''
  let minDiff = Infinity
  for (const [dec, sym] of Object.entries(FRACTIONS)) {
    const diff = Math.abs(frac - parseFloat(dec))
    if (diff < minDiff && diff < 0.05) {
      minDiff = diff
      fracStr = sym
    }
  }

  if (fracStr) {
    return whole > 0 ? `${whole} ${fracStr}` : fracStr
  }

  // Round to 2 decimal places and trim trailing zeros
  const rounded = Math.round(value * 100) / 100
  return String(rounded).replace(/\.?0+$/, '')
}
