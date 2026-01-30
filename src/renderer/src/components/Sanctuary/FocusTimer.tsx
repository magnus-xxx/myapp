import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, RotateCcw } from 'lucide-react'

interface FocusTimerProps {
    onTimerComplete?: () => void
    onTimeUpdate?: (seconds: number) => void
    onTimerStateChange?: (isRunning: boolean) => void
}

export function FocusTimer({ onTimerComplete, onTimeUpdate, onTimerStateChange }: FocusTimerProps) {
    const [duration, setDuration] = useState(25 * 60)
    const [timeLeft, setTimeLeft] = useState(duration)
    const [isRunning, setIsRunning] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    // Notify parent of timer state changes
    useEffect(() => {
        onTimerStateChange?.(isRunning)
    }, [isRunning, onTimerStateChange])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = prev - 1
                    onTimeUpdate?.(newTime)
                    return newTime
                })
            }, 1000)
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false)
            setIsComplete(true)
            onTimerComplete?.()
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, timeLeft, onTimerComplete, onTimeUpdate])

    const formatTime = useCallback((seconds: number): { mins: string; secs: string } => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return {
            mins: mins.toString().padStart(2, '0'),
            secs: secs.toString().padStart(2, '0')
        }
    }, [])

    const toggleTimer = () => {
        setIsComplete(false)
        setIsRunning(!isRunning)
    }

    const resetTimer = () => {
        setIsRunning(false)
        setTimeLeft(duration)
        setIsComplete(false)
    }

    const selectDuration = (minutes: number) => {
        const newDuration = minutes * 60
        setDuration(newDuration)
        setTimeLeft(newDuration)
        setIsRunning(false)
        setIsComplete(false)
    }

    const presets = [25, 45, 60, 90]
    const time = formatTime(timeLeft)

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            {/* Duration Presets - Ultra minimal */}
            <div className="flex gap-6">
                {presets.map((mins) => (
                    <motion.button
                        key={mins}
                        onClick={() => selectDuration(mins)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            text-sm transition-all duration-300
                            ${duration === mins * 60
                                ? 'text-white font-medium'
                                : 'text-white/30 hover:text-white/50'
                            }
                        `}
                    >
                        {mins}
                    </motion.button>
                ))}
            </div>

            {/* The Timer - Cinematic & Massive */}
            <div className="relative flex items-center justify-center py-8">
                {/* Subtle ambient glow when running */}
                {isRunning && (
                    <motion.div
                        className="absolute inset-0 -inset-x-20"
                        animate={{
                            background: [
                                'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)',
                                'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)',
                                'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)'
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                {/* Time Display - text-9xl font-thin */}
                <div
                    className="relative flex items-baseline select-none"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={time.mins}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-[10rem] leading-none font-thin text-white tracking-tighter"
                            style={{
                                textShadow: '0 0 80px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.05)',
                                fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
                            }}
                        >
                            {time.mins}
                        </motion.span>
                    </AnimatePresence>

                    <motion.span
                        className="text-7xl font-thin text-white/20 mx-2 mb-4"
                        animate={{ opacity: isRunning ? [0.2, 0.5, 0.2] : 0.2 }}
                        transition={{ duration: 1.5, repeat: isRunning ? Infinity : 0 }}
                    >
                        :
                    </motion.span>

                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={time.secs}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-[10rem] leading-none font-thin text-white tracking-tighter"
                            style={{
                                textShadow: '0 0 80px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.05)',
                                fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
                            }}
                        >
                            {time.secs}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls - Minimalist */}
            <div className="flex items-center gap-4">
                {/* Reset Button - Ghost style */}
                <motion.button
                    onClick={resetTimer}
                    whileHover={{ scale: 1.1, opacity: 0.8 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 text-white/30 hover:text-white/60 transition-all"
                    title="Reset"
                >
                    <RotateCcw size={18} />
                </motion.button>

                {/* Main Action - Premium White Pill */}
                <motion.button
                    onClick={toggleTimer}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                        px-12 py-4 rounded-full font-bold text-lg tracking-wide
                        flex items-center gap-2.5
                        transition-all duration-300 ease-out
                        ${isRunning
                            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15 shadow-lg'
                            : 'bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]'
                        }
                    `}
                >
                    {isRunning ? (
                        <>
                            <Pause size={18} />
                            <span>PAUSE</span>
                        </>
                    ) : (
                        <>
                            <Play size={18} className="ml-0.5" />
                            <span>{timeLeft === duration ? 'START FOCUS' : 'RESUME'}</span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Minimal Status */}
            <motion.p
                className="text-[10px] tracking-[0.3em] uppercase"
                animate={{
                    color: isComplete ? '#34d399' : isRunning ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'
                }}
            >
                {isComplete ? '✨ Complete' : isRunning ? 'Focusing' : 'Ready'}
            </motion.p>
        </div>
    )
}
