import { useState, useEffect, useMemo } from 'react'
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DropAnimation,
    UniqueIdentifier
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import moment from 'moment'
import { Clock, CheckSquare } from 'lucide-react'
import { CalendarItem, ItemStatus, ItemDomain } from '../../../shared/types'

interface KanbanViewProps {
    events: CalendarItem[]
    onEdit: (item: CalendarItem) => void
    onStatusChange?: (id: number, newStatus: ItemStatus) => void
}

type ColumnType = 'todo' | 'doing' | 'done'

interface KanbanItems {
    todo: CalendarItem[]
    doing: CalendarItem[]
    done: CalendarItem[]
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: '0.5' } },
    }),
}

export function KanbanView({ events, onEdit, onStatusChange }: KanbanViewProps) {
    const [items, setItems] = useState<KanbanItems>({
        todo: [],
        doing: [],
        done: []
    })
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
    const [dateFilter, setDateFilter] = useState<'all' | 'month'>('month')

    // Filter events by date
    const filteredEvents = useMemo(() => {
        if (dateFilter === 'all') return events

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        return events.filter(item => {
            const itemDate = item.start_time || item.due_date || item.created_at
            if (!itemDate) return true // Include items without dates
            const date = new Date(itemDate)
            return date >= monthStart && date <= monthEnd
        })
    }, [events, dateFilter])

    useEffect(() => {
        const newItems: KanbanItems = { todo: [], doing: [], done: [] }
        filteredEvents.forEach(item => {
            if (item.status === 'done') newItems.done.push(item)
            else if (item.status === 'doing') newItems.doing.push(item)
            else newItems.todo.push(item)
        })
        setItems(newItems)
    }, [filteredEvents])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const findContainer = (id: UniqueIdentifier): ColumnType | undefined => {
        if (id in items) return id as ColumnType
        return (Object.keys(items) as ColumnType[]).find(key =>
            items[key].find(item => item.id?.toString() === id.toString())
        )
    }

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id)

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const activeContainer = findContainer(active.id)
        const overContainer = findContainer(over.id)

        if (!activeContainer || !overContainer || activeContainer === overContainer) return

        setItems(prev => {
            const activeItems = prev[activeContainer]
            const activeIndex = activeItems.findIndex(i => i.id?.toString() === active.id.toString())
            const activeItem = activeItems[activeIndex]

            return {
                ...prev,
                [activeContainer]: prev[activeContainer].filter(i => i.id !== activeItem.id),
                [overContainer]: [...prev[overContainer], activeItem]
            }
        })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        const activeContainer = findContainer(active.id)
        const overContainer = over ? findContainer(over.id) : null

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            const id = Number(active.id)
            if (onStatusChange) onStatusChange(id, overContainer as ItemStatus)
        }
        setActiveId(null)
    }

    const activeItem = activeId ? Object.values(items).flat().find(i => i.id?.toString() === activeId.toString()) : null

    return (
        <div className="flex flex-col h-full">
            {/* Filter Bar */}
            <div style={filterBarStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Show:</span>
                    <div style={toggleGroupStyle}>
                        <button
                            onClick={() => setDateFilter('month')}
                            style={{
                                ...toggleBtnStyle,
                                background: dateFilter === 'month' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: dateFilter === 'month' ? '#60a5fa' : '#9ca3af'
                            }}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setDateFilter('all')}
                            style={{
                                ...toggleBtnStyle,
                                background: dateFilter === 'all' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: dateFilter === 'all' ? '#60a5fa' : '#9ca3af'
                            }}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#9ca3af' }}>
                    {filteredEvents.length} items
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <div className="flex h-full overflow-x-auto gap-6 p-6">
                        <SortableColumn id="todo" title="Todo" items={items.todo} onEdit={onEdit} />
                        <SortableColumn id="doing" title="In Progress" items={items.doing} onEdit={onEdit} />
                        <SortableColumn id="done" title="Completed" items={items.done} onEdit={onEdit} />
                    </div>
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeItem ? <KanbanCard item={activeItem} onClick={() => { }} isOverlay /> : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    )
}

function SortableColumn({ id, title, items, onEdit }: { id: string, title: string, items: CalendarItem[], onEdit: (i: CalendarItem) => void }) {
    const { setNodeRef } = useSortable({ id })
    return (
        <SortableContext id={id} items={items.map(i => i.id?.toString() || '')} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className="flex-1 min-w-[320px] flex flex-col bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{title}</h3>
                    <span className="text-xs font-medium text-neutral-600 bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {items.map(item => <SortableItem key={item.id} item={item} onEdit={onEdit} />)}
                    {items.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#525252', fontSize: '0.875rem' }}>
                            No items
                        </div>
                    )}
                </div>
            </div>
        </SortableContext>
    )
}

function SortableItem({ item, onEdit }: { item: CalendarItem, onEdit: (i: CalendarItem) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id?.toString() || '' })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}><KanbanCard item={item} onClick={() => onEdit(item)} /></div>
}

function KanbanCard({ item, onClick, isOverlay }: { item: CalendarItem, onClick: () => void, isOverlay?: boolean }) {
    const getDomainColor = (domain: ItemDomain) => {
        switch (domain) {
            case 'work': return '#3b82f6'
            case 'study': return '#8b5cf6'
            case 'life': return '#10b981'
            case 'invest': return '#f59e0b'
            default: return '#6b7280'
        }
    }

    const getChecklistProgress = () => {
        if (!item.checklist || item.checklist.length === 0) return null
        const completed = item.checklist.filter(c => c.completed).length
        const total = item.checklist.length
        const percentage = (completed / total) * 100
        return { completed, total, percentage }
    }

    const checklistProgress = getChecklistProgress()
    const isDone = item.status === 'done'
    const canToggle = item.type === 'task' || item.type === 'habit'

    // Handle checkbox toggle
    const handleCheckboxClick = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening modal
        try {
            const newStatus = isDone ? 'todo' : 'done'
            console.log('[KanbanCard] Toggling status:', item.id, 'from', item.status, 'to', newStatus)

            // Optimistic UI: Update immediately
            item.status = newStatus

            // Update via API
            await window.api.updateCalendarItem(item.id!.toString(), { status: newStatus })

            // Trigger silent refresh
            window.dispatchEvent(new Event('calendar-item-updated'))
        } catch (error) {
            console.error('[KanbanCard] Failed to toggle status:', error)
            // Revert optimistic update on error
            item.status = isDone ? 'done' : 'todo'
        }
    }

    return (
        <div
            onClick={onClick}
            style={{
                borderLeft: `4px solid ${getDomainColor(item.domain)}`,
                background: '#2d2d2d', /* Subtle background */
                padding: '12px', /* Consistent padding */
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: isDone ? 0.7 : 1 /* Dim completed */
            }}
            className={`shadow-sm hover:border-white/20 group relative ${isOverlay ? 'scale-105 shadow-2xl z-50 ring-2 ring-blue-500' : ''}`}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {canToggle && (
                    <input
                        type="checkbox"
                        checked={isDone}
                        onClick={handleCheckboxClick}
                        style={{
                            flexShrink: 0,
                            cursor: 'pointer',
                            width: '14px',
                            height: '14px'
                        }}
                    />
                )}
                <span style={{
                    fontSize: '0.6875rem', /* 11px */
                    fontWeight: 600,
                    color: '#9ca3af', /* Gray */
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                }}>
                    {item.domain} • {item.metadata?.topic || 'General'}
                </span>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.625rem', /* 10px */
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f97316' : '#3b82f6'
                }}>
                    {item.priority}
                </span>
            </div>

            {/* Title */}
            <h4 style={{
                fontSize: '0.875rem', /* 14px */
                fontWeight: 700, /* Bold */
                color: '#ffffff', /* White */
                marginBottom: '8px',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textDecoration: isDone ? 'line-through' : 'none' /* Strikethrough for done */
            }}>
                {item.title}
            </h4>

            {/* Checklist Progress */}
            {checklistProgress && (
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <CheckSquare size={12} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {checklistProgress.completed}/{checklistProgress.total}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${checklistProgress.percentage}%`,
                            height: '100%',
                            background: checklistProgress.percentage === 100 ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-600 border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5">
                    <Clock size={10} />
                    <span>
                        {item.due_date ? moment(item.due_date).format('MMM D') : item.start_time ? moment(item.start_time).format('MMM D, h:mm A') : 'No date'}
                    </span>
                </div>

                {/* Type Badge */}
                <span style={{
                    padding: '2px 6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    fontSize: '0.625rem',
                    textTransform: 'capitalize',
                    color: '#9ca3af'
                }}>
                    {item.type}
                </span>
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
    gap: '1rem'
}

const toggleGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '2px',
    borderRadius: '8px'
}

const toggleBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
}
