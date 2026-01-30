import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task } from '../../../shared/types'

interface AddTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [quadrant, setQuadrant] = useState('not_urgent_important')
    const [dueDate, setDueDate] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSubmitting(true)
        try {
            await onAdd({
                title: title.trim(),
                description: description.trim(),
                priority,
                eisenhower_quadrant: quadrant as any,
                due_date: dueDate || null,
                completed: false,
                status: 'todo',
                client_project: null,
                milestone_id: null,
                order_index: 0
            })

            // Reset and close
            setTitle('')
            setDescription('')
            setPriority('medium')
            setDueDate('')
            onClose()
        } catch (error) {
            console.error(error)
            alert('Failed to add task')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '100%',
                            maxWidth: '500px',
                            backgroundColor: '#171717',
                            border: '1px solid #262626',
                            borderRadius: '1rem',
                            padding: '2rem',
                            zIndex: 1001,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h2 style={{ margin: '0 0 1.5rem 0', color: '#fff' }}>New Task</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', color: '#737373', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Title</label>
                                <input
                                    autoFocus
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid #262626',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#737373', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Priority</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {(['low', 'medium', 'high'] as const).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                borderRadius: '0.25rem',
                                                border: '1px solid',
                                                borderColor: priority === p ? '#fff' : '#262626',
                                                backgroundColor: priority === p ? '#262626' : 'transparent',
                                                color: priority === p ? '#fff' : '#525252',
                                                textTransform: 'capitalize',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#737373', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Matrix Quadrant</label>
                                <select
                                    value={quadrant}
                                    onChange={e => setQuadrant(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid #262626',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="urgent_important">Do First (Urgent & Important)</option>
                                    <option value="not_urgent_important">Schedule (Not Urgent & Important)</option>
                                    <option value="urgent_not_important">Delegate (Urgent & Not Important)</option>
                                    <option value="not_urgent_not_important">Eliminate (Not Urgent & Not Important)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#737373',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title.trim() || isSubmitting}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#fff',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        opacity: !title.trim() ? 0.5 : 1
                                    }}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
