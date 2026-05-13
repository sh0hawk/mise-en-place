import { supabase } from './supabase'
import { getWeekStart, toDateString } from './dates'

// ─── Recipes ────────────────────────────────────────────────────────────────

export async function fetchRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchRecipeById(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function insertRecipe(recipe) {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecipe(id, recipe) {
  const { data, error } = await supabase
    .from('recipes')
    .update(recipe)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

// ─── Meal plans ─────────────────────────────────────────────────────────────

export async function getOrCreateCurrentPlan() {
  const weekStart = toDateString(getWeekStart())

  const { data: existing, error: fetchErr } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('week_start', weekStart)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (existing) return existing

  const weekEnd = new Date(getWeekStart())
  weekEnd.setDate(weekEnd.getDate() + 6)

  const { data, error } = await supabase
    .from('meal_plans')
    .insert({ week_start: weekStart, week_end: toDateString(weekEnd), status: 'active' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Meal slots ──────────────────────────────────────────────────────────────

export async function fetchMealSlots(planId) {
  const { data, error } = await supabase
    .from('meal_slots')
    .select('*, recipe:recipe_id(id, name, categories, prep_time, cook_time, photo_url)')
    .eq('meal_plan_id', planId)
  if (error) throw error
  return data ?? []
}

export async function insertMealSlot({ planId, date, mealtime, recipeId, servingsScaled }) {
  const { data, error } = await supabase
    .from('meal_slots')
    .insert({ meal_plan_id: planId, date, mealtime, recipe_id: recipeId, servings_scaled: servingsScaled })
    .select('*, recipe:recipe_id(id, name, categories, prep_time, cook_time, photo_url)')
    .single()
  if (error) throw error
  return data
}

export async function deleteMealSlot(slotId) {
  const { error } = await supabase.from('meal_slots').delete().eq('id', slotId)
  if (error) throw error
}

// ─── Shopping lists ──────────────────────────────────────────────────────────

export async function getOrCreateShoppingList(planId) {
  const { data: existing, error: fetchErr } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('meal_plan_id', planId)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (existing) return existing

  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ meal_plan_id: planId })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Shopping items ──────────────────────────────────────────────────────────

export async function fetchShoppingItems(listId) {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('shopping_list_id', listId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertShoppingItem({ listId, ingredient, quantity, unit, category, isManual = false, sourceRecipeIds = [] }) {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({
      shopping_list_id: listId,
      ingredient,
      quantity: quantity || null,
      unit: unit || null,
      category,
      is_manual: isManual,
      source_recipe_ids: sourceRecipeIds,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateShoppingItemChecked(id, isChecked) {
  const { error } = await supabase
    .from('shopping_items')
    .update({ is_checked: isChecked })
    .eq('id', id)
  if (error) throw error
}

export async function deleteShoppingItems(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('shopping_items').delete().in('id', ids)
  if (error) throw error
}

// ─── Ingredient → shopping list ──────────────────────────────────────────────

function guessCategory(ingredient) {
  const s = ingredient.toLowerCase()
  if (/bread|sourdough|baguette|roll|loaf|bun|croissant|pita|tortilla|bagel/.test(s)) return 'Bakery'
  if (/\b(ham|salami|prosciutto|pancetta|smoked salmon|deli|turkey breast|roast beef)\b/.test(s)) return 'Deli'
  if (/frozen/.test(s)) return 'Frozen'
  if (/beer|wine|\bjuice\b|soda|kombucha/.test(s)) return 'Beverages'
  if (/chicken|beef|pork|lamb|\bfish\b|salmon|tuna|prawn|shrimp|mince|ground|steak|fillet|sausage|bacon/.test(s)) return 'Meat'
  if (/milk|cream|butter|yoghurt|yogurt|cheese|ricotta|mozzarella|cheddar|parmesan|feta|\begg\b|\beggs\b/.test(s)) return 'Dairy'
  if (/flour|sugar|baking|spice|cumin|paprika|\bsalt\b|\boil\b|vinegar|pasta|rice|canned|stock|sauce|honey|\boats\b|chia|maple|syrup|soy sauce|fish sauce|oyster sauce|nutmeg|vanilla|chilli|chili|seasoning/.test(s)) return 'Pantry'
  return 'Produce'
}

// Quantity helpers — kept local to db.js so the shopping sync doesn't depend on
// the UI fractions module.
const UNICODE_FRACS = { '½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875 }

function parseQty(str) {
  if (!str && str !== 0) return 0
  const s = String(str).trim()
  if (UNICODE_FRACS[s] !== undefined) return UNICODE_FRACS[s]
  const parts = s.split(/\s+/)
  if (parts.length === 2 && UNICODE_FRACS[parts[1]] !== undefined)
    return (parseFloat(parts[0]) || 0) + UNICODE_FRACS[parts[1]]
  if (s.includes('/')) { const [n, d] = s.split('/'); return parseFloat(n) / parseFloat(d) }
  return parseFloat(s) || 0
}

function formatQtyStr(num) {
  if (!num || num <= 0.001) return null
  const FRACS = { 0.5:'½',0.25:'¼',0.75:'¾',0.333:'⅓',0.667:'⅔',0.125:'⅛',0.375:'⅜',0.625:'⅝',0.875:'⅞' }
  const whole = Math.floor(num)
  const frac  = Math.round((num - whole) * 1000) / 1000
  let sym = ''; let minDiff = Infinity
  for (const [dec, s] of Object.entries(FRACS)) {
    const d = Math.abs(frac - parseFloat(dec))
    if (d < 0.05 && d < minDiff) { minDiff = d; sym = s }
  }
  if (sym) return whole > 0 ? `${whole} ${sym}` : sym
  return String(Math.round(num * 100) / 100).replace(/\.?0+$/, '')
}

// Add a recipe's ingredients to the shopping list, consolidating with existing rows
// rather than creating duplicates. currentItems = current shopping_items for the list.
export async function syncRecipeIngredientsAdd(listId, recipe, currentItems) {
  if (!recipe.ingredients?.length) return

  const toInsert = []
  const toUpdate = [] // { id, quantity, source_recipe_ids }

  for (const ing of recipe.ingredients) {
    if (!ing.item?.trim()) continue
    const name = ing.item.trim().toLowerCase()
    const unit = (ing.unit || '').toLowerCase()

    // Match by ingredient name. Skip rows that already list this recipe
    // (same recipe added to multiple days → treated as separate entries).
    const existing = currentItems.find(item =>
      item.ingredient.toLowerCase() === name &&
      !(item.source_recipe_ids || []).includes(recipe.id)
    )

    if (existing) {
      const existingUnit = (existing.unit || '').toLowerCase()
      let newQty = existing.quantity
      if (existingUnit === unit && existing.quantity && ing.quantity) {
        const sum = parseQty(existing.quantity) + parseQty(ing.quantity)
        newQty = formatQtyStr(sum) ?? existing.quantity
      } else if (!existing.quantity && ing.quantity) {
        newQty = ing.quantity
      }
      toUpdate.push({
        id: existing.id,
        quantity: newQty,
        source_recipe_ids: [...(existing.source_recipe_ids || []), recipe.id],
      })
    } else {
      toInsert.push({
        shopping_list_id: listId,
        ingredient: ing.item.trim(),
        quantity: ing.quantity || null,
        unit: ing.unit || null,
        category: guessCategory(ing.item),
        is_manual: false,
        source_recipe_ids: [recipe.id],
      })
    }
  }

  for (const upd of toUpdate) {
    const { error } = await supabase.from('shopping_items')
      .update({ quantity: upd.quantity, source_recipe_ids: upd.source_recipe_ids })
      .eq('id', upd.id)
    if (error) console.error('syncRecipeIngredientsAdd update', error)
  }

  if (toInsert.length) {
    const { error } = await supabase.from('shopping_items').insert(toInsert)
    if (error) console.error('syncRecipeIngredientsAdd insert', error)
  }
}

// Remove a recipe's ingredient contributions from the shopping list.
// Items used only by this recipe are deleted; items shared with other recipes
// have their quantity reduced and source_recipe_ids updated.
export async function syncRecipeIngredientsRemove(recipe, currentItems) {
  if (!recipe?.ingredients?.length) return

  const affected = currentItems.filter(item =>
    Array.isArray(item.source_recipe_ids) && item.source_recipe_ids.includes(recipe.id)
  )
  if (!affected.length) return

  const toDelete = []
  const toUpdate = []

  for (const item of affected) {
    const newSourceIds = item.source_recipe_ids.filter(id => id !== recipe.id)
    const removedIng = recipe.ingredients.find(i =>
      (i.item || '').trim().toLowerCase() === item.ingredient.toLowerCase()
    )

    if (newSourceIds.length === 0 && !item.is_manual) {
      toDelete.push(item.id)
    } else {
      let newQty = item.quantity
      if (removedIng?.quantity && item.quantity) {
        const sameUnit = (item.unit || '').toLowerCase() === (removedIng.unit || '').toLowerCase()
        if (sameUnit) {
          const reduced = parseQty(item.quantity) - parseQty(removedIng.quantity)
          newQty = formatQtyStr(reduced)
        }
      }
      toUpdate.push({ id: item.id, quantity: newQty, source_recipe_ids: newSourceIds })
    }
  }

  if (toDelete.length) {
    const { error } = await supabase.from('shopping_items').delete().in('id', toDelete)
    if (error) console.error('syncRecipeIngredientsRemove delete', error)
  }

  for (const upd of toUpdate) {
    const { error } = await supabase.from('shopping_items')
      .update({ quantity: upd.quantity, source_recipe_ids: upd.source_recipe_ids })
      .eq('id', upd.id)
    if (error) console.error('syncRecipeIngredientsRemove update', error)
  }
}

// Delete every item in a shopping list (used by "Clear list").
export async function clearAllShoppingItems(listId) {
  const { error } = await supabase.from('shopping_items').delete().eq('shopping_list_id', listId)
  if (error) throw error
}
