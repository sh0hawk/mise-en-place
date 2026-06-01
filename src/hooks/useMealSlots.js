import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  fetchMealSlotsByDateRange, insertMealSlot, deleteMealSlot,
  syncRecipeIngredientsAdd, syncRecipeIngredientsRemove,
} from '../lib/db'
import { useAppData } from '../lib/AppContext'
import { getWeekStart, toDateString } from '../lib/dates'

export function useMealSlots() {
  const { planId, listId, recipes, shoppingItems } = useAppData()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  // Stable date window: same 21 days shown in Plan.jsx (prev week + current + next).
  // Computed once at mount so the effect dependency array is stable.
  const [rangeStart, rangeEnd] = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pws = new Date(getWeekStart(today))
    pws.setDate(pws.getDate() - 7)
    const end = new Date(pws)
    end.setDate(end.getDate() + 20)
    return [toDateString(pws), toDateString(end)]
  }, [])

  useEffect(() => {
    let channel

    fetchMealSlotsByDateRange(rangeStart, rangeEnd)
      .then(data => { setSlots(data); setLoading(false) })
      .catch(err => { console.error('fetchMealSlots', err); setLoading(false) })

    // Subscribe to all meal_slots changes (no plan filter) so slots from any
    // plan — including the salvaged previous-week plan — stay in sync.
    channel = supabase
      .channel('meal_slots_window')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'meal_slots',
      }, () => {
        fetchMealSlotsByDateRange(rangeStart, rangeEnd).then(setSlots).catch(console.error)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [rangeStart, rangeEnd])

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
