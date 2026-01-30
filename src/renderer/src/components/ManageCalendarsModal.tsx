import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarSource } from '../../../shared/types'

interface ManageCalendarsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ManageCalendarsModal({ isOpen, onClose }: ManageCalendarsModalProps) {
    const [calendars, setCalendars] = useState<CalendarSource[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [newCalendar, setNewCalendar] = useState({
        name: '',
        url: '',
        color: '#3b82f6'
    })

    useEffect(() => {
        if (isOpen) {
            loadCalendars()
        }
    }, [isOpen])

    const loadCalendars = async () => {
        try {
            const sources = await window.api.getCalendarSources()
            setCalendars(sources)
        } catch (error) {
            console.error('Failed to load calendar sources:', error)
        }
    }

    const handleAddCalendar = async () => {
        if (!newCalendar.name || !newCalendar.url) return

        try {
            await window.api.addCalendarSource({
                name: newCalendar.name,
                url: newCalendar.url,
                color: newCalendar.color,
                enabled: true
            })
            setNewCalendar({ name: '', url: '', color: '#3b82f6' })
            setIsAdding(false)
            loadCalendars()
        } catch (error) {
            console.error('Failed to add calendar source:', error)
        }
    }

    const handleToggleCalendar = async (id: number, enabled: boolean) => {
        try {
            await window.api.updateCalendarSource(id, { enabled: !enabled })
            loadCalendars()
        } catch (error) {
            console.error('Failed to toggle calendar:', error)
        }
    }

    const handleDeleteCalendar = async (id: number) => {
        if (!confirm('Are you sure you want to delete this calendar source?')) return

        try {
            await window.api.deleteCalendarSource(id)
            loadCalendars()
        } catch (error) {
            console.error('Failed to delete calendar:', error)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: '#171717',
                        borderRadius: '1rem',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        border: '1px solid #262626'
                    }}
                >
                    <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>
                        Manage Calendars
                    </h2>

                    {/* Calendar List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        {calendars.map((calendar) => (
                            <div
                                key={calendar.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#262626',
                                    borderRadius: '0.5rem',
                                    border: `2px solid ${calendar.enabled ? calendar.color : '#404040'}`
                                }}
                            >
                                <div
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        backgroundColor: calendar.color
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{calendar.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {calendar.url}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleCalendar(calendar.id!, calendar.enabled)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: calendar.enabled ? '#22c55e' : '#404040',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {calendar.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                                <button
                                    onClick={() => handleDeleteCalendar(calendar.id!)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}

                        {calendars.length === 0 && !isAdding && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#737373' }}>
                                No calendars added yet. Add your first calendar!
                            </div>
                        )}
                    </div>

                    {/* Add New Calendar Form */}
                    {isAdding ? (
                        <div style={{ padding: '1rem', backgroundColor: '#262626', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Add New Calendar</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#a3a3a3' }}>
                                        Calendar Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCalendar.name}
                                        onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                                        placeholder="e.g., Personal, School, Work"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            backgroundColor: '#171717',
                                            border: '1px solid #404040',
                                            borderRadius: '0.375rem',
                                            color: '#fff',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#a3a3a3' }}>
                                        iCal URL (Secret Address)
                                    </label>
                                    <input
                                        type="text"
                                        value={newCalendar.url}
                                        onChange={(e) => setNewCalendar({ ...newCalendar, url: e.target.value })}
                                        placeholder="https://calendar.google.com/calendar/ical/..."
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            backgroundColor: '#171717',
                                            border: '1px solid #404040',
                                            borderRadius: '0.375rem',
                                            color: '#fff',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#a3a3a3' }}>
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        value={newCalendar.color}
                                        onChange={(e) => setNewCalendar({ ...newCalendar, color: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            backgroundColor: '#171717',
                                            border: '1px solid #404040',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={handleAddCalendar}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        Add Calendar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAdding(false)
                                            setNewCalendar({ name: '', url: '', color: '#3b82f6' })
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            backgroundColor: '#404040',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#262626',
                                color: '#fff',
                                border: '1px dashed #404040',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                marginBottom: '1rem'
                            }}
                        >
                            + Add New Calendar
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#404040',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Close
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
