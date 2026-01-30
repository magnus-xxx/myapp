import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Settings, Music, Calendar, Target } from 'lucide-react'

interface NavbarProps {
    activeNav: string
    onNavClick: (nav: string) => void
    onSettingsClick: () => void
    focusMode?: boolean
    focusTimeRemaining?: number
}

export function Navbar({ activeNav, onNavClick, onSettingsClick, focusMode = false, focusTimeRemaining = 1499 }: NavbarProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const navItems = [
        { id: 'sanctuary', label: 'Sanctuary' },
        { id: 'plan', label: 'Plan' },
        { id: 'brain', label: 'Brain' },
        { id: 'vault', label: 'Vault' }
    ]

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const formatFocusTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Mock data
    const mockMusic = {
        playing: false,
        song: 'Lofi Beats',
        artist: 'Chillhop Music'
    }

    const mockNextEvent = {
        title: 'Team Meeting',
        timeUntil: '15m'
    }

    const mockWeather = {
        temp: 24,
        condition: '⛅'
    }

    const renderCenterIsland = () => {
        if (focusMode) {
            return (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                    <Target size={14} className="text-orange-400" />
                    <span className="text-white font-medium text-sm tabular-nums">
                        {formatFocusTime(focusTimeRemaining)}
                    </span>
                </div>
            )
        }

        if (mockMusic.playing) {
            return (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                    <Music size={14} className="text-green-400" />
                    <span className="text-white text-sm">
                        {mockMusic.song} <span className="text-neutral-500">· {mockMusic.artist}</span>
                    </span>
                </div>
            )
        }

        return (
            <div className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-neutral-400 text-sm">
                    {formatDate(currentTime)}
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-white text-sm font-medium tabular-nums">
                    {formatTime(currentTime)}
                </span>
            </div>
        )
    }

    return (
        <nav
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '3.5rem',
                zIndex: 50,
                background: 'rgba(13, 13, 13, 0.8)',
                backdropFilter: 'blur(40px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
        >
            {/* Zone A: Navigation (Left) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Logo */}
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: '#a3a3a3',
                        textTransform: 'uppercase'
                    }}
                >
                    MAGNUS
                </div>

                {/* Navigation Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {navItems.map((item) => {
                        const isActive = activeNav === item.id
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => {
                                    console.log('[Navbar] Navigating to:', item.id)
                                    onNavClick(item.id)
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '9999px',
                                    background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: isActive ? '#fff' : '#737373',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = '#d4d4d4'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = '#737373'
                                    }
                                }}
                            >
                                {item.label}
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Zone B: Dynamic Center (Context Island) */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {renderCenterIsland()}
            </div>

            {/* Zone C: Life Stats Widgets (Right) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Deadline Widget */}
                <motion.div
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    <Calendar size={14} className="text-blue-400" />
                    <span style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>
                        {mockNextEvent.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#737373' }}>
                        in {mockNextEvent.timeUntil}
                    </span>
                </motion.div>

                {/* Weather Widget */}
                <motion.div
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    <span style={{ fontSize: '0.875rem' }}>{mockWeather.condition}</span>
                    <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>
                        {mockWeather.temp}°C
                    </span>
                </motion.div>

                {/* Divider */}
                <div
                    style={{
                        width: '1px',
                        height: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.1)'
                    }}
                />

                {/* Network Status */}
                <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    style={{
                        width: '2rem',
                        height: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        outline: 'none'
                    }}
                >
                    <Wifi size={16} style={{ color: '#22c55e' }} />
                </motion.button>

                {/* Settings */}
                <motion.button
                    onClick={onSettingsClick}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: '2rem',
                        height: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        outline: 'none'
                    }}
                >
                    <Settings size={16} style={{ color: '#a3a3a3' }} />
                </motion.button>
            </div>
        </nav>
    )
}
