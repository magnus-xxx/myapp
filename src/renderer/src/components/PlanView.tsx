import 'react-big-calendar/lib/css/react-big-calendar.css'
import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import {
    Plus,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    List,
    Monitor,
    CheckSquare,
    Repeat,
    Flag
} from 'lucide-react'
import { TableView } from './TableView'
import { KanbanView } from './KanbanView'
import { DomainSwitcher } from './DomainSwitcher'
import { CreateItemModal } from './CreateItemModal'
import { ItemDomain, CalendarItem, ItemStatus, ItemType } from '../../../shared/types'
import { expandCalendarItems } from '../utils/calendarExpansion'
import './PlanView.css'

// Initialize moment localizer
let localizer: any;
try {
    localizer = momentLocalizer(moment)
    console.log('[PlanView] Localizer initialized')
} catch (e) {
    console.error('[PlanView] Failed to initialize localizer:', e)
}

// Interface for react-big-calendar mapping
export interface MappedEvent {
    id: number | string
    title: string
    start: Date
    end: Date
    resource: CalendarItem
    color?: string
}

type ViewMode = 'calendar' | 'table' | 'kanban'

export function PlanView() {
    console.log('[PlanView] Component rendering...')

    const [items, setItems] = useState<CalendarItem[]>([])
    const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [initialDate, setInitialDate] = useState<Date | null>(null)

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('calendar')
    const [calendarView, setCalendarView] = useState<View>('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [activeDomain, setActiveDomain] = useState<ItemDomain | 'all'>('all')
    const [typeFilters, setTypeFilters] = useState<Set<ItemType>>(new Set(['task', 'event', 'milestone', 'habit']))

    const toggleTypeFilter = (type: ItemType) => {
        const newFilters = new Set(typeFilters)
        if (newFilters.has(type)) {
            if (newFilters.size > 1) { // Keep at least one filter active
                newFilters.delete(type)
            }
        } else {
            newFilters.add(type)
        }
        setTypeFilters(newFilters)
    }

    // Component mount/unmount logging
    useEffect(() => {
        console.log('[PlanView] Component MOUNTED')

        // Listen for calendar item updates (from checkbox toggles)
        const handleItemUpdate = () => {
            console.log('[PlanView] Calendar item updated, refreshing...')
            loadItems()
        }

        window.addEventListener('calendar-item-updated', handleItemUpdate)

        return () => {
            console.log('[PlanView] Component UNMOUNTED')
            window.removeEventListener('calendar-item-updated', handleItemUpdate)
        }
    }, [])

    useEffect(() => {
        console.log('[PlanView] Effect triggered by activeDomain, typeFilters, or currentDate')
        loadItems()
    }, [activeDomain, typeFilters, currentDate])

    const loadItems = async () => {
        console.log('[PlanView] loadItems called')
        try {
            if (!window.api || !window.api.calendar || !window.api.calendar.getCalendarItems) {
                console.error('[PlanView] window.api.calendar.getCalendarItems is not available')
                return
            }

            const filters: any = {}
            if (activeDomain !== 'all') filters.domains = [activeDomain]

            // CRITICAL FIX: Pass type filters to API
            if (typeFilters.size > 0 && typeFilters.size < 4) {
                filters.types = Array.from(typeFilters)
                console.log('[PlanView] Applying type filters:', filters.types)
            }

            console.log('[PlanView] Fetching items with filters:', filters)

            // Fetch local items from database
            const localData = await window.api.calendar.getCalendarItems(filters)
            console.log('[PlanView] Received local items from API:', localData?.length || 0, 'items')

            // Fetch Google Calendar events
            let googleEvents: any[] = []
            try {
                // Calculate time range for current month view
                const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)

                const timeMin = start.toISOString()
                const timeMax = end.toISOString()

                console.log('=== RENDERER: Requesting Google Events ===')
                console.log('RENDERER: Time range:', { timeMin, timeMax })
                console.log('RENDERER: Current date:', currentDate)

                googleEvents = await window.api.calendar.getGoogleEvents(timeMin, timeMax)

                console.log(`RENDERER: Received ${googleEvents.length} Google Calendar events`)
                if (googleEvents.length > 0) {
                    console.log('RENDERER: First Google event:', googleEvents[0])
                }
            } catch (googleError) {
                console.error('RENDERER: Failed to fetch Google events:', googleError)
                // Continue with local items only
            }

            // Normalize Google Events for rendering (Ensure they use start_time/end_time)
            const normalizedGoogleEvents = googleEvents.map(evt => ({
                ...evt,
                start_time: evt.start_time, // Standard snake_case
                end_time: evt.end_time,
                priority: evt.priority || 'medium',
                status: evt.status || 'todo',
                type: 'event'
            }))

            // Merge local and Google items
            const allItems = [...(localData || []), ...normalizedGoogleEvents]
            console.log(`RENDERER: Total items after merge: ${allItems.length} (${localData?.length || 0} local + ${normalizedGoogleEvents.length} Google)`)

            if (normalizedGoogleEvents.length > 0) {
                console.log('RENDERER: Sample Normalized Google Event:', normalizedGoogleEvents[0])
            }

            setItems(allItems)
        } catch (error) {
            console.error('[PlanView] Failed to load items:', error)
        }
    }


    // Map CalendarItems to react-big-calendar format with proper expansion
    const events = useMemo(() => {
        console.log('[PlanView] useMemo: Mapping items to events')
        try {
            if (!items || !Array.isArray(items)) {
                console.warn('[PlanView] useMemo: Items is not an array:', items)
                return []
            }

            console.log('[PlanView] useMemo: Processing', items.length, 'items')

            // Calculate view range for habit expansion
            const viewStart = moment(currentDate).startOf(calendarView === 'month' ? 'month' : calendarView === 'week' ? 'week' : 'day').toDate()
            const viewEnd = moment(currentDate).endOf(calendarView === 'month' ? 'month' : calendarView === 'week' ? 'week' : 'day').toDate()

            console.log('[PlanView] useMemo: View range:', viewStart, 'to', viewEnd)

            // Use expansion utility
            const expandedEvents = expandCalendarItems(items, viewStart, viewEnd)

            console.log('[PlanView] useMemo: Successfully expanded to', expandedEvents.length, 'events')
            return expandedEvents
        } catch (e) {
            console.error('[PlanView] CRITICAL ERROR in useMemo mapping events:', e)
            console.error('[PlanView] Error stack:', e instanceof Error ? e.stack : 'No stack trace')
            console.error('[PlanView] Items that caused error:', items)
            // Return empty array to prevent crash
            return []
        }
    }, [items, currentDate, calendarView])

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setInitialDate(start)
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleSelectEvent = (event: MappedEvent) => {
        setSelectedItem(event.resource)
        setIsModalOpen(true)
    }

    const handleCreateClick = () => {
        setInitialDate(new Date())
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    // Auto-Sync Logic
    useEffect(() => {
        // Initial load from DB (Offline First)
        loadItems()

        // Then Sync with Cloud
        handleSync(true)

        // Sync every 5 minutes
        const interval = setInterval(() => {
            console.log('UI: Auto-syncing Google Calendar...')
            handleSync(true)
        }, 300000)

        return () => clearInterval(interval)
    }, [])

    const handleSync = async (silent = false) => {
        try {
            if (!silent) console.log('UI: Starting Sync with Timezone Support...');

            const now = currentDate;
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            // 1. GET RAW DATA
            const googleRawEvents = await window.api.calendar.getGoogleEvents(start, end);
            console.log('UI: Raw Payload:', googleRawEvents);

            if (!googleRawEvents || googleRawEvents.length === 0) {
                if (!silent) alert('No events found for this period.');
                return;
            }

            // 2. MAP WITH TIMEZONE AWARENESS
            const normalizedEvents = googleRawEvents.map((evt: any) => {
                // Safe Accessors
                const startData = evt.start || {};
                const endData = evt.end || {};
                const title = evt.summary || '(No Title)';

                // Capture Timezone explicitly (for reference/debugging)
                const originTimezone = startData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

                let startTime = "00:00";
                let endTime = "23:59";
                let dateStr = new Date().toISOString();
                let isAllDay = true;

                // Fields required for App internal logic
                let start_time_iso = "";
                let end_time_iso = "";

                if (startData.dateTime) {
                    // --- TIMED EVENT ---
                    isAllDay = false;

                    // CORE LOGIC: Parse ISO String (e.g., "2026-01-06T10:00:00-05:00")
                    // new Date() automatically handles the "-05:00" offset and converts it to System Local Time.
                    const startObj = new Date(startData.dateTime);
                    const endObj = new Date(endData.dateTime || startData.dateTime);

                    // Format to HH:mm for App Display
                    const formatTime = (d: Date) => d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');

                    startTime = formatTime(startObj);
                    endTime = formatTime(endObj);
                    dateStr = startObj.toISOString();

                    // App Internal Requirement: ISO Strings
                    start_time_iso = startObj.toISOString();
                    end_time_iso = endObj.toISOString();

                } else if (startData.date) {
                    // --- ALL DAY EVENT ---
                    isAllDay = true;
                    // Google sends "YYYY-MM-DD". Force to Local Midnight to avoid timezone shifts on the date itself.
                    const parts = startData.date.split('-'); // YYYY-MM-DD
                    const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    dateStr = localDate.toISOString();
                    start_time_iso = localDate.toISOString();

                    const endLocalDate = new Date(localDate);
                    endLocalDate.setHours(23, 59, 59);
                    end_time_iso = endLocalDate.toISOString();
                } else if (evt.start_time) {
                    // Fallback for potentially pre-converted events (if any logic remains)
                    const startObj = new Date(evt.start_time);
                    const endObj = new Date(evt.end_time || evt.start_time);

                    start_time_iso = startObj.toISOString();
                    end_time_iso = endObj.toISOString();
                    isAllDay = evt.is_all_day || false;
                }

                // Return Magnus Item Structure
                return {
                    id: `gcal-${evt.id}`,
                    title: title,
                    description: evt.description || '',

                    // Timezone Info
                    timezone: originTimezone,

                    // App Internal Fields (snake_case) - REQUIRED for Expansion
                    start_time: start_time_iso,
                    end_time: end_time_iso,
                    is_all_day: isAllDay,

                    // Additional Fields requested by User
                    date: dateStr,
                    startTime: startTime,
                    endTime: endTime,

                    status: 'todo' as const,
                    priority: 'medium' as const,
                    type: 'event' as const,
                    domain: 'work' as const,
                    isSynced: true,
                    googleEventId: evt.id,
                    googleCalendarId: 'primary'
                } as CalendarItem;
            }).filter((item): item is CalendarItem => item !== null);

            console.log('UI: Mapped Events:', normalizedEvents);

            // 3. PERSIST TO DB (Source of Truth - Offline First)
            try {
                const saveSuccess = await window.api.calendar.saveSyncedItems(normalizedEvents)
                if (saveSuccess) {
                    if (!silent) console.log('UI: Google Events saved to DB. Reloading from DB...')
                    await loadItems() // Fetch from DB (Required for strict sync state)
                } else {
                    console.error('UI: Failed to save synced items to DB.')
                }
            } catch (dbError) {
                console.error('UI: DB Save Error:', dbError)
            }

            if (!silent) {
                alert(`Synced ${normalizedEvents.length} events using timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
            } else {
                console.log(`UI: Auto-sync complete. ${normalizedEvents.length} events synced.`);
            }

        } catch (e) {
            console.error('Sync Error:', e);
            if (!silent) alert('Sync Failed. Check Console.');
        }
    };

    const handleStatusChange = async (id: number, newStatus: ItemStatus) => {
        try {
            await window.api.calendar.updateCalendarItem(id.toString(), { status: newStatus })
            await loadItems()
        } catch (error) {
            console.error('[PlanView] Status update failed:', error)
        }
    }

    const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
        if (action === 'TODAY') {
            setCurrentDate(new Date())
            return
        }
        const unit = calendarView === 'month' ? 'month' : calendarView === 'week' ? 'week' : 'day'
        const newDate = moment(currentDate).add(action === 'NEXT' ? 1 : -1, unit).toDate()
        setCurrentDate(newDate)
    }


    // Final safety render
    try {
        return (
            <div style={{ display: 'flex', height: '100%', width: '100%', background: '#121212' }}>
                {/* Sidebar - Compact */}
                <div style={{ width: '13rem', background: '#0D0D0D', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <DomainSwitcher activeDomain={activeDomain} onDomainChange={setActiveDomain} />

                    <div>
                        <h3 style={sectionHeaderStyle}>Filters</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {[
                                { type: 'task', icon: CheckSquare, color: '#3b82f6' },
                                { type: 'event', icon: CalendarIcon, color: '#8b5cf6' },
                                { type: 'milestone', icon: Flag, color: '#f59e0b' },
                                { type: 'habit', icon: Repeat, color: '#10b981' }
                            ].map(({ type, icon: Icon, color }) => (
                                <div
                                    key={type}
                                    style={{
                                        ...filterItemStyle,
                                        cursor: 'pointer',
                                        opacity: typeFilters.has(type as ItemType) ? 1 : 0.3,
                                        transition: 'opacity 0.2s ease'
                                    }}
                                    onClick={() => toggleTypeFilter(type as ItemType)}
                                >
                                    <Icon size={16} color={color} style={{ opacity: 0.7 }} />
                                    <span style={{ fontSize: '0.8125rem', color: '#d1d5db', textTransform: 'capitalize' }}>{type}s</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={placeholderBoxStyle}>
                        <CalendarIcon size={16} color="#525252" />
                        <span style={{ fontSize: '0.6875rem', color: '#525252' }}>External Sync</span>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Toolbar */}
                    <div style={toolbarStyle}>
                        <div style={viewSwitcherStyle}>
                            {(['calendar', 'table', 'kanban'] as ViewMode[]).map(mode => (
                                <button key={mode} onClick={() => setViewMode(mode)} style={{ ...viewBtnStyle, background: viewMode === mode ? '#262626' : 'transparent', color: viewMode === mode ? '#fff' : '#737373' }}>
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => handleNavigate('PREV')} style={navBtnStyle}><ChevronLeft size={20} /></button>
                            <span style={dateLabelStyle}>
                                {(() => {
                                    try {
                                        return moment(currentDate).format(calendarView === 'month' ? 'MMMM YYYY' : 'MMM D, YYYY')
                                    } catch (e) {
                                        console.error('[PlanView] Date formatting error:', e)
                                        return 'Select Date'
                                    }
                                })()}
                            </span>
                            <button onClick={() => handleNavigate('NEXT')} style={navBtnStyle}><ChevronRight size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select value={calendarView} onChange={(e) => setCalendarView(e.target.value as View)} style={selectStyle}>
                                <option value="month">Month</option>
                                <option value="week">Week</option>
                                <option value="day">Day</option>
                            </select>
                            <button onClick={() => handleSync(false)} style={syncBtnStyle}><RefreshCw size={16} /> Sync Google</button>
                            <button onClick={handleCreateClick} style={createBtnStyle}><Plus size={16} /> Create</button>
                        </div>
                    </div>

                    {/* View Content */}
                    <div style={{ flex: 1, padding: '1.5rem', overflow: 'hidden', minHeight: 0 }}>
                        {viewMode === 'calendar' && localizer && (
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 'calc(100vh - 180px)' }}
                                view={calendarView}
                                onView={setCalendarView}
                                date={currentDate}
                                onNavigate={setCurrentDate}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent as any}
                                selectable
                                eventPropGetter={getEventStyle}
                                components={{
                                    event: CustomEvent
                                }}
                            />
                        )}
                        {viewMode === 'table' && <TableView events={items || []} onEdit={(i: any) => { setSelectedItem(i); setIsModalOpen(true); }} />}
                        {viewMode === 'kanban' && <KanbanView events={items || []} onEdit={(i: any) => { setSelectedItem(i); setIsModalOpen(true); }} onStatusChange={handleStatusChange} />}
                    </div>
                </div>

                <CreateItemModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
                    onSuccess={loadItems}
                    initialDate={initialDate}
                    initialDomain={activeDomain}
                    initialItem={selectedItem}
                />
            </div>
        )
    } catch (e) {
        console.error('[PlanView] Render CRASH:', e)
        return <div style={{ color: 'white', padding: '2rem' }}>A critical error occurred while rendering the Plan view. Please check the console.</div>
    }
}

const toolbarStyle: React.CSSProperties = { height: '4.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(13, 13, 13, 0.8)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem' }
const navBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: '#737373', cursor: 'pointer', padding: '0.4rem' }
const dateLabelStyle: React.CSSProperties = { fontSize: '1.125rem', fontWeight: 600, color: '#fff', minWidth: '12rem', textAlign: 'center' }
const syncBtnStyle: React.CSSProperties = { background: '#262626', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }
const createBtnStyle: React.CSSProperties = { background: '#3b82f6', color: '#fff', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }
const viewSwitcherStyle: React.CSSProperties = { background: 'rgba(255, 255, 255, 0.03)', padding: '0.25rem', borderRadius: '0.75rem', display: 'flex', gap: '0.25rem' }
const viewBtnStyle: React.CSSProperties = { border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }
const sectionHeaderStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }
const filterItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'default' }
const placeholderBoxStyle: React.CSSProperties = { marginTop: 'auto', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }
const selectStyle: React.CSSProperties = { background: '#2d2d2d', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', outline: 'none' }

// Custom event styling based on type
function getEventStyle(event: any) {
    const item = event.resource
    const baseColor = event.color
    const isSynced = item.isSynced

    // Highlight synced events with Google-blue border
    const syncedStyle = isSynced ? { borderLeft: '3px solid #4285F4' } : {}

    switch (item.type) {
        case 'event':
            // Solid block with opacity
            return {
                style: {
                    backgroundColor: baseColor,
                    opacity: 0.85,
                    border: 'none',
                    ...syncedStyle,
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '2px 6px'
                }
            }
        case 'task':
            // Outline style with left border
            return {
                style: {
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${baseColor}`,
                    borderRadius: '2px',
                    color: '#e5e7eb',
                    fontSize: '0.75rem',
                    padding: '2px 6px'
                }
            }
        case 'habit':
            // Ghost style with subtle background
            return {
                style: {
                    backgroundColor: `${baseColor}15`,
                    border: `1px solid ${baseColor}30`,
                    borderRadius: '4px',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    fontStyle: 'italic',
                    padding: '2px 6px'
                }
            }
        case 'milestone':
            // Minimal flag style
            return {
                style: {
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: baseColor,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 6px'
                }
            }
        default:
            return {
                style: {
                    backgroundColor: baseColor,
                    border: 'none',
                    borderRadius: '4px'
                }
            }
    }
}

// Custom event component with icons and time display
function CustomEvent({ event }: any) {
    const item = event.resource
    const isAllDay = event.allDay
    const isDone = item.status === 'done'
    const canToggle = item.type === 'task' || item.type === 'habit'

    // Format time for non-all-day events
    const timeStr = !isAllDay ? moment(event.start).format('h:mma') : ''

    // Handle checkbox toggle
    const handleCheckboxClick = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening modal
        try {
            const newStatus = isDone ? 'todo' : 'done'
            console.log('[CustomEvent] Toggling status:', item.id, 'from', item.status, 'to', newStatus)

            // Optimistic UI: Update immediately
            item.status = newStatus

            // Update via API
            await window.api.calendar.updateCalendarItem(item.id.toString(), { status: newStatus })

            // Refresh data silently (no page reload)
            // This will be handled by parent component's refresh mechanism
            // For now, we'll dispatch a custom event that PlanView can listen to
            window.dispatchEvent(new Event('calendar-item-updated'))
        } catch (error) {
            console.error('[CustomEvent] Failed to toggle status:', error)
            // Revert optimistic update on error
            item.status = isDone ? 'done' : 'todo'
        }
    }

    // Get icon based on type
    const getIcon = () => {
        switch (item.type) {
            case 'task':
                return <CheckSquare size={10} style={{ opacity: 0.7, marginRight: '4px', flexShrink: 0 }} />
            case 'habit':
                return <Repeat size={10} style={{ opacity: 0.5, marginRight: '4px', flexShrink: 0 }} />
            case 'milestone':
                const milestoneColor = isDone ? '#10b981' : '#f59e0b'
                return <Flag size={10} style={{ color: milestoneColor, marginRight: '4px', flexShrink: 0 }} />
            default:
                return null
        }
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            overflow: 'hidden',
            padding: '1px 4px',
            opacity: isDone ? 0.6 : 1,
            transition: 'opacity 0.2s'
        }}>
            {canToggle && (
                <input
                    type="checkbox"
                    checked={isDone}
                    onClick={handleCheckboxClick}
                    style={{
                        marginRight: '4px',
                        flexShrink: 0,
                        cursor: 'pointer',
                        width: '12px',
                        height: '12px'
                    }}
                />
            )}
            {getIcon()}
            {timeStr && (
                <span style={{
                    fontSize: '0.625rem',
                    opacity: 0.8,
                    fontWeight: 500,
                    marginRight: '4px',
                    flexShrink: 0
                }}>
                    {timeStr}
                </span>
            )}
            <span style={{
                fontWeight: item.type === 'event' ? 600 : 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: isDone ? 'line-through' : 'none',
                flex: 1
            }}>
                {event.title}
            </span>
        </div>
    )
}
