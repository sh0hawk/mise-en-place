import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMealSlots, insertMealSlot, deleteMealSlot, appendRecipeIngredients } from '../lib/db'
import { useAppData } from '../lib/AppContext'

export function useMealSlots() {
  const { planId, listId, recipes } = useAppData()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!planId) return
    let channel

    fetchMealSlots(planId)
      .then(data => { setSlots(data); setLoading(false) })
      .catch(err => { console.error('fetchMealSlots', err); setLoading(false) })

    channel = supabase
      .channel(`meal_slots:${planId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'meal_slots',
        filter: `meal_plan_id=eq.${planId}`,
      }, () => {
        // Re-fetch on any change: INSERT needs the recipe join, DELETE is simpler
        // but re-fetching is the safest way to keep state consistent with joins
        fetchMealSlots(planId).then(setSlots).catch(console.error)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [planId])

  const addSlot = useCallback(async (date, mealtime, recipe) => {
    if (!planId) return

    const tempId = `temp_${Date.now()}`
    const tempSlot = {
      id: tempId, meal_plan_id: planId,
      date, mealtime, recipe_id: recipe.id,
      recipe: { id: recipe.id, name: recipe.name, categories: recipe.categories },
    }
    // Optimistic insert
    setSlots(prev => [...prev, tempSlot])

    try {
      const realSlot = await insertMealSlot({ planId, date, mealtime, recipeId: recipe.id })
      setSlots(prev => prev.map(s => s.id === tempId ? realSlot : s))

      // Append recipe ingredients to shopping list (best-effort, don't block)
      if (listId) {
        const fullRecipe = recipes.find(r => r.id === recipe.id)
        if (fullRecipe?.ingredients?.length) {
          appendRecipeIngredients(listId, fullRecipe).catch(console.error)
        }
      }
    } catch (err) {
      setSlots(prev => prev.filter(s => s.id !== tempId))
      console.error('addSlot', err)
      throw err
    }
  }, [planId, listId, recipes])

  const removeSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
    try {
      await deleteMealSlot(slotId)
    } catch (err) {
      if (snapshot) setSlots(prev => [...prev, snapshot])
      console.error('removeSlot', err)
      throw err
    }
  }, [slots])

  // Returns { breakfast: [recipe, ...], lunch: [...], ... } for a given date string
  function getSlotsForDate(dateStr) {
    return slots
      .filter(s => s.date === dateStr)
      .reduce((acc, s) => {
        const mt = s.mealtime
        if (!acc[mt]) acc[mt] = []
        acc[mt].push({ ...s.recipe, slotId: s.id })
        return acc
      }, {})
  }

  // Returns flat list of recipes planned on a date (any mealtime)
  function getRecipesForDate(dateStr) {
    return slots
      .filter(s => s.date === dateStr && s.recipe)
      .map(s => s.recipe)
  }

  return { slots, loading, addSlot, removeSlot, getSlotsForDate, getRecipesForDate }
}
