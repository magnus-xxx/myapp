import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Edit3, Target, ArrowRight } from 'lucide-react'
import { CalendarItem } from '../../../../shared/types'

interface ActiveTaskDisplayProps {
    onTaskComplete?: (taskId: string) => void
}

export function ActiveTaskDisplay({ onTaskComplete }: ActiveTaskDisplayProps) {
    const [task, setTask] = useState<CalendarItem | null>(null)
    const [customGoal, setCustomGoal] = useState('')
    const [isTaskSet, setIsTaskSet] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchActiveTask()
    }, [])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const fetchActiveTask = async () => {
        try {
            setIsLoading(true)
            const items = await window.api.calendar.getCalendarItems({
                types: ['task'],
                status: 'todo'
            })

            // Sort by priority
            const sorted = items.sort((a: CalendarItem, b: CalendarItem) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                const aPriority = priorityOrder[a.priority] ?? 2
                const bPriority = priorityOrder[b.priority] ?? 2
                return aPriority - bPriority
            })

            if (sorted[0]) {
                setTask(sorted[0])
                setCustomGoal(sorted[0].title)
                setIsTaskSet(true)
            }
        } catch (error) {
            console.error('[ActiveTaskDisplay] Failed to fetch tasks:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetGoal = () => {
        if (customGoal.trim()) {
            setIsTaskSet(true)
            setIsEditing(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSetGoal()
        }
        if (e.key === 'Escape') {
            setIsEditing(false)
            if (task) {
                setCustomGoal(task.title)
            }
        }
    }

    const handleComplete = async () => {
        if (!task?.id) {
            // Just reset for custom goals
            setIsTaskSet(false)
            setCustomGoal('')
            return
        }

        try {
            setIsCompleting(true)
            await window.api.calendar.updateCalendarItem(task.id.toString(), {
                status: 'done'
            })
            onTaskComplete?.(task.id.toString())

            // Fetch next task
            await fetchActiveTask()
            if (!task) {
                setIsTaskSet(false)
                setCustomGoal('')
            }
        } catch (error) {
            console.error('[ActiveTaskDisplay] Failed to complete task:', error)
        } finally {
            setIsCompleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-white/30 text-sm tracking-widest uppercase"
                >
                    Loading...
                </motion.div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-xl mx-auto">
            <AnimatePresence mode="wait">
                {!isTaskSet || isEditing ? (
                    /* View 1: Goal Input - Mission Commitment */
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-6"
                    >
                        {/* Label */}
                        <div className="flex items-center gap-2 text-white/30">
                            <Target size={16} />
                            <span className="text-xs tracking-[0.2em] uppercase">
                                Define Your Mission
                            </span>
                        </div>

                        {/* Underline Input */}
                        <div className="relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={customGoal}
                                onChange={(e) => setCustomGoal(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What is your ONE main goal right now?"
                                className="
                                    w-full py-4 px-2 
                                    text-2xl md:text-3xl text-center font-light text-white
                                    bg-transparent border-0 border-b-2 border-white/10
                                    focus:border-white/30 focus:outline-none
                                    placeholder:text-white/20 placeholder:font-light
                                    transition-all duration-300
                                "
                            />

                            {/* Animated underline */}
                            <motion.div
                                className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                                initial={{ width: 0, x: '-50%' }}
                                animate={{
                                    width: customGoal ? '100%' : '0%',
                                    x: '-50%'
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Commit Button */}
                        <motion.button
                            onClick={handleSetGoal}
                            disabled={!customGoal.trim()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                flex items-center gap-3 px-8 py-3 rounded-xl
                                text-sm font-medium tracking-wider uppercase
                                transition-all duration-300
                                ${customGoal.trim()
                                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                                    : 'bg-white/[0.03] text-white/20 border border-white/[0.05] cursor-not-allowed'
                                }
                            `}
                        >
                            Lock In
                            <ArrowRight size={16} />
                        </motion.button>
                    </motion.div>
                ) : (
                    /* View 2: Task Set - Mission Display */
                    <motion.div
                        key="display"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center gap-6"
                    >
                        {/* Priority Badge (if from DB) */}
                        {task?.priority && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider
                                    ${task.priority === 'high'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : task.priority === 'medium'
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }
                                `}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-400' :
                                        task.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                                    }`} />
                                {task.priority} Priority
                            </motion.div>
                        )}

                        {/* Main Goal Title */}
                        <div className="relative group">
                            <h2 className="text-3xl md:text-4xl font-medium text-white text-center leading-tight max-w-lg">
                                {customGoal}
                            </h2>

                            {/* Edit button on hover */}
                            <motion.button
                                onClick={() => setIsEditing(true)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="
                                    absolute -right-10 top-1/2 -translate-y-1/2
                                    p-2 rounded-lg
                                    text-white/0 group-hover:text-white/40
                                    hover:!text-white/70 hover:bg-white/10
                                    transition-all duration-200
                                "
                            >
                                <Edit3 size={16} />
                            </motion.button>
                        </div>

                        {/* Domain tag */}
                        {task?.domain && (
                            <span className="text-white/30 text-sm capitalize">
                                {task.domain}
                                {task.estimate_minutes && ` · ~${task.estimate_minutes}m`}
                            </span>
                        )}

                        {/* Complete Button */}
                        <motion.button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            whileHover={{ scale: 1.02, boxShadow: '0 12px 24px -8px rgba(52, 211, 153, 0.3)' }}
                            whileTap={{ scale: 0.98 }}
                            className="
                                flex items-center gap-3 
                                px-8 py-4 mt-2
                                bg-gradient-to-r from-emerald-500 to-teal-500
                                text-white font-semibold tracking-wide
                                rounded-2xl
                                shadow-lg shadow-emerald-500/20
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-300
                            "
                        >
                            {isCompleting ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                <Check size={20} strokeWidth={3} />
                            )}
                            {isCompleting ? 'Completing...' : 'Mission Complete'}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
