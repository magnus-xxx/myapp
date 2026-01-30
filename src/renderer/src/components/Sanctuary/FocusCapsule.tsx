import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Play, Square, Plus } from 'lucide-react'
import { FocusTimer } from './FocusTimer'
// REMOVED AtmosphereController & Music imports from here

interface FocusCapsuleProps {
    onTaskComplete?: () => void
    activeTaskTitle?: string
}

interface SubTask {
    id: string
    title: string
    completed: boolean
}

export function FocusCapsule({
    onTaskComplete,
    activeTaskTitle
}: FocusCapsuleProps) {
    const [isFocusMode, setIsFocusMode] = useState(false)
    const [showTimer, setShowTimer] = useState(false)

    // Default subtasks
    const [subtasks, setSubtasks] = useState<SubTask[]>([
        { id: '1', title: 'Prepare workspace', completed: true },
        { id: '2', title: 'Clear inbox', completed: false }
    ])
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

    const handleStartFocus = () => {
        setIsFocusMode(true)
        setShowTimer(true)
    }

    const toggleSubtask = (id: string) => {
        setSubtasks(subtasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }

    const addSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtaskTitle, completed: false }])
            setNewSubtaskTitle('')
        }
    }

    return (
        // CLEAN CONTAINER: No absolute positioning mess here anymore
        <div className="relative flex flex-col items-center w-full max-w-3xl animate-in zoom-in-95 duration-500">

            {/* MAIN GLASS CARD */}
            <div className="w-full bg-black/40 backdrop-blur-2xl border border-solid border-white/30 rounded-[32px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 overflow-hidden">

                {/* PROGRESS BAR (Top Edge) */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isFocusMode ? '100%' : '0%' }}
                        transition={{ duration: 25 * 60, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                    />
                </div>

                {/* CENTER CONTENT */}
                <div className="flex flex-col items-center justify-center">

                    {/* TASK TITLE */}
                    <h2 className="text-3xl font-light text-white text-center mb-8 tracking-wide leading-relaxed">
                        {activeTaskTitle || <span className="text-white/20 select-none">Select a task from sidebar</span>}
                    </h2>

                    {/* TIMER */}
                    <div className="text-[10rem] leading-none font-extralight tracking-tighter tabular-nums text-white drop-shadow-2xl select-none mb-10">
                        {showTimer ? (
                            <FocusTimer onTimerComplete={() => {
                                setIsFocusMode(false)
                                onTaskComplete?.()
                            }} />
                        ) : "25:00"}
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="mb-12">
                        {!isFocusMode ? (
                            <button
                                onClick={handleStartFocus}
                                className="
                                    group flex items-center gap-4 px-12 py-5 rounded-full
                                    bg-white text-black font-bold uppercase tracking-[0.2em] text-sm
                                    shadow-[0_0_40px_rgba(255,255,255,0.15)] 
                                    hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]
                                    hover:scale-105 transition-all duration-300
                                "
                            >
                                <Play className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
                                Start Focus
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsFocusMode(false)}
                                className="
                                    flex items-center gap-3 px-8 py-3 rounded-full
                                    bg-white/5 border border-white/20 text-white/80 font-medium text-xs tracking-wide
                                    hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all
                                "
                            >
                                <Square className="w-3 h-3 fill-current" />
                                Stop
                            </button>
                        )}
                    </div>

                    {/* MICRO-STEPS (Integrated cleanly) */}
                    <div className="w-full max-w-lg border-t border-white/10 pt-6">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Session Steps</span>
                            <span className="text-[10px] font-mono text-white/30">{subtasks.filter(t => t.completed).length}/{subtasks.length}</span>
                        </div>

                        <div className="space-y-2">
                            {subtasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => toggleSubtask(task.id)}
                                    className={`
                                        group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border border-transparent
                                        ${task.completed ? 'opacity-40' : 'hover:bg-white/5 hover:border-white/10'}
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded-full flex items-center justify-center border transition-all
                                        ${task.completed ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 group-hover:border-white/60'}
                                    `}>
                                        {task.completed && <Check className="w-3 h-3" strokeWidth={3} />}
                                    </div>
                                    <span className={`text-sm ${task.completed ? 'line-through text-white/50' : 'text-white/90'}`}>
                                        {task.title}
                                    </span>
                                </div>
                            ))}

                            {/* Simple Input */}
                            <div className="flex items-center gap-3 px-3 mt-2 opacity-50 hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-white/50" />
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                    placeholder="Add next step..."
                                    className="bg-transparent border-none text-sm text-white placeholder:text-white/30 focus:outline-none w-full"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}