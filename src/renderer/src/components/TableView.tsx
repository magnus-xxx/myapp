import React, { useState, useMemo } from 'react'
import moment from 'moment'
import { CalendarItem, ItemDomain } from '../../../shared/types'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'

interface TableViewProps {
    events: CalendarItem[]
    onEdit: (item: CalendarItem) => void
}

type SortField = 'title' | 'status' | 'domain' | 'time' | 'priority'
type SortDirection = 'asc' | 'desc'

export function TableView({ events, onEdit }: TableViewProps) {
    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [startDate, setStartDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    })

    // Sort state
    const [sortField, setSortField] = useState<SortField>('time')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Filtered and sorted data
    const filteredAndSortedEvents = useMemo(() => {
        let filtered = events.filter(item => {
            // Search filter
            if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Date range filter
            const itemDate = item.start_time || item.due_date || item.created_at
            if (itemDate && startDate && endDate) {
                const date = new Date(itemDate)
                const start = new Date(startDate)
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (date < start || date > end) {
                    return false
                }
            }

            return true
        })

        // Sort
        filtered.sort((a, b) => {
            let aVal: any, bVal: any

            switch (sortField) {
                case 'title':
                    aVal = a.title.toLowerCase()
                    bVal = b.title.toLowerCase()
                    break
                case 'status':
                    aVal = a.status
                    bVal = b.status
                    break
                case 'domain':
                    aVal = a.domain
                    bVal = b.domain
                    break
                case 'time':
                    aVal = new Date(a.start_time || a.due_date || a.created_at || 0).getTime()
                    bVal = new Date(b.start_time || b.due_date || b.created_at || 0).getTime()
                    break
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    aVal = priorityOrder[a.priority] || 0
                    bVal = priorityOrder[b.priority] || 0
                    break
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [events, searchQuery, startDate, endDate, sortField, sortDirection])

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'done':
            case 'completed':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'doing':
            case 'in_progress':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'todo':
            default:
                return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-500'
            case 'medium': return 'text-orange-500'
            case 'low': return 'text-blue-500'
            default: return 'text-neutral-500'
        }
    }

    const getDomainColor = (domain: ItemDomain) => {
        switch (domain) {
            case 'work': return '#3b82f6'
            case 'study': return '#8b5cf6'
            case 'life': return '#10b981'
            case 'invest': return '#f59e0b'
            default: return '#6b7280'
        }
    }

    const getTimeLabel = (item: CalendarItem) => {
        if (item.type === 'event' && item.start_time) {
            return moment(item.start_time).format('MMM D, h:mm A')
        }
        if (item.due_date) {
            return moment(item.due_date).format('MMM D, YYYY')
        }
        return '-'
    }

    const getPerformanceLabel = (item: CalendarItem) => {
        if (item.type === 'task' && item.estimate_minutes) {
            const estimate = item.estimate_minutes
            const actual = item.actual_minutes || 0
            if (actual > 0) {
                const diff = actual - estimate
                const color = diff <= 0 ? '#10b981' : '#ef4444'
                return (
                    <span style={{ color, fontSize: '0.75rem' }}>
                        {actual}m / {estimate}m {diff !== 0 && `(${diff > 0 ? '+' : ''}${diff}m)`}
                    </span>
                )
            }
            return <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Est: {estimate}m</span>
        }
        if (item.type === 'habit' && item.metadata?.habit_streak !== undefined) {
            const streak = item.metadata.habit_streak
            const target = item.metadata.target_streak || 30
            return (
                <span style={{ fontSize: '0.75rem', color: streak >= target ? '#10b981' : '#9ca3af' }}>
                    🔥 {streak} / {target}
                </span>
            )
        }
        return <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>-</span>
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#121212]">
            {/* Filter Bar */}
            <div style={filterBarStyle}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title..."
                        style={searchInputStyle}
                    />
                </div>

                {/* Date Range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={dateInputStyle}
                    />
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>—</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={dateInputStyle}
                    />
                </div>

                {/* Clear Filters */}
                <button
                    onClick={() => {
                        setSearchQuery('')
                        const now = new Date()
                        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
                        setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0])
                    }}
                    style={clearBtnStyle}
                >
                    Clear Filters
                </button>

                <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#9ca3af' }}>
                    {filteredAndSortedEvents.length} of {events.length} items
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#141414] z-10 shadow-sm">
                        <tr>
                            <th style={thStyle} onClick={() => handleSort('title')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    Title <SortIcon field="title" />
                                </div>
                            </th>
                            <th style={thStyle} onClick={() => handleSort('status')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    Status <SortIcon field="status" />
                                </div>
                            </th>
                            <th style={thStyle} onClick={() => handleSort('domain')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    Domain <SortIcon field="domain" />
                                </div>
                            </th>
                            <th style={thStyle} onClick={() => handleSort('time')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    Time / Due <SortIcon field="time" />
                                </div>
                            </th>
                            <th style={thStyle} onClick={() => handleSort('priority')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    Priority <SortIcon field="priority" />
                                </div>
                            </th>
                            <th style={thStyle}>Performance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredAndSortedEvents.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onEdit(item)}
                                style={rowStyle}
                                className="group"
                            >
                                <td style={tdStyle}>
                                    <div style={{ fontWeight: 500, color: '#e5e5e5' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#737373', textTransform: 'capitalize' }}>{item.type}</div>
                                </td>
                                <td style={tdStyle}>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: getDomainColor(item.domain) }} />
                                        <span style={{ fontSize: '0.875rem', color: '#a3a3a3', textTransform: 'capitalize' }}>{item.domain}</span>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '0.875rem', color: '#d4d4d4' }}>{getTimeLabel(item)}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ color: getPriorityColor(item.priority), fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                        {item.priority}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {getPerformanceLabel(item)}
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedEvents.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#525252' }}>No items found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const filterBarStyle: React.CSSProperties = {
    padding: '1rem 1.5rem',
    background: '#0D0D0D',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
}

const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem 0.5rem 2.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none'
}

const dateInputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    background: '#2d2d2d',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    colorScheme: 'dark'
}

const clearBtnStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '0.5rem',
    color: '#9ca3af',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
}

const thStyle: React.CSSProperties = {
    padding: '1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    userSelect: 'none'
}

const tdStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
}

const rowStyle: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'background 0.2s'
}
