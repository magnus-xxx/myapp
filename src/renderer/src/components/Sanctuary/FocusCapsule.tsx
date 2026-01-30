import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Plus, Check, Play, Square } from 'lucide-react'
import { FocusTimer } from './FocusTimer'
import { AtmosphereController } from './AtmosphereController'

interface FocusCapsuleProps {
    onTaskComplete?: () => void
    activeTaskTitle?: string
    onSpotifyToggle?: () => void
}

interface SubTask {
    id: string
    title: string
    completed: boolean
}

export function FocusCapsule({
    onTaskComplete,
    activeTaskTitle,
    onSpotifyToggle
}: FocusCapsuleProps) {
    const [isFocusMode, setIsFocusMode] = useState(false)
    const [showTimer, setShowTimer] = useState(false)
    const [showAtmosphere, setShowAtmosphere] = useState(false)

    // Default subtasks for visualization
    const [subtasks, setSubtasks] = useState<SubTask[]>([
        { id: '1', title: 'Prepare workspace', completed: true },
        { id: '2', title: 'Clear inbox', completed: false }
    ])
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

    const handleStartFocus = () => {
        setIsFocusMode(true)
        setShowTimer(true)
        setShowAtmosphere(true)
    }

    const addSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtaskTitle, completed: false }])
            setNewSubtaskTitle('')
        }
    }

    const toggleSubtask = (id: string) => {
        setSubtasks(subtasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }

    return (
        <div className="flex flex-col items-center w-full max-w-2xl animate-in fade-in zoom-in duration-500">

            {/* ===== MAIN CONTAINER CARD (FORCED VISIBILITY) ===== */}
            <div className="relative flex flex-col items-center w-full bg-black/40 backdrop-blur-2xl border border-solid border-white/20 rounded-3xl p-12 shadow-2xl z-20">

                {/* 1. SESSION BAR */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-12">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isFocusMode ? '100%' : '0%' }}
                        transition={{ duration: 25 * 60, ease: "linear" }}
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                </div>

                {/* 2. TASK TITLE */}
                <h2 className="text-2xl font-light text-white text-center mb-6 tracking-wide">
                    {activeTaskTitle || <span className="text-white/30 italic">Select a task to focus</span>}
                </h2>

                {/* 3. HUGE TIMER */}
                <div className="text-9xl font-light tracking-tighter tabular-nums text-white drop-shadow-2xl select-none mb-10">
                    {showTimer ? (
                        <FocusTimer onTimerComplete={() => {
                            setIsFocusMode(false)
                            onTaskComplete?.()
                        }} />
                    ) : (
                        "25:00"
                    )}
                </div>

                {/* 4. ACTION BUTTON */}
                <div className="mb-12">
                    {!isFocusMode ? (
                        <button
                            onClick={handleStartFocus}
                            className="
                                flex items-center gap-3 px-10 py-4 rounded-full
                                bg-white text-black font-bold uppercase tracking-[0.2em] text-sm
                                shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]
                                hover:scale-105 transition-all duration-300
                            "
                        >
                            <Play className="w-4 h-4 fill-black" />
                            Start Focus
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsFocusMode(false)}
                            className="
                                flex items-center gap-3 px-8 py-3 rounded-full
                                bg-red-500/10 border border-red-500/50 text-red-400 font-medium tracking-wide text-xs
                                hover:bg-red-500/20 transition-all
                            "
                        >
                            <Square className="w-3 h-3 fill-current" />
                            Stop Session
                        </button>
                    )}
                </div>

                {/* 5. MICRO-STEPS CONTAINER (NESTED Visible Border) */}
                <div className="w-full mt-2 p-6 bg-white/5 border border-solid border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Micro-Steps</span>
                        <span className="text-[10px] font-mono text-white/40">{subtasks.filter(t => t.completed).length} / {subtasks.length}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                        <AnimatePresence>
                            {subtasks.map(task => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => toggleSubtask(task.id)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border border-solid cursor-pointer transition-all
                                        ${task.completed
                                            ? 'bg-transparent border-transparent opacity-40'
                                            : 'bg-white/5 border-white/10 hover:border-white/30'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded flex items-center justify-center border transition-all
                                        ${task.completed
                                            ? 'bg-green-500 border-green-500 text-black'
                                            : 'border-white/30 text-transparent'
                                        }
                                    `}>
                                        <Check className="w-3 h-3" strokeWidth={4} />
                                    </div>
                                    <span className={`text-sm ${task.completed ? 'line-through text-white/50' : 'text-white'}`}>
                                        {task.title}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-3 px-3 py-2 border-t border-white/10 pt-3">
                        <Plus className="w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                            placeholder="Add next step..."
                            className="bg-transparent border-none w-full text-sm text-white placeholder-white/30 focus:outline-none"
                        />
                    </div>
                </div>

            </div>

            {/* ACCESSORIES - Absolute to Main Container */}
            <div className="absolute -right-24 bottom-0 flex flex-col gap-4">
                {/* Atmosphere Toggle */}
                {showAtmosphere && (
                    <div className="absolute bottom-16 right-0 origin-bottom-right">
                        <AtmosphereController />
                    </div>
                )}

                <button
                    onClick={onSpotifyToggle}
                    className="w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
                >
                    <Music className="w-5 h-5" />
                </button>
            </div>

        </div>
    )
}
