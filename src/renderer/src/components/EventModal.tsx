import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Calendar, CheckSquare } from 'lucide-react'
import { clsx } from 'clsx'
import moment from 'moment'

interface EventModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: EventFormData) => Promise<void>
    onDelete?: () => Promise<void>
    initialData?: EventFormData | null
    defaultStart?: Date
    defaultEnd?: Date
}

export interface EventFormData {
    id?: number
    type: 'event' | 'task'
    title: string
    description: string
    start_time: string
    end_time: string
    category: string
    color: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'todo' | 'in_progress' | 'done'
}

const CATEGORIES = [
    { value: 'work', label: 'Work', color: '#3b82f6', emoji: '💼' },
    { value: 'study', label: 'Study', color: '#8b5cf6', emoji: '📚' },
    { value: 'personal', label: 'Personal', color: '#10b981', emoji: '🏠' },
    { value: 'health', label: 'Health', color: '#f59e0b', emoji: '💪' },
    { value: 'general', label: 'General', color: '#6b7280', emoji: '📌' }
]

const PRIORITIES = [
    { value: 'low', label: 'Low', color: '#6b7280' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' }
]

const STATUSES = [
    { value: 'todo', label: 'To Do', color: '#6b7280' },
    { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'done', label: 'Done', color: '#10b981' }
]

export function EventModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    defaultStart,
    defaultEnd
}: EventModalProps) {
    const isEditMode = !!initialData?.id

    const { register, handleSubmit, watch, setValue, reset } = useForm<EventFormData>({
        defaultValues: {
            type: 'event',
            title: '',
            description: '',
            start_time: defaultStart ? moment(defaultStart).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm'),
            end_time: defaultEnd ? moment(defaultEnd).format('YYYY-MM-DDTHH:mm') : moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
            category: 'general',
            color: '#6b7280',
            priority: 'medium',
            status: 'todo'
        }
    })

    const itemType = watch('type')
    const selectedCategory = watch('category')

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                start_time: moment(initialData.start_time).format('YYYY-MM-DDTHH:mm'),
                end_time: moment(initialData.end_time).format('YYYY-MM-DDTHH:mm')
            })
        } else if (defaultStart && defaultEnd) {
            setValue('start_time', moment(defaultStart).format('YYYY-MM-DDTHH:mm'))
            setValue('end_time', moment(defaultEnd).format('YYYY-MM-DDTHH:mm'))
        }
    }, [initialData, defaultStart, defaultEnd, reset, setValue])

    useEffect(() => {
        const category = CATEGORIES.find(c => c.value === selectedCategory)
        if (category) {
            setValue('color', category.color)
        }
    }, [selectedCategory, setValue])

    const onSubmit = async (data: EventFormData) => {
        await onSave(data)
        reset()
        onClose()
    }

    const handleDelete = async () => {
        if (onDelete && confirm('Are you sure you want to delete this item?')) {
            await onDelete()
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                className="relative"
                style={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    width: '500px',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {isEditMode ? 'Edit Item' : 'Create Item'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#737373',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                e.currentTarget.style.color = '#fff'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#737373'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Item Type Toggle */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '0.25rem',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                gap: '0.25rem'
                            }}
                        >
                            {[
                                { value: 'event' as const, icon: Calendar, label: 'Event', emoji: '🗓️' },
                                { value: 'task' as const, icon: CheckSquare, label: 'Task', emoji: '✅' }
                            ].map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setValue('type', type.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 1rem',
                                        background: itemType === type.value ? '#262626' : 'transparent',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        color: itemType === type.value ? '#fff' : '#737373',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        boxShadow: itemType === type.value ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    <span>{type.emoji}</span>
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {/* Title Input */}
                        <div>
                            <input
                                {...register('title', { required: true })}
                                type="text"
                                placeholder="What are you working on?"
                                style={{
                                    width: '100%',
                                    fontSize: '1.25rem',
                                    fontWeight: 500,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#fff',
                                    padding: '0.5rem 0'
                                }}
                                className="placeholder-neutral-600"
                            />
                            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', marginTop: '0.5rem' }} />
                        </div>

                        {/* Meta Row */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {/* Category Picker */}
                            <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#737373', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Category
                                </label>
                                <select
                                    {...register('category')}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        background: '#0D0D0D',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.emoji} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority (Tasks only) */}
                            {itemType === 'task' && (
                                <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#737373', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Priority
                                    </label>
                                    <select
                                        {...register('priority')}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.75rem',
                                            background: '#0D0D0D',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {PRIORITIES.map(priority => (
                                            <option key={priority.value} value={priority.value}>
                                                {priority.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status (Tasks only) */}
                            {itemType === 'task' && (
                                <div style={{ flex: '1 1 auto', minWidth: '120px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#737373', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Status
                                    </label>
                                    <select
                                        {...register('status')}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.75rem',
                                            background: '#0D0D0D',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {STATUSES.map(status => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Time Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: itemType === 'event' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#737373', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {itemType === 'event' ? 'Start Time' : 'Due Date'}
                                </label>
                                <input
                                    {...register('start_time', { required: true })}
                                    type="datetime-local"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        background: '#0D0D0D',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        colorScheme: 'dark'
                                    }}
                                />
                            </div>

                            {itemType === 'event' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#737373', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        End Time
                                    </label>
                                    <input
                                        {...register('end_time', { required: true })}
                                        type="datetime-local"
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.75rem',
                                            background: '#0D0D0D',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            colorScheme: 'dark'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#737373', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </label>
                            <textarea
                                {...register('description')}
                                placeholder="Add details..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#0D0D0D',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#fff',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                                className="placeholder-neutral-600"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Delete Button (Edit mode only) */}
                        {isEditMode && onDelete ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    padding: '0.625rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '0.5rem',
                                    color: '#ef4444',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                }}
                            >
                                Delete
                            </button>
                        ) : (
                            <div />
                        )}

                        {/* Right Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '0.625rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#737373',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                    e.currentTarget.style.color = '#a3a3a3'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.color = '#737373'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    background: '#3b82f6',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    color: '#fff',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#2563eb'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#3b82f6'
                                }}
                            >
                                {isEditMode ? 'Save Changes' : 'Create'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
