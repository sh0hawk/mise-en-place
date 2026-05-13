import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import {
  fetchRecipes, insertRecipe, updateRecipe, deleteRecipe,
  getOrCreateCurrentPlan,
  getOrCreateShoppingList, fetchShoppingItems,
  insertShoppingItem, updateShoppingItemChecked, deleteShoppingItems,
  clearAllShoppingItems,
} from './db'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [recipes, setRecipes] = useState([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [shoppingList, setShoppingList] = useState(null)
  const [shoppingItems, setShoppingItems] = useState([])
  const [coreLoading, setCoreLoading] = useState(true)

  useEffect(() => {
    // Recipes load independently — pages render as soon as they're ready
    fetchRecipes()
      .then(data => { setRecipes(data); setRecipesLoading(false) })
      .catch(err => { console.error('fetchRecipes', err); setRecipesLoading(false) })
  }, [])

  useEffect(() => {
    let channel

    async function init() {
      try {
        const p = await getOrCreateCurrentPlan()
        setPlan(p)
        const list = await getOrCreateShoppingList(p.id)
        setShoppingList(list)
        const items = await fetchShoppingItems(list.id)
        setShoppingItems(items)
        setCoreLoading(false)

        channel = supabase
          .channel(`shopping:${list.id}`)
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'shopping_items',
            filter: `shopping_list_id=eq.${list.id}`,
          }, ({ new: row }) => {
            setShoppingItems(prev =>
              prev.find(i => i.id === row.id) ? prev : [...prev, row]
            )
          })
          .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'shopping_items',
            filter: `shopping_list_id=eq.${list.id}`,
          }, ({ new: row }) => {
            setShoppingItems(prev => prev.map(i => i.id === row.id ? row : i))
          })
          .on('postgres_changes', {
            event: 'DELETE', schema: 'public', table: 'shopping_items',
            filter: `shopping_list_id=eq.${list.id}`,
          }, ({ old: row }) => {
            setShoppingItems(prev => prev.filter(i => i.id !== row.id))
          })
          .subscribe()
      } catch (err) {
        console.error('AppProvider init', err)
        setCoreLoading(false)
      }
    }

    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const addRecipe = useCallback(async (recipe) => {
    const saved = await insertRecipe(recipe)
    setRecipes(prev => [saved, ...prev])
    return saved
  }, [])

  const editRecipe = useCallback(async (id, recipe) => {
    const saved = await updateRecipe(id, recipe)
    setRecipes(prev => prev.map(r => r.id === id ? saved : r))
    return saved
  }, [])

  const removeRecipe = useCallback(async (id) => {
    await deleteRecipe(id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }, [])

  const toggleShoppingItem = useCallback(async (id) => {
    const item = shoppingItems.find(i => i.id === id)
    if (!item) return
    const next = !item.is_checked
    // Optimistic
    setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: next } : i))
    try {
      await updateShoppingItemChecked(id, next)
    } catch (err) {
      // Revert
      setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !next } : i))
      console.error('toggleShoppingItem', err)
    }
  }, [shoppingItems])

  const addShoppingItem = useCallback(async ({ ingredient, quantity, unit, category }) => {
    if (!shoppingList) return
    const item = await insertShoppingItem({
      listId: shoppingList.id,
      ingredient, quantity, unit, category,
      isManual: true,
    })
    // Realtime will add it; add locally too in case of delay
    setShoppingItems(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item])
    return item
  }, [shoppingList])

  const clearCheckedItems = useCallback(async () => {
    const ids = shoppingItems.filter(i => i.is_checked).map(i => i.id)
    setShoppingItems(prev => prev.filter(i => !i.is_checked))
    try {
      await deleteShoppingItems(ids)
    } catch (err) {
      console.error('clearCheckedItems', err)
      if (shoppingList) fetchShoppingItems(shoppingList.id).then(setShoppingItems)
    }
  }, [shoppingItems, shoppingList])

  const clearAllItems = useCallback(async () => {
    if (!shoppingList) return
    setShoppingItems([])
    try {
      await clearAllShoppingItems(shoppingList.id)
    } catch (err) {
      console.error('clearAllItems', err)
      fetchShoppingItems(shoppingList.id).then(setShoppingItems)
    }
  }, [shoppingList])

  const shoppingChecked = shoppingItems.filter(i => i.is_checked).length
  const shoppingTotal = shoppingItems.length

  return (
    <AppContext.Provider value={{
      // Recipes
      recipes,
      recipesLoading,
      addRecipe,
      editRecipe,
      removeRecipe,
      // Plan
      plan,
      planId: plan?.id,
      coreLoading,
      // Shopping
      shoppingList,
      listId: shoppingList?.id,
      shoppingItems,
      shoppingChecked,
      shoppingTotal,
      toggleShoppingItem,
      addShoppingItem,
      clearCheckedItems,
      clearAllItems,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be inside AppProvider')
  return ctx
}
