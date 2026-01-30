import { ipcMain } from 'electron'
import { CalendarService } from '../services/CalendarService'
import { CalendarItem, ItemType, ItemDomain } from '../../shared/types'

/**
 * Register IPC handlers for calendar items
 */
export function registerCalendarHandlers(calendarService: CalendarService) {
  /**
   * Get calendar items with optional filters
   */
  ipcMain.handle(
    'calendar:get-items',
    async (
      _event,
      filters?: {
        startDate?: string
        endDate?: string
        domains?: ItemDomain[]
        types?: ItemType[]
        projectId?: string
        status?: string
      }
    ): Promise<CalendarItem[]> => {
      try {
        // Convert date strings to Date objects
        const parsedFilters = filters
          ? {
              ...filters,
              startDate: filters.startDate ? new Date(filters.startDate) : undefined,
              endDate: filters.endDate ? new Date(filters.endDate) : undefined
            }
          : undefined

        return await calendarService.getCalendarItems(parsedFilters)
      } catch (error) {
        console.error('[IPC] calendar:get-items error:', error)
        throw error
      }
    }
  )

  /**
   * Get a single calendar item by ID
   */
  ipcMain.handle('calendar:get-item', async (_event, id: string): Promise<CalendarItem | null> => {
    try {
      return await calendarService.getCalendarItem(id)
    } catch (error) {
      console.error('[IPC] calendar:get-item error:', error)
      throw error
    }
  })

  /**
   * Create a new calendar item
   */
  ipcMain.handle(
    'calendar:create-item',
    async (
      _event,
      data: Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>
    ): Promise<CalendarItem> => {
      try {
        return await calendarService.createCalendarItem(data)
      } catch (error) {
        console.error('[IPC] calendar:create-item error:', error)
        throw error
      }
    }
  )

  /**
   * Update an existing calendar item
   */
  ipcMain.handle(
    'calendar:update-item',
    async (
      _event,
      id: string,
      updates: Partial<Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<CalendarItem | null> => {
      try {
        return await calendarService.updateCalendarItem(id, updates)
      } catch (error) {
        console.error('[IPC] calendar:update-item error:', error)
        throw error
      }
    }
  )

  /**
   * Delete a calendar item
   */
  ipcMain.handle('calendar:delete-item', async (_event, id: string): Promise<boolean> => {
    try {
      return await calendarService.deleteCalendarItem(id)
    } catch (error) {
      console.error('[IPC] calendar:delete-item error:', error)
      throw error
    }
  })

  /**
   * Get items by domain (convenience method for context switching)
   */
  ipcMain.handle(
    'calendar:get-by-domain',
    async (_event, domain: ItemDomain): Promise<CalendarItem[]> => {
      try {
        return await calendarService.getCalendarItems({ domains: [domain] })
      } catch (error) {
        console.error('[IPC] calendar:get-by-domain error:', error)
        throw error
      }
    }
  )

  /**
   * Get items by type (convenience method)
   */
  ipcMain.handle(
    'calendar:get-by-type',
    async (_event, type: ItemType): Promise<CalendarItem[]> => {
      try {
        return await calendarService.getCalendarItems({ types: [type] })
      } catch (error) {
        console.error('[IPC] calendar:get-by-type error:', error)
        throw error
      }
    }
  )

  /**
   * Get items for a specific project
   */
  ipcMain.handle(
    'calendar:get-by-project',
    async (_event, projectId: string): Promise<CalendarItem[]> => {
      try {
        return await calendarService.getCalendarItems({ projectId })
      } catch (error) {
        console.error('[IPC] calendar:get-by-project error:', error)
        throw error
      }
    }
  )

  console.log('[IPC] Calendar handlers registered')
}
