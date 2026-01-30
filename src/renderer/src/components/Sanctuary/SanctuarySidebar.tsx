import { useState, useEffect, useCallback } from 'react'
import { CalendarItem, ItemDomain } from '../../../../shared/types'
import { Calendar, Plus } from 'lucide-react'

// ... (Giữ nguyên interface AgendaItem, SanctuarySidebarProps như cũ)
// ... (Nếu bạn cần code full logic loadTodayAgenda, hãy báo tôi, tạm thời tôi tập trung sửa UI render bên dưới)

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
    const [agenda, setAgenda] = useState<AgendaItem[]>([
        // Mock data để bạn thấy UI ngay lập tức
        { id: '1', time: '09:00', title: 'Deep Work Session', type: 'task', domain: 'work', status: 'current' },
        { id: '2', time: '12:00', title: 'Lunch Break', type: 'event', domain: 'life', status: 'upcoming' },
        { id: '3', time: '14:30', title: 'Team Sync', type: 'event', domain: 'work', status: 'upcoming' },
        { id: '4', time: '16:00', title: 'Review Code', type: 'task', domain: 'work', status: 'upcoming' }
    ])
    const [quickAddText, setQuickAddText] = useState('')

    // ... (Giữ nguyên logic handleQuickAdd, loadTodayAgenda)

    return (
        // FIX: Tăng bg-black lên /60 và border lên /30 để rõ khối hơn
        <aside className="h-full w-full flex flex-col bg-black/60 backdrop-blur-2xl border-r border-solid border-white/30 p-8 z-30 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">

            {/* HEADER */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-6 text-white/50">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase">Today's Focus</span>
                </div>

                {/* INPUT: Tăng contrast */}
                <div className="relative group">
                    <input
                        type="text"
                        value={quickAddText}
                        onChange={(e) => setQuickAddText(e.target.value)}
                        placeholder="Add task..."
                        className="
                            w-full bg-white/5 border border-solid border-white/20 rounded-lg py-3 px-4
                            text-sm text-white placeholder:text-white/20
                            focus:border-white/50 focus:bg-white/10 focus:outline-none transition-all
                        "
                    />
                    <div className="absolute right-3 top-3 text-white/20">
                        <Plus className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* TIMELINE LIST */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
                {agenda.map((item) => {
                    const isActive = activeTaskId === item.id;
                    return (
                        <div
                            key={item.id}
                            onClick={() => onTaskSelect && onTaskSelect({ id: item.id, title: item.title } as CalendarItem)}
                            className={`
                                group relative pl-8 py-3 border-l-2 border-solid transition-all cursor-pointer rounded-r-lg
                                ${isActive
                                    ? 'border-blue-500 bg-white/10'
                                    : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                }
                            `}
                        >
                            {/* Dot Indicator */}
                            <div className={`
                                absolute -left-[5px] top-[18px] w-2.5 h-2.5 rounded-full border-2 border-black transition-all
                                ${isActive ? 'bg-blue-500 scale-125' : 'bg-gray-600 group-hover:bg-gray-400'}
                            `} />

                            <div className="flex flex-col">
                                <span className={`text-[10px] font-mono mb-0.5 ${isActive ? 'text-blue-300' : 'text-gray-500'}`}>
                                    {item.time}
                                </span>
                                <span className={`text-sm font-medium leading-tight ${item.status === 'done' ? 'line-through text-gray-600' : 'text-white'}`}>
                                    {item.title}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* STATS FOOTER */}
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-center text-white/30">
                4 Tasks Pending • 2h 30m Focus Time
            </div>
        </aside>
    )
}