const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

function stripHtml(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  for (const tag of ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript', 'figure']) {
    doc.querySelectorAll(tag).forEach(el => el.remove())
  }
  const main = doc.querySelector('main, article, [class*="recipe"], [id*="recipe"], [class*="wprm"], [class*="tasty"], [class*="content"]')
  const text = (main || doc.body).textContent || ''
  return text.replace(/\s+/g, ' ').trim().slice(0, 8000)
}

async function callClaude(messages, system) {
  const body = {
    model: 'claude-sonnet-4-20250514',
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean)
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

export async function extractFromUrl(url) {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
  const pageRes = await fetch(proxyUrl)
  if (!pageRes.ok) throw new Error(`Could not fetch page (${pageRes.status})`)
  const html = await pageRes.text()
  const pageText = stripHtml(html)
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

  const raw = await callClaude([{ role: 'user', content: `Extract the recipe from this webpage:\n\n${pageText}` }], system)
  if (!raw.name || !raw.ingredients?.length) throw new Error('No recipe found in page')
  return parseResult(raw)
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
