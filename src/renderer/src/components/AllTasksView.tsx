import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Task, Milestone } from '../../../shared/types'

interface AllTasksViewProps {
    onTaskClick: (task: Task) => void
    projectFilter?: number | null
}

export function AllTasksView({ onTaskClick, projectFilter }: AllTasksViewProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

    useEffect(() => {
        loadTasks()
        loadMilestones()
    }, [])

    const loadTasks = async () => {
        try {
            const allTasks = await window.api.getTasks()
            setTasks(allTasks)
        } catch (error) {
            console.error('Failed to load tasks:', error)
        }
    }

    const loadMilestones = async () => {
        try {
            const loaded = await window.api.getMilestones()
            setMilestones(loaded)
        } catch (error) {
            console.error('Failed to load milestones:', error)
        }
    }

    const getMilestoneName = (milestoneId: number | null) => {
        if (!milestoneId) return null
        const milestone = milestones.find(m => m.id === milestoneId)
        return milestone ? milestone.title : null
    }

    const getMilestoneColor = (milestoneId: number | null) => {
        if (!milestoneId) return '#525252'
        const milestone = milestones.find(m => m.id === milestoneId)
        return milestone ? milestone.color : '#525252'
    }

    const getSubtaskProgress = (task: Task) => {
        if (!task.subtasks) return null
        try {
            const subtasks = JSON.parse(task.subtasks)
            const completed = subtasks.filter((st: any) => st.completed).length
            return { completed, total: subtasks.length }
        } catch {
            return null
        }
    }

    const getTags = (task: Task): string[] => {
        if (!task.tags) return []
        try {
            return JSON.parse(task.tags)
        } catch {
            return []
        }
    }

    const handleToggleComplete = async (task: Task) => {
        if (!task.id) return
        try {
            await window.api.updateTask(task.id, { completed: !task.completed })
            loadTasks()
        } catch (error) {
            console.error('Failed to toggle task:', error)
        }
    }

    const filteredTasks = tasks.filter(task => {
        // Apply project filter if specified
        if (projectFilter !== undefined && projectFilter !== null) {
            if (task.milestone_id !== projectFilter) return false
        }

        // Apply completion filter
        if (filter === 'active') return !task.completed
        if (filter === 'completed') return task.completed
        return true
    })

    const getProjectName = () => {
        if (projectFilter === undefined || projectFilter === null) return null
        const milestone = milestones.find(m => m.id === projectFilter)
        return milestone ? milestone.title : null
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2rem', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                        {getProjectName() || 'All Tasks'}
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9375rem', color: '#737373' }}>
                        {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                </div>

                {/* Filter Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#171717', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    {(['active', 'all', 'completed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: filter === f ? '#262626' : 'transparent',
                                color: filter === f ? '#fff' : '#737373',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: filter === f ? 600 : 500,
                                textTransform: 'capitalize',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {filteredTasks.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: '1rem',
                            color: '#525252'
                        }}
                    >
                        <span style={{ fontSize: '3rem' }}>📋</span>
                        <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>No tasks found</p>
                        <p style={{ fontSize: '0.875rem' }}>Try changing the filter</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredTasks.map((task) => {
                            const progress = getSubtaskProgress(task)
                            const tags = getTags(task)
                            const milestoneName = getMilestoneName(task.milestone_id)
                            const milestoneColor = getMilestoneColor(task.milestone_id)

                            return (
                                <motion.div
                                    key={task.id}
                                    whileHover={{ scale: 1.01, x: 4 }}
                                    onClick={() => onTaskClick(task)}
                                    style={{
                                        backgroundColor: '#171717',
                                        border: '1px solid #262626',
                                        borderRadius: '0.75rem',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={(e) => {
                                                e.stopPropagation()
                                                handleToggleComplete(task)
                                            }}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                marginTop: '0.125rem'
                                            }}
                                        />

                                        {/* Task Content */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '1rem',
                                                        fontWeight: 600,
                                                        color: '#fff',
                                                        textDecoration: task.completed ? 'line-through' : 'none',
                                                        opacity: task.completed ? 0.5 : 1
                                                    }}
                                                >
                                                    {task.title}
                                                </h3>
                                                {milestoneName && !projectFilter && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '0.25rem 0.625rem',
                                                            backgroundColor: `${milestoneColor}20`,
                                                            color: milestoneColor,
                                                            borderRadius: '9999px',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {milestoneName}
                                                    </span>
                                                )}
                                            </div>

                                            {task.description && (
                                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#737373' }}>
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Subtask Progress */}
                                            {progress && progress.total > 0 && (
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <div style={{ flex: 1, height: '6px', backgroundColor: '#262626', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div
                                                                style={{
                                                                    width: `${(progress.completed / progress.total) * 100}%`,
                                                                    height: '100%',
                                                                    backgroundColor: '#22c55e',
                                                                    transition: 'width 0.3s ease'
                                                                }}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: '#737373' }}>
                                                            {progress.completed}/{progress.total}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                    {tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '0.125rem 0.5rem',
                                                                backgroundColor: '#262626',
                                                                color: '#a3a3a3',
                                                                borderRadius: '9999px'
                                                            }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Footer: Priority & Due Date */}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.625rem',
                                                        backgroundColor: task.priority === 'high' ? '#ef444420' : task.priority === 'medium' ? '#f59e0b20' : '#52525220',
                                                        color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#525252',
                                                        borderRadius: '0.25rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {task.priority}
                                                </span>
                                                {task.due_date && (
                                                    <span style={{ fontSize: '0.75rem', color: '#737373' }}>
                                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
