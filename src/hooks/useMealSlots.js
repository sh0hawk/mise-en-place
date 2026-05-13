import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  fetchMealSlots, insertMealSlot, deleteMealSlot,
  syncRecipeIngredientsAdd, syncRecipeIngredientsRemove,
} from '../lib/db'
import { useAppData } from '../lib/AppContext'

export function useMealSlots() {
  const { planId, listId, recipes, shoppingItems } = useAppData()
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
    setSlots(prev => [...prev, tempSlot])

    try {
      const realSlot = await insertMealSlot({ planId, date, mealtime, recipeId: recipe.id })
      setSlots(prev => prev.map(s => s.id === tempId ? realSlot : s))

      if (listId) {
        const fullRecipe = recipes.find(r => r.id === recipe.id)
        if (fullRecipe?.ingredients?.length) {
          // Consolidate: match by ingredient name, sum quantities, update existing rows
          syncRecipeIngredientsAdd(listId, fullRecipe, shoppingItems).catch(console.error)
        }
      }
    } catch (err) {
      setSlots(prev => prev.filter(s => s.id !== tempId))
      console.error('addSlot', err)
      throw err
    }
  }, [planId, listId, recipes, shoppingItems])

  const removeSlot = useCallback(async (slotId) => {
    const snapshot = slots.find(s => s.id === slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
    try {
      await deleteMealSlot(slotId)

      // Clean up shopping list: remove ingredients that came solely from this recipe,
      // reduce quantities for ingredients shared with other recipes still in the plan.
      if (listId && snapshot) {
        const fullRecipe = recipes.find(r => r.id === snapshot.recipe_id)
        if (fullRecipe) {
          syncRecipeIngredientsRemove(fullRecipe, shoppingItems).catch(console.error)
        }
      }
    } catch (err) {
      if (snapshot) setSlots(prev => [...prev, snapshot])
      console.error('removeSlot', err)
      throw err
    }
  }, [slots, listId, recipes, shoppingItems])

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

  function getRecipesForDate(dateStr) {
    return slots
      .filter(s => s.date === dateStr && s.recipe)
      .map(s => s.recipe)
  }

  return { slots, loading, addSlot, removeSlot, getSlotsForDate, getRecipesForDate }
}
