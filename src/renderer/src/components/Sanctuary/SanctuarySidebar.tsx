import { useState, useEffect, useCallback } from 'react'
import { CalendarItem, ItemDomain } from '../../../../shared/types'
import { Calendar, Hash } from 'lucide-react'

interface AgendaItem {
    id: string | number
    time: string
    title: string
    type: 'event' | 'task' | 'milestone' | 'habit'
    domain: ItemDomain
    status: 'upcoming' | 'current' | 'done'
    startTime?: Date
    isActive?: boolean
}

interface SanctuarySidebarProps {
    activeTaskId?: string | number
    onTaskSelect?: (item: CalendarItem) => void
}

export function SanctuarySidebar({ activeTaskId, onTaskSelect }: SanctuarySidebarProps) {
    const [agenda, setAgenda] = useState<AgendaItem[]>([])
    const [quickAddText, setQuickAddText] = useState('')

    useEffect(() => {
        loadTodayAgenda()
    }, [])

    const loadTodayAgenda = useCallback(async () => {
        try {
            const today = new Date()
            const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString()
            const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString()

            const items = await window.api.calendar.getCalendarItems({
                startDate,
                endDate
            })
            // Simple mock fallback if empty for visual confirmation
            if (items.length === 0) throw new Error("No items")

            const now = new Date()
            const mapped: AgendaItem[] = items
                .filter((item) => item.id !== undefined)
                .map((item) => {
                    const startTime = item.start_time ? new Date(item.start_time) : undefined
                    const isCurrent =
                        startTime &&
                        startTime <= now &&
                        (!item.end_time || new Date(item.end_time) >= now)
                    return {
                        id: item.id!,
                        time: startTime ? formatTime(startTime) : '--:--',
                        title: item.title,
                        type: (item.type as AgendaItem['type']) || 'task',
                        domain: item.domain,
                        status: item.status === 'done' ? 'done' : isCurrent ? 'current' : 'upcoming',
                        startTime
                    }
                })
            setAgenda(mapped)
        } catch (err) {
            // Mock data for UI testing
            setAgenda([
                { id: 1, time: '09:00', title: 'Deep Work Session', type: 'task', domain: 'work', status: 'current' },
                { id: 2, time: '12:00', title: 'Lunch Break', type: 'event', domain: 'life', status: 'upcoming' },
                { id: 3, time: '14:30', title: 'Team Sync', type: 'event', domain: 'work', status: 'upcoming' }
            ])
        }
    }, [])

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && quickAddText.trim()) {
            const newItem: AgendaItem = {
                id: Date.now(),
                time: 'Now',
                title: quickAddText,
                type: 'task',
                domain: 'work',
                status: 'upcoming'
            }
            setAgenda([...agenda, newItem])
            setQuickAddText('')
        }
    }

    return (
        <aside className="h-full w-full flex flex-col bg-black/50 backdrop-blur-xl border-r border-solid border-white/20 p-6 z-20">
            {/* HEADER */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase">Today's Focus</span>
                </div>

                {/* VISIBLE INPUT BORDER */}
                <div className="relative">
                    <input
                        type="text"
                        value={quickAddText}
                        onChange={(e) => setQuickAddText(e.target.value)}
                        onKeyDown={handleQuickAdd}
                        placeholder="Add a new task..."
                        className="
                            w-full bg-white/5 border border-solid border-white/20 rounded-lg p-3 
                            text-sm text-white placeholder:text-gray-500 
                            focus:border-white/60 focus:bg-black/60 focus:outline-none transition-all
                        "
                    />
                </div>
            </div>

            {/* TIMELINE LIST */}
            <div className="flex-1 overflow-y-auto space-y-4 pl-1">
                {agenda.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => onTaskSelect && onTaskSelect({ id: item.id, title: item.title } as CalendarItem)}
                        className={`
                            group relative pl-6 border-l border-solid transition-all cursor-pointer
                            ${activeTaskId === item.id
                                ? 'border-blue-500'
                                : 'border-white/20 hover:border-white/50'
                            }
                        `}
                    >
                        {/* Circle Indicator on Line */}
                        <div className={`
                            absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-black transition-colors
                            ${activeTaskId === item.id ? 'bg-blue-500' : 'bg-gray-600 group-hover:bg-white'}
                        `} />

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-gray-400">{item.time}</span>
                            <span className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
                                {item.title}
                            </span>
                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">{item.domain}</span>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    )
}
