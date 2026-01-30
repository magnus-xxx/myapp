import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, SubTask } from '../../../shared/types'
import { v4 as uuidv4 } from 'uuid'

interface TaskDetailPanelProps {
    task: Task | null
    isOpen: boolean
    onClose: () => void
    onUpdate: (updates: Partial<Task>) => void
}

const PREDEFINED_TAGS = [
    { name: 'Math', color: '#3b82f6' },
    { name: 'ClientA', color: '#10b981' },
    { name: 'Urgent', color: '#ef4444' },
    { name: 'Study', color: '#8b5cf6' },
    { name: 'Work', color: '#f59e0b' },
    { name: 'Personal', color: '#ec4899' }
]

export function TaskDetailPanel({ task, isOpen, onClose, onUpdate }: TaskDetailPanelProps) {
    const [subtasks, setSubtasks] = useState<SubTask[]>([])
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [recurrence, setRecurrence] = useState<string | null>(null)

    useEffect(() => {
        if (task) {
            // Parse subtasks
            if (task.subtasks) {
                try {
                    setSubtasks(JSON.parse(task.subtasks))
                } catch {
                    setSubtasks([])
                }
            } else {
                setSubtasks([])
            }

            // Parse tags
            if (task.tags) {
                try {
                    setSelectedTags(JSON.parse(task.tags))
                } catch {
                    setSelectedTags([])
                }
            } else {
                setSelectedTags([])
            }

            // Set recurrence
            setRecurrence(task.recurrence || null)
        }
    }, [task])

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return

        const newSubtask: SubTask = {
            id: uuidv4(),
            title: newSubtaskTitle,
            completed: false
        }

        const updatedSubtasks = [...subtasks, newSubtask]
        setSubtasks(updatedSubtasks)
        onUpdate({ subtasks: JSON.stringify(updatedSubtasks) })
        setNewSubtaskTitle('')
    }

    const handleToggleSubtask = (id: string) => {
        const updatedSubtasks = subtasks.map((st) =>
            st.id === id ? { ...st, completed: !st.completed } : st
        )
        setSubtasks(updatedSubtasks)
        onUpdate({ subtasks: JSON.stringify(updatedSubtasks) })
    }

    const handleDeleteSubtask = (id: string) => {
        const updatedSubtasks = subtasks.filter((st) => st.id !== id)
        setSubtasks(updatedSubtasks)
        onUpdate({ subtasks: JSON.stringify(updatedSubtasks) })
    }

    const handleToggleTag = (tagName: string) => {
        const updatedTags = selectedTags.includes(tagName)
            ? selectedTags.filter((t) => t !== tagName)
            : [...selectedTags, tagName]
        setSelectedTags(updatedTags)
        onUpdate({ tags: JSON.stringify(updatedTags) })
    }

    const handleSetRecurrence = (value: string | null) => {
        setRecurrence(value)
        onUpdate({ recurrence: value })
    }

    const completedSubtasks = subtasks.filter((st) => st.completed).length
    const totalSubtasks = subtasks.length
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

    if (!isOpen || !task) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '400px',
                    backgroundColor: '#171717',
                    borderLeft: '1px solid #262626',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #262626' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Task Details</h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#737373',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#d4d4d4' }}>
                        {task.title}
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
                    {/* Subtasks Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Subtasks</h3>
                            <span style={{ fontSize: '0.875rem', color: '#737373' }}>
                                {completedSubtasks}/{totalSubtasks}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        {totalSubtasks > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ width: '100%', height: '8px', backgroundColor: '#262626', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        style={{ height: '100%', backgroundColor: '#22c55e', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Subtask List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            {subtasks.map((subtask) => (
                                <div
                                    key={subtask.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        backgroundColor: '#262626',
                                        borderRadius: '0.375rem'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        onChange={() => handleToggleSubtask(subtask.id)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    <span
                                        style={{
                                            flex: 1,
                                            textDecoration: subtask.completed ? 'line-through' : 'none',
                                            color: subtask.completed ? '#737373' : '#fff',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {subtask.title}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteSubtask(subtask.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '1.25rem',
                                            padding: 0
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Subtask */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                                placeholder="Add a subtask..."
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#262626',
                                    border: '1px solid #404040',
                                    borderRadius: '0.375rem',
                                    color: '#fff',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <button
                                onClick={handleAddSubtask}
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Recurrence Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Recurrence</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { label: 'None', value: null },
                                { label: 'Daily', value: 'daily' },
                                { label: 'Weekly', value: 'weekly' },
                                { label: 'Monthly', value: 'monthly' }
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    onClick={() => handleSetRecurrence(option.value)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: recurrence === option.value ? '#fff' : '#262626',
                                        color: recurrence === option.value ? '#000' : '#fff',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: recurrence === option.value ? 600 : 400
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Tags</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {PREDEFINED_TAGS.map((tag) => {
                                const isSelected = selectedTags.includes(tag.name)
                                return (
                                    <button
                                        key={tag.name}
                                        onClick={() => handleToggleTag(tag.name)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: isSelected ? tag.color : '#262626',
                                            color: '#fff',
                                            border: isSelected ? 'none' : `1px solid ${tag.color}`,
                                            borderRadius: '9999px',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            fontWeight: isSelected ? 600 : 400
                                        }}
                                    >
                                        {tag.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
