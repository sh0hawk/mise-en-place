import { supabase } from './supabase'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const SPOONACULAR_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY

console.log('[recipeExtraction] module loaded — API key defined:', !!API_KEY, '— first 8 chars:', API_KEY?.slice(0, 8) ?? '(none)')
console.log('[recipeExtraction] Spoonacular key defined:', !!SPOONACULAR_KEY)

// ─── Spoonacular ───────────────────────────────────────────────────────────────

const DISH_TYPE_MAP = {
  'breakfast': 'Breakfast', 'brunch': 'Breakfast', 'morning meal': 'Breakfast',
  'lunch': 'Lunch',
  'dinner': 'Dinner', 'main course': 'Dinner', 'main dish': 'Dinner', 'supper': 'Dinner',
  'dessert': 'Desserts', 'sweet': 'Desserts',
  'appetizer': 'Appetizers', 'starter': 'Appetizers', 'antipasti': 'Appetizers', 'hor d\'oeuvre': 'Appetizers',
  'snack': 'Snacks', 'fingerfood': 'Snacks',
}

function mapSpoonacularToRecipe(data, originalUrl) {
  const categories = [...new Set(
    (data.dishTypes || []).map(t => DISH_TYPE_MAP[t.toLowerCase()]).filter(Boolean)
  )]

  const ingredients = (data.extendedIngredients || []).map(ing => ({
    quantity: ing.amount != null ? String(ing.amount) : '',
    unit: ing.unit || '',
    item: ing.nameClean || ing.name || '',
    notes: '',
  })).filter(i => i.item)

  const directions = (data.analyzedInstructions?.[0]?.steps || [])
    .map(s => ({ step: s.number, text: s.step }))
    .filter(d => d.text)

  const prep = data.preparationMinutes > 0 ? `${data.preparationMinutes} min` : ''
  const cook = data.cookingMinutes > 0
    ? `${data.cookingMinutes} min`
    : (data.readyInMinutes > 0 ? `${data.readyInMinutes} min` : '')

  return {
    name: data.title || '',
    categories,
    prep_time: prep,
    cook_time: cook,
    servings_base: data.servings || 2,
    yield: '',
    author_notes: '',
    serving_suggestions: '',
    source_label: data.sourceName || '',
    source_url: data.sourceUrl || originalUrl,
    photo_url: data.image || '',
    ingredients,
    directions,
  }
}

async function trySpoonacular(url) {
  if (!SPOONACULAR_KEY) throw new Error('No Spoonacular API key configured')
  const endpoint = `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(url)}&apiKey=${SPOONACULAR_KEY}&analyze=true&includeNutrition=false`
  console.log('[trySpoonacular] calling Spoonacular for url:', url)
  const res = await fetch(endpoint)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message || `Spoonacular API error ${res.status}`)
  }
  const data = await res.json()
  console.log('[trySpoonacular] response title:', data.title, '— ingredients count:', data.extendedIngredients?.length)
  if (!data.title || !data.extendedIngredients?.length) throw new Error('Spoonacular returned no recipe data')
  return { recipe: mapSpoonacularToRecipe(data, url), uncertainFields: [] }
}

// ─── Claude via Edge Function ─────────────────────────────────────────────────

async function callClaude(messages, system) {
  console.log('[callClaude] sending request — API key present:', !!API_KEY)
  const body = {
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages,
  }
  if (system) body.system = system

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  console.log('[callClaude] response status:', res.status, res.statusText)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[callClaude] API error body:', err)
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  console.log('[callClaude] raw response text (first 300 chars):', text.slice(0, 300))
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(clean)
  } catch (e) {
    console.error('[callClaude] JSON parse failed — clean text:', clean.slice(0, 500))
    throw new Error(`JSON parse error: ${e.message}`)
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseResult(raw) {
  const uncertainFields = raw.uncertain_fields || []
  const recipe = { ...raw }
  delete recipe.uncertain_fields
  return { recipe, uncertainFields }
}

async function extractViaEdgeFunction(url) {
  console.log('[extractViaEdgeFunction] calling Edge Function for url:', url)

  const { data, error } = await supabase.functions.invoke('fetch-recipe-url', {
    body: { url },
  })

  if (error) {
    console.error('[extractViaEdgeFunction] Edge Function error:', error)
    throw new Error(error.message || 'Failed to fetch page')
  }

  if (data?.error) {
    console.error('[extractViaEdgeFunction] Edge Function returned error:', data.error)
    throw new Error(data.error)
  }

  const pageText = data?.text || ''
  console.log('[extractViaEdgeFunction] page text length:', pageText.length, '— preview:', pageText.slice(0, 200))
  if (pageText.length < 100) throw new Error('Page appears empty or unreadable')

  const system = `You are a recipe extraction assistant. Extract the recipe from the provided webpage text and return ONLY a JSON object with no other text, no markdown, no backticks.

Return this exact structure:
{
  "name": "Recipe name",
  "categories": ["Dinner"],
  "ingredients": [{"quantity": "2", "unit": "cups", "item": "flour", "notes": "sifted"}],
  "directions": [{"step": 1, "text": "Preheat oven to 350°F"}],
  "prep_time": "15 min",
  "cook_time": "30 min",
  "servings_base": 4,
  "yield": "1 loaf",
  "author_notes": "Tips from the author if present",
  "serving_suggestions": "Serving ideas if present",
  "source_label": "Website or author name",
  "source_url": "${url}",
  "uncertain_fields": ["list any fields you're not confident about"]
}

Categories must be one or more of: Breakfast, Lunch, Dinner, Desserts, Appetizers, Snacks, Parties.
For ingredients without a unit (e.g. "2 eggs"), set unit to null.
If a field is not present in the recipe, set it to null.
Do not include author bios, ads, comments, or unrelated content.
Return ONLY the JSON object.`

  console.log('[extractViaEdgeFunction] calling Claude with', pageText.length, 'chars of page text')
  const raw = await callClaude([{ role: 'user', content: `Extract the recipe from this webpage:\n\n${pageText}` }], system)
  console.log('[extractViaEdgeFunction] Claude returned:', JSON.stringify(raw).slice(0, 300))
  if (!raw.name || !raw.ingredients?.length) throw new Error('No recipe found in page')
  const result = parseResult(raw)
  if (data?.imageUrl) result.recipe.photo_url = data.imageUrl
  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function extractFromUrl(url) {
  // Primary: Spoonacular structured extraction (fast, no LLM needed)
  if (SPOONACULAR_KEY) {
    try {
      return await trySpoonacular(url)
    } catch (err) {
      console.warn('[extractFromUrl] Spoonacular failed, falling back to Edge Function + Claude:', err.message)
    }
  }

  // Fallback: Edge Function fetches page HTML, Claude extracts recipe
  return extractViaEdgeFunction(url)
}

export async function extractFromPhoto(imageFile) {
  const base64 = await fileToBase64(imageFile)

  const raw = await callClaude([{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: imageFile.type, data: base64 },
      },
      {
        type: 'text',
        text: 'Extract the recipe from this image and return ONLY a JSON object with this structure: {"name":"","categories":[],"ingredients":[{"quantity":"","unit":"","item":"","notes":""}],"directions":[{"step":1,"text":""}],"prep_time":"","cook_time":"","servings_base":2,"yield":"","author_notes":"","serving_suggestions":"","source_label":"","source_url":"","uncertain_fields":[]}. Categories must be from: Breakfast, Lunch, Dinner, Desserts, Appetizers, Snacks, Parties. For ingredients without a unit set unit to null. If a field is absent set it to null. Return ONLY the JSON, no other text.',
      },
    ],
  }], null)

  if (!raw.name || !raw.ingredients?.length) throw new Error('No recipe found in image')
  return parseResult(raw)
}
