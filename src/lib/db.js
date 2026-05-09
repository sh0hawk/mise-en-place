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

export async function appendRecipeIngredients(listId, recipe) {
  if (!recipe.ingredients?.length) return
  const rows = recipe.ingredients.map(ing => ({
    shopping_list_id: listId,
    ingredient: ing.item,
    quantity: ing.quantity || null,
    unit: ing.unit || null,
    category: guessCategory(ing.item),
    is_manual: false,
    source_recipe_ids: [recipe.id],
  }))
  const { error } = await supabase.from('shopping_items').insert(rows)
  if (error) throw error
}
