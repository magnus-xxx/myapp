import * as ical from 'node-ical'
import { DatabaseManager } from './DatabaseManager'

export interface UnifiedEvent {
  title: string
  start: Date
  end: Date
  isAllDay: boolean
  source: string
  color: string
  description?: string
}

/**
 * CalendarManager - Handles external calendar integration
 * Fetches and parses iCal feeds from Google Calendar and other sources
 */
export class CalendarManager {
  private db: DatabaseManager

  constructor(db: DatabaseManager) {
    this.db = db
  }

  /**
   * Fetch and parse events from all enabled calendar sources
   * Returns unified event objects
   */
  async fetchExternalEvents(): Promise<UnifiedEvent[]> {
    const allEvents: UnifiedEvent[] = []

    try {
      // Get all enabled calendar sources
      const sources = this.db.getCalendarSources().filter(s => s.enabled)

      if (sources.length === 0) {
        console.log('[CalendarManager] No enabled calendar sources')
        return []
      }

      console.log(`[CalendarManager] Syncing ${sources.length} calendar source(s)`)

      // Fetch events from each source
      for (const source of sources) {
        try {
          console.log(`[CalendarManager] Fetching calendar: ${source.name} from ${source.url}`)
          
          // Fetch and parse iCal data
          const events = await ical.async.fromURL(source.url) as Record<string, any>
          
          // Convert iCal events to unified format
          for (const event of Object.values(events)) {
            if (event.type === 'VEVENT') {
              try {
                const startDate = event.start ? new Date(event.start) : new Date()
                const endDate = event.end ? new Date(event.end) : startDate
                
                // Check if it's an all-day event
                const isAllDay = typeof event.start === 'string' && event.start.length === 8 // YYYYMMDD format
                
                allEvents.push({
                  title: event.summary || 'Untitled Event',
                  start: startDate,
                  end: endDate,
                  isAllDay: isAllDay,
                  source: source.name,
                  color: source.color || '#FFFFFF',
                  description: event.description || ''
                })
              } catch (eventError) {
                console.error(`[CalendarManager] Error parsing event:`, eventError)
              }
            }
          }
          
          console.log(`[CalendarManager] Successfully synced ${source.name}`)
        } catch (sourceError) {
          // Log error but don't crash - continue with other sources
          console.error(`[CalendarManager] Failed to sync calendar ${source.name}:`, sourceError)
          console.error(`[CalendarManager] URL: ${source.url}`)
        }
      }

      console.log(`[CalendarManager] Total events fetched: ${allEvents.length}`)
      return allEvents
    } catch (error) {
      console.error('[CalendarManager] Error in fetchExternalEvents:', error)
      return [] // Return empty array on error, don't crash
    }
  }

  /**
   * Test a calendar URL without saving it
   * Useful for validating URLs before adding them
   */
  async testCalendarUrl(url: string): Promise<{ success: boolean; eventCount?: number; error?: string }> {
    try {
      console.log(`[CalendarManager] Testing calendar URL: ${url}`)
      
      const events = await ical.async.fromURL(url)
      const eventCount = Object.values(events).filter(e => e.type === 'VEVENT').length
      
      console.log(`[CalendarManager] Test successful: ${eventCount} events found`)
      return { success: true, eventCount }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[CalendarManager] Test failed:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}
