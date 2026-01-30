import { RRule } from 'rrule'
import { CalendarItem } from '../../../shared/types'

export interface ExpandedCalendarEvent {
    id: string | number
    title: string
    start: Date
    end: Date
    allDay: boolean
    resource: CalendarItem
    color: string
    isVirtual?: boolean // For habit instances
    instanceDate?: string // For tracking which habit instance this is
}

/**
 * Clean date string by removing all spaces
 * Fixes malformed dates like "2026-01-08 T23: 59: 59" -> "2026-01-08T23:59:59"
 */
function cleanDateStr(dateStr: string | undefined): string | null {
    if (!dateStr) return null
    // Remove all spaces to fix malformed date strings
    return dateStr.replace(/\s+/g, '')
}

/**
 * Expand calendar items into renderable events for react-big-calendar
 * Handles:
 * - Events: Parse as local time, ensure proper start/end
 * - Tasks: Render on due date as all-day
 * - Milestones: Render on target date as all-day
 * - Habits: Expand recurrence into virtual instances
 */
export function expandCalendarItems(
    items: CalendarItem[],
    viewStart: Date,
    viewEnd: Date
): ExpandedCalendarEvent[] {
    console.log('[CalendarExpansion] Processing items:', items.length, 'View range:', viewStart, 'to', viewEnd)
    const events: ExpandedCalendarEvent[] = []

    items.forEach((item, index) => {
        console.log(`[CalendarExpansion] Item ${index + 1}/${items.length}:`, {
            id: item.id,
            title: item.title,
            type: item.type,
            start_time: item.start_time,
            due_date: item.due_date,
            domain: item.domain
        })

        try {
            let expanded: ExpandedCalendarEvent[] = []
            
            switch (item.type) {
                case 'event':
                    expanded = expandEvent(item)
                    break
                case 'task':
                    expanded = expandTask(item)
                    break
                case 'milestone':
                    expanded = expandMilestone(item)
                    break
                case 'habit':
                    expanded = expandHabit(item, viewStart, viewEnd)
                    break
            }

            // Validate expanded events
            expanded.forEach(event => {
                if (isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
                    console.error('[CalendarExpansion] Invalid date for event:', event.title, event)
                } else {
                    console.log('[CalendarExpansion] ✓ Rendering Event:', event.title, 'Start:', event.start, 'End:', event.end, 'AllDay:', event.allDay)
                    events.push(event)
                }
            })
        } catch (error) {
            console.error('[CalendarExpansion] Error expanding item:', item.title, error)
        }
    })

    console.log('[CalendarExpansion] Total events to render:', events.length)
    return events
}

/**
 * Expand Event - Parse as LOCAL time to prevent timezone issues
 */
function expandEvent(item: CalendarItem): ExpandedCalendarEvent[] {
    if (!item.start_time) {
        console.warn('[expandEvent] No start_time for event:', item.title)
        return []
    }

    // Clean and parse as LOCAL time
    const cleanedStart = cleanDateStr(item.start_time)
    const cleanedEnd = cleanDateStr(item.end_time) || cleanedStart

    if (!cleanedStart) {
        console.error('[expandEvent] Failed to clean start_time:', item.start_time, 'for event:', item.title)
        return []
    }

    // Do NOT remove 'Z' suffix if we want to respect the timezone!
    // If the string is in UTC (has Z), new Date() will convert to local time correctly.
    const startStr = cleanedStart.trim()
    const endStr = cleanedEnd!.trim()

    const start = new Date(startStr)
    const end = new Date(endStr)

    // Validate dates
    if (isNaN(start.getTime())) {
        console.error('[expandEvent] Invalid start_time after cleaning:', startStr, 'original:', item.start_time, 'for event:', item.title)
        return []
    }
    if (isNaN(end.getTime())) {
        console.error('[expandEvent] Invalid end_time after cleaning:', endStr, 'original:', item.end_time, 'for event:', item.title)
        return []
    }

    // If end is same as start, add 1 hour
    if (end.getTime() === start.getTime()) {
        end.setHours(end.getHours() + 1)
    }

    // Check if it's an all-day event (times are at midnight)
    const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 &&
                     end.getHours() === 0 && end.getMinutes() === 0

    return [{
        id: item.id || Math.random(),
        title: item.title,
        start,
        end,
        allDay: isAllDay,
        resource: item,
        color: getDomainColor(item.domain)
    }]
}

/**
 * Expand Task - Render on due date as all-day event
 */
function expandTask(item: CalendarItem): ExpandedCalendarEvent[] {
    if (!item.due_date) {
        console.warn('[expandTask] No due_date for task:', item.title)
        return []
    }

    // Clean the date string
    const cleanedDate = cleanDateStr(item.due_date)
    if (!cleanedDate) {
        console.error('[expandTask] Failed to clean due_date:', item.due_date, 'for task:', item.title)
        return []
    }

    // Parse as local date
    const dateStr = cleanedDate.split('T')[0]
    const start = new Date(dateStr + 'T00:00:00')
    const end = new Date(dateStr + 'T23:59:59')

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('[expandTask] Invalid due_date after cleaning:', cleanedDate, 'original:', item.due_date, 'for task:', item.title)
        return []
    }

    return [{
        id: item.id || Math.random(),
        title: item.title,
        start,
        end,
        allDay: true,
        resource: item,
        color: getDomainColor(item.domain)
    }]
}

/**
 * Expand Milestone - Render on target date as all-day event
 */
function expandMilestone(item: CalendarItem): ExpandedCalendarEvent[] {
    if (!item.due_date) {
        console.warn('[expandMilestone] No due_date for milestone:', item.title)
        return []
    }

    // Clean the date string
    const cleanedDate = cleanDateStr(item.due_date)
    if (!cleanedDate) {
        console.error('[expandMilestone] Failed to clean due_date:', item.due_date, 'for milestone:', item.title)
        return []
    }

    const dateStr = cleanedDate.split('T')[0]
    const start = new Date(dateStr + 'T00:00:00')
    const end = new Date(dateStr + 'T23:59:59')

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('[expandMilestone] Invalid due_date after cleaning:', cleanedDate, 'original:', item.due_date, 'for milestone:', item.title)
        return []
    }

    return [{
        id: item.id || Math.random(),
        title: item.title,
        start,
        end,
        allDay: true,
        resource: item,
        color: getDomainColor(item.domain)
    }]
}

/**
 * Expand Habit - Generate virtual instances using RRule
 */
function expandHabit(
    item: CalendarItem,
    viewStart: Date,
    viewEnd: Date
): ExpandedCalendarEvent[] {
    const metadata = item.metadata || {}
    const frequency = metadata.habit_frequency || 'daily'
    
    // Determine start date for habit
    let habitStart: Date
    if (item.start_time) {
        habitStart = new Date(item.start_time.split('T')[0] + 'T00:00:00')
    } else if (item.due_date) {
        habitStart = new Date(item.due_date.split('T')[0] + 'T00:00:00')
    } else if (item.created_at) {
        habitStart = new Date(item.created_at.split('T')[0] + 'T00:00:00')
    } else {
        habitStart = new Date()
        habitStart.setHours(0, 0, 0, 0)
    }

    // Determine end date for habit (prevent infinite loop)
    // Priority: 1. Count limit (target_streak), 2. End date, 3. Default to 1 year
    const targetStreak = metadata.target_streak
    const hasCountLimit = targetStreak && parseInt(targetStreak.toString()) > 0
    
    let habitEnd: Date | undefined
    if (!hasCountLimit) {
        // Only calculate end date if no count limit
        if (metadata.habit_end_date) {
            habitEnd = new Date(metadata.habit_end_date.split('T')[0] + 'T23:59:59')
        } else {
            // Default to 1 year from start
            habitEnd = new Date(habitStart)
            habitEnd.setFullYear(habitEnd.getFullYear() + 1)
        }
    }

    // Map frequency to RRule frequency
    let rruleFreq: number
    switch (frequency) {
        case 'weekly':
            rruleFreq = RRule.WEEKLY
            break
        case 'monthly':
            rruleFreq = RRule.MONTHLY
            break
        case 'daily':
        default:
            rruleFreq = RRule.DAILY
            break
    }

    // Create RRule with count or until
    const ruleOptions: any = {
        freq: rruleFreq,
        dtstart: habitStart
    }

    if (hasCountLimit) {
        // Use COUNT limit (e.g., "5" means 5 occurrences)
        ruleOptions.count = parseInt(targetStreak.toString())
        console.log('[expandHabit] Using COUNT limit:', ruleOptions.count, 'for habit:', item.title)
    } else if (habitEnd) {
        // Use UNTIL date
        const untilDate = habitEnd < viewEnd ? habitEnd : viewEnd
        ruleOptions.until = untilDate
        console.log('[expandHabit] Using UNTIL date:', untilDate, 'for habit:', item.title)
    } else {
        // Fallback: limit to view end
        ruleOptions.until = viewEnd
        console.log('[expandHabit] Using view end as limit:', viewEnd, 'for habit:', item.title)
    }

    const rule = new RRule(ruleOptions)

    // Generate instances
    // If using count, generate all instances; if using until, limit to view range
    const instances = hasCountLimit 
        ? rule.all() 
        : rule.between(viewStart, ruleOptions.until, true)

    // Create virtual events for each instance
    return instances.map((date) => {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)
        
        const end = new Date(date)
        end.setHours(23, 59, 59, 999)

        return {
            id: `${item.id}-habit-${date.toISOString().split('T')[0]}`,
            title: `${item.title} ${getHabitEmoji(metadata.habit_streak || 0)}`,
            start,
            end,
            allDay: true,
            resource: item,
            color: getDomainColor(item.domain),
            isVirtual: true,
            instanceDate: date.toISOString().split('T')[0]
        }
    })
}

/**
 * Get emoji based on habit streak
 */
function getHabitEmoji(streak: number): string {
    if (streak >= 30) return '🔥'
    if (streak >= 7) return '⚡'
    if (streak >= 3) return '✨'
    return '○'
}

/**
 * Get color based on domain
 */
function getDomainColor(domain: string): string {
    switch (domain) {
        case 'work': return '#3b82f6'
        case 'study': return '#8b5cf6'
        case 'life': return '#10b981'
        case 'invest': return '#f59e0b'
        default: return '#6b7280'
    }
}
