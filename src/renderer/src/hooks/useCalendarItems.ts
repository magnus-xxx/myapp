import { useState, useEffect, useCallback } from 'react'
import { CalendarItem, ItemType, ItemDomain } from '../../../shared/types'

interface CalendarItemsFilter {
  startDate?: string
  endDate?: string
  domains?: ItemDomain[]
  types?: ItemType[]
  projectId?: string
  status?: string
}

interface UseCalendarItemsReturn {
  items: CalendarItem[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  createItem: (data: Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarItem | null>
  updateItem: (id: string, updates: Partial<Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>>) => Promise<CalendarItem | null>
  deleteItem: (id: string) => Promise<boolean>
}

/**
 * React hook for managing calendar items with filtering and CRUD operations
 * 
 * @param filter - Optional filter criteria for fetching items
 * @returns Object containing items, loading state, error, and CRUD functions
 * 
 * @example
 * ```tsx
 * const { items, loading, refresh } = useCalendarItems({ 
 *   domains: ['work'] 
 * })
 * ```
 */
export function useCalendarItems(filter?: CalendarItemsFilter): UseCalendarItemsReturn {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fetchedItems = await window.api.calendar.getCalendarItems(filter)
      setItems(fetchedItems)
    } catch (err) {
      console.error('[useCalendarItems] Error fetching items:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch calendar items'))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const refresh = useCallback(async () => {
    await fetchItems()
  }, [fetchItems])

  const createItem = useCallback(async (
    data: Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CalendarItem | null> => {
    try {
      const newItem = await window.api.calendar.createCalendarItem(data)
      await refresh()
      return newItem
    } catch (err) {
      console.error('[useCalendarItems] Error creating item:', err)
      setError(err instanceof Error ? err : new Error('Failed to create item'))
      return null
    }
  }, [refresh])

  const updateItem = useCallback(async (
    id: string,
    updates: Partial<Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<CalendarItem | null> => {
    try {
      const updatedItem = await window.api.calendar.updateCalendarItem(id, updates)
      await refresh()
      return updatedItem
    } catch (err) {
      console.error('[useCalendarItems] Error updating item:', err)
      setError(err instanceof Error ? err : new Error('Failed to update item'))
      return null
    }
  }, [refresh])

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await window.api.calendar.deleteCalendarItem(id)
      if (success) {
        await refresh()
      }
      return success
    } catch (err) {
      console.error('[useCalendarItems] Error deleting item:', err)
      setError(err instanceof Error ? err : new Error('Failed to delete item'))
      return false
    }
  }, [refresh])

  return {
    items,
    loading,
    error,
    refresh,
    createItem,
    updateItem,
    deleteItem
  }
}
