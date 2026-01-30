import React, { useState, useEffect } from 'react'
import {
    X, Clock, Tag, Calendar, AlignLeft,
    Repeat, Target, TrendingUp, Flag
} from 'lucide-react'
import { ItemType, ItemDomain, ItemPriority, ItemStatus, CalendarItem } from '../../../shared/types'
import './CreateItemModal.css'

interface CreateItemModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialDate?: Date | null
    initialDomain?: ItemDomain | 'all'
    initialItem?: CalendarItem | null
}

type RecurrenceOption = 'none' | 'daily' | 'weekly' | 'monthly'

const DOMAIN_TOPICS: Record<ItemDomain, string[]> = {
    work: ['Project', 'Meeting', 'Deep Work', 'Admin'],
    life: ['Health', 'Family', 'Chores', 'Entertainment'],
    study: ['Course', 'Reading', 'Assignment', 'Research'],
    invest: ['Stock', 'Crypto', 'Real Estate', 'Savings']
}

export function CreateItemModal({
    isOpen,
    onClose,
    onSuccess,
    initialDate,
    initialDomain,
    initialItem
}: CreateItemModalProps) {
    const [itemType, setItemType] = useState<ItemType>('task')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [showDescription, setShowDescription] = useState(false)
    const [domain, setDomain] = useState<ItemDomain>('work')
    const [topic, setTopic] = useState('')
    const [startDate, setStartDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [priority, setPriority] = useState<ItemPriority>('medium')
    const [status, setStatus] = useState<ItemStatus>('todo') // NEW: For tasks/milestones
    const [estimatedTime, setEstimatedTime] = useState('')
    const [recurrence, setRecurrence] = useState<RecurrenceOption>('none')
    const [targetStreak, setTargetStreak] = useState('')
    const [ticker, setTicker] = useState('')
    const [amount, setAmount] = useState('')
    const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy')
    const [isAllDay, setIsAllDay] = useState(true) // DEFAULT: All-day events
    const [endTimeDirty, setEndTimeDirty] = useState(false) // NEW: Track if user manually set end time
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize form
    useEffect(() => {
        if (isOpen) {
            if (initialItem) {
                setItemType(initialItem.type)
                setTitle(initialItem.title)
                setDescription(initialItem.description || '')
                setShowDescription(!!initialItem.description)
                setDomain(initialItem.domain)
                setPriority(initialItem.priority)

                const meta = initialItem.metadata || {}
                setTopic(meta.topic || '')

                if (initialItem.type === 'event') {
                    if (initialItem.start_time) {
                        const [d, t] = initialItem.start_time.split('T')
                        setStartDate(d)
                        setStartTime(t ? t.slice(0, 5) : '')
                    }
                    if (initialItem.end_time) {
                        const [d, t] = initialItem.end_time.split('T')
                        setEndDate(d)
                        setEndTime(t ? t.slice(0, 5) : '')
                    }
                } else if (initialItem.type === 'task' || initialItem.type === 'milestone') {
                    if (initialItem.due_date) {
                        const d = initialItem.due_date.split('T')[0]
                        setDueDate(d)
                        setTargetDate(d)
                    }
                    if (initialItem.estimate_minutes) setEstimatedTime(initialItem.estimate_minutes.toString())
                }

                if (initialItem.type === 'habit') {
                    setRecurrence(meta.habit_frequency as any || 'daily')
                    if (meta.target_streak) setTargetStreak(meta.target_streak.toString())
                }

                if (initialItem.domain === 'invest') {
                    setTicker(meta.ticker || '')
                    setAmount(meta.amount?.toString() || '')
                    setTransactionType(meta.transaction_type as any || 'buy')
                }
            } else {
                if (initialDomain && initialDomain !== 'all') {
                    setDomain(initialDomain as ItemDomain)
                }

                if (initialDate) {
                    const isoDate = initialDate.toISOString().split('T')[0]
                    setStartDate(isoDate)
                    setDueDate(isoDate)
                    setTargetDate(isoDate)
                    setEndDate(isoDate)
                }
            }
        }
    }, [isOpen, initialDate, initialDomain, initialItem])

    useEffect(() => {
        const topics = DOMAIN_TOPICS[domain]
        if (topics && topics.length > 0 && !topic) {
            setTopic(topics[0])
        }
    }, [domain])

    // Smart time default: Auto-set end time to start + 1 hour
    useEffect(() => {
        if (itemType === 'event' && startTime && !endTimeDirty && !isAllDay) {
            // Convert to 24-hour, add 1 hour, convert back to 12-hour
            const time24 = convertTo24Hour(convertTo12Hour(startTime))
            const [hours, minutes] = time24.split(':')
            const endHour = (parseInt(hours) + 1) % 24
            const endTime24 = `${endHour.toString().padStart(2, '0')}:${minutes}`
            setEndTime(endTime24)
        }
    }, [startTime, itemType, endTimeDirty, isAllDay])

    // Helper function to format minutes as "1h 30m"
    const formatTime = (minutes: string): string => {
        const mins = parseInt(minutes)
        if (isNaN(mins) || mins === 0) return ''
        const hours = Math.floor(mins / 60)
        const remainingMins = mins % 60
        if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`
        if (hours > 0) return `${hours}h`
        return `${remainingMins}m`
    }

    // Helper function to generate time options (15-minute intervals)
    const generateTimeOptions = (): string[] => {
        const options: string[] = []
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                const ampm = hour < 12 ? 'AM' : 'PM'
                const minuteStr = minute.toString().padStart(2, '0')
                options.push(`${hour12}:${minuteStr} ${ampm}`)
            }
        }
        return options
    }

    // Convert 12-hour format to 24-hour format for storage
    const convertTo24Hour = (time12: string): string => {
        const [time, period] = time12.split(' ')
        const [hours, minutes] = time.split(':')
        let hour = parseInt(hours)

        if (period === 'PM' && hour !== 12) hour += 12
        if (period === 'AM' && hour === 12) hour = 0

        return `${hour.toString().padStart(2, '0')}:${minutes}`
    }

    // Convert 24-hour format to 12-hour format for display
    const convertTo12Hour = (time24: string): string => {
        if (!time24) return ''
        const [hours, minutes] = time24.split(':')
        let hour = parseInt(hours)
        const ampm = hour < 12 ? 'AM' : 'PM'

        if (hour === 0) hour = 12
        else if (hour > 12) hour -= 12

        return `${hour}:${minutes} ${ampm}`
    }

    const timeOptions = generateTimeOptions()

    useEffect(() => {
        if (!isOpen) {
            // CRITICAL: Reset all state when modal closes to prevent state persistence
            setTimeout(() => {
                setItemType('task')
                setTitle('')
                setDescription('')
                setShowDescription(false)
                setTopic('')
                setStartDate('')
                setStartTime('')
                setEndDate('')
                setEndTime('')
                setDueDate('')
                setTargetDate('')
                setPriority('medium')
                setStatus('todo') // RESET: Always default to 'todo'
                setEstimatedTime('')
                setRecurrence('none')
                setTargetStreak('')
                setTicker('')
                setAmount('')
                setTransactionType('buy')
                setIsAllDay(true) // RESET: Always default to all-day
                setEndTimeDirty(false) // RESET: Clear manual edit flag
            }, 300)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        setIsSubmitting(true)

        try {
            const metadata: any = { topic }

            if (itemType === 'habit') {
                metadata.habit_streak = initialItem?.metadata?.habit_streak || 0
                metadata.habit_frequency = recurrence !== 'none' ? recurrence : 'daily'
                if (targetStreak) metadata.target_streak = parseInt(targetStreak)
            } else if (itemType === 'invest') {
                metadata.ticker = ticker.toUpperCase()
                metadata.amount = parseFloat(amount)
                metadata.transaction_type = transactionType
            }

            const itemData: any = {
                title: title.trim(),
                description: description.trim() || undefined,
                type: itemType,
                domain: domain,
                status: status, // Use the status from state
                priority: priority,
                metadata: metadata
            }

            // Handle time fields based on item type
            if (itemType === 'event') {
                // Events: Require start/end time, store as LOCAL time (no Z suffix)
                if (!startDate) {
                    alert('Events require a start date.')
                    setIsSubmitting(false)
                    return
                }

                // Handle all-day events
                itemData.is_all_day = isAllDay
                if (isAllDay) {
                    itemData.start_time = `${startDate}T00:00:00`
                    itemData.end_time = `${endDate || startDate}T23:59:59`
                } else {
                    if (!startTime) {
                        alert('Events require a start time.')
                        setIsSubmitting(false)
                        return
                    }
                    itemData.start_time = `${startDate}T${startTime}:00`
                    itemData.end_time = `${endDate || startDate}T${endTime || startTime}:00`
                }
            } else if (itemType === 'task') {
                // Tasks: Require due date, store as end of day
                if (!dueDate) {
                    alert('Tasks require a due date.')
                    setIsSubmitting(false)
                    return
                }
                itemData.due_date = `${dueDate}T23:59:59`
                if (estimatedTime) itemData.estimate_minutes = parseInt(estimatedTime)
            } else if (itemType === 'milestone') {
                // Milestones: Require target date, always all-day
                if (!targetDate) {
                    alert('Milestones require a target date.')
                    setIsSubmitting(false)
                    return
                }
                itemData.due_date = `${targetDate}T23:59:59`
            } else if (itemType === 'habit') {
                // Habits: Store start date for recurrence calculation
                if (!startDate) {
                    alert('Habits require a start date.')
                    setIsSubmitting(false)
                    return
                }
                itemData.start_time = `${startDate}T00:00:00`
            }

            console.log('[CreateItemModal] Saving item:', itemData)

            if (initialItem?.id) {
                console.log('[CreateItemModal] Updating existing item:', initialItem.id)
                await window.api.calendar.updateCalendarItem(initialItem.id.toString(), itemData)
                console.log('[CreateItemModal] Update successful')
            } else {
                console.log('[CreateItemModal] Creating new item')
                const result = await window.api.calendar.createCalendarItem(itemData)
                console.log('[CreateItemModal] Create successful, result:', result)
            }

            console.log('[CreateItemModal] Calling onSuccess callback')
            onSuccess()
            console.log('[CreateItemModal] Closing modal')
            onClose()
        } catch (error) {
            console.error('[ItemModal] Save Failure:', error)
            alert('Error saving data.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!initialItem?.id) return

        // --- GOOGLE CALENDAR DELETE ---
        if (initialItem.id.toString().startsWith('gcal-')) {
            const confirmed = window.confirm("Do you want to delete this event from Google Calendar? This cannot be undone.")
            if (!confirmed) return

            try {
                setIsSubmitting(true)
                const googleId = initialItem.id.toString().replace('gcal-', '')
                await window.api.calendar.deleteGoogleEvent(googleId)

                // Refresh UI
                onSuccess()
                onClose()
            } catch (error) {
                console.error('[ItemModal] Google Event Delete Failure:', error)
                alert('Failed to delete Google event.')
            } finally {
                setIsSubmitting(false)
            }
            return
        }

        // --- LOCAL DB DELETE ---
        const confirmed = window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)
        if (!confirmed) return

        try {
            setIsSubmitting(true)
            // Use namespace .calendar
            const success = await window.api.calendar.deleteCalendarItem(initialItem.id.toString())
            if (success) {
                onSuccess()
                onClose()
            } else {
                alert('Failed to delete item.')
            }
        } catch (error) {
            console.error('[ItemModal] Delete Failure:', error)
            alert('Error deleting item.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    const availableTopics = DOMAIN_TOPICS[domain] || []

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="modal-close" onClick={onClose}>
                    <X size={18} />
                </button>

                <form onSubmit={handleSubmit}>
                    {/* Title Input - Large, Borderless */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add title"
                        required
                        autoFocus
                        className="title-input"
                    />

                    {/* Type Tabs */}
                    <div className="type-tabs">
                        {(['task', 'event', 'milestone', 'habit'] as ItemType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setItemType(type)}
                                className={`type-tab ${itemType === type ? 'active' : ''}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Metadata Rows */}
                    <div className="metadata-section">
                        {/* Time Row */}
                        {itemType === 'event' && (
                            <div className="meta-row">
                                <Calendar size={18} className="meta-icon" />
                                <div className="meta-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {/* Date Picker */}
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="inline-input"
                                        style={{ minWidth: '140px' }}
                                    />

                                    {/* All-Day: Show "+ Add time" button */}
                                    {isAllDay && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAllDay(false)
                                                // Set default times
                                                setStartTime('09:00')
                                                setEndTime('10:00')
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #444',
                                                borderRadius: '6px',
                                                padding: '4px 10px',
                                                color: '#9ca3af',
                                                fontSize: '0.8125rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#666'
                                                e.currentTarget.style.color = '#d1d5db'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#444'
                                                e.currentTarget.style.color = '#9ca3af'
                                            }}
                                        >
                                            <span>+</span>
                                            <span>Add time</span>
                                        </button>
                                    )}

                                    {/* Timed Event: Show time pickers */}
                                    {!isAllDay && (
                                        <>
                                            <select
                                                value={convertTo12Hour(startTime)}
                                                onChange={(e) => {
                                                    const time24 = convertTo24Hour(e.target.value)
                                                    setStartTime(time24)
                                                }}
                                                className="inline-select"
                                                style={{
                                                    minWidth: '100px',
                                                    cursor: 'pointer',
                                                    maxHeight: '250px'
                                                }}
                                            >
                                                <option value="">Start time</option>
                                                {timeOptions.map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>

                                            <span className="separator" style={{ color: '#6b7280' }}>-</span>

                                            <select
                                                value={convertTo12Hour(endTime)}
                                                onChange={(e) => {
                                                    const time24 = convertTo24Hour(e.target.value)
                                                    setEndTime(time24)
                                                    setEndTimeDirty(true)
                                                }}
                                                className="inline-select"
                                                style={{
                                                    minWidth: '100px',
                                                    cursor: 'pointer',
                                                    maxHeight: '250px'
                                                }}
                                            >
                                                <option value="">End time</option>
                                                {timeOptions.map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>

                                            {/* Remove time button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsAllDay(true)
                                                    setStartTime('')
                                                    setEndTime('')
                                                    setEndTimeDirty(false)
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#6b7280',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    transition: 'color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                                                title="Remove time (all-day)"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {itemType === 'task' && (
                            <>
                                {/* Due Date */}
                                <div className="meta-row">
                                    <Calendar size={18} className="meta-icon" />
                                    <div className="meta-content">
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="inline-input"
                                            placeholder="Due date"
                                        />
                                    </div>
                                </div>

                                {/* Status Dropdown */}
                                <div className="meta-row">
                                    <Target size={18} className="meta-icon" />
                                    <div className="meta-content">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as ItemStatus)}
                                            className="inline-select"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="todo">📋 To Do</option>
                                            <option value="doing">⚡ Doing</option>
                                            <option value="done">✅ Done</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Estimate Time */}
                                <div className="meta-row">
                                    <Clock size={18} className="meta-icon" />
                                    <div className="meta-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="number"
                                            value={estimatedTime}
                                            onChange={(e) => setEstimatedTime(e.target.value)}
                                            className="inline-input"
                                            placeholder="Est. minutes"
                                            min="0"
                                            style={{ width: '120px' }}
                                        />
                                        {estimatedTime && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#6b7280',
                                                fontWeight: 500
                                            }}>
                                                {formatTime(estimatedTime)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {itemType === 'milestone' && (
                            <>
                                {/* Target Date */}
                                <div className="meta-row">
                                    <Target size={18} className="meta-icon" />
                                    <div className="meta-content">
                                        <input
                                            type="date"
                                            value={targetDate}
                                            onChange={(e) => setTargetDate(e.target.value)}
                                            className="inline-input"
                                            placeholder="Target date"
                                        />
                                    </div>
                                </div>

                                {/* Status Dropdown */}
                                <div className="meta-row">
                                    <Flag size={18} className="meta-icon" />
                                    <div className="meta-content">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as ItemStatus)}
                                            className="inline-select"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="todo">⏳ Pending</option>
                                            <option value="done">🎯 Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Domain & Topic Row */}
                        <div className="meta-row">
                            <Tag size={18} className="meta-icon" />
                            <div className="meta-content">
                                <select value={domain} onChange={(e) => setDomain(e.target.value as any)} className="inline-select">
                                    <option value="work">Work</option>
                                    <option value="life">Life</option>
                                    <option value="study">Study</option>
                                    <option value="invest">Invest</option>
                                </select>
                                <span className="separator">•</span>
                                <select value={topic} onChange={(e) => setTopic(e.target.value)} className="inline-select">
                                    {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Priority Row (Tasks) */}
                        {itemType === 'task' && (
                            <div className="meta-row">
                                <Flag size={18} className="meta-icon" />
                                <div className="meta-content">
                                    <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="inline-select">
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                    {estimatedTime !== '' || itemType === 'task' ? (
                                        <>
                                            <span className="separator">•</span>
                                            <input
                                                type="number"
                                                value={estimatedTime}
                                                onChange={(e) => setEstimatedTime(e.target.value)}
                                                placeholder="Est. mins"
                                                className="inline-input small"
                                            />
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {/* Habit Row */}
                        {itemType === 'habit' && (
                            <div className="meta-row">
                                <Repeat size={18} className="meta-icon" />
                                <div className="meta-content">
                                    <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)} className="inline-select">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <span className="separator">•</span>
                                    <input
                                        type="number"
                                        value={targetStreak}
                                        onChange={(e) => setTargetStreak(e.target.value)}
                                        placeholder="Target streak"
                                        className="inline-input small"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Investment Row */}
                        {domain === 'invest' && (
                            <div className="meta-row">
                                <TrendingUp size={18} className="meta-icon" />
                                <div className="meta-content">
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value)}
                                        placeholder="Ticker"
                                        className="inline-input small"
                                    />
                                    <span className="separator">•</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Amount"
                                        className="inline-input small"
                                    />
                                    <span className="separator">•</span>
                                    <div className="toggle-group">
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('buy')}
                                            className={`toggle - btn ${transactionType === 'buy' ? 'active buy' : ''} `}
                                        >
                                            Buy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('sell')}
                                            className={`toggle - btn ${transactionType === 'sell' ? 'active sell' : ''} `}
                                        >
                                            Sell
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description Row */}
                        {!showDescription ? (
                            <button
                                type="button"
                                className="add-description-btn"
                                onClick={() => setShowDescription(true)}
                            >
                                <AlignLeft size={18} className="meta-icon" />
                                Add description
                            </button>
                        ) : (
                            <div className="meta-row">
                                <AlignLeft size={18} className="meta-icon" />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add description..."
                                    rows={3}
                                    className="description-textarea"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        {initialItem && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="delete-btn"
                            >
                                Delete
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting} className="save-btn">
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
