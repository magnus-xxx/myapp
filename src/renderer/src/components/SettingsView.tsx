import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Calendar, Music, Sparkles, Palette, ExternalLink } from 'lucide-react'
import { CalendarSource } from '../../../shared/types'

interface SettingsViewProps {
    isOpen: boolean
    onClose: () => void
}

type SettingsCategory = 'connections' | 'general' | 'appearance'

export function SettingsView({ isOpen, onClose }: SettingsViewProps) {
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('connections')
    const [calendarSources, setCalendarSources] = useState<CalendarSource[]>([])

    // New calendar form state
    const [newCalendarName, setNewCalendarName] = useState('')
    const [newCalendarUrl, setNewCalendarUrl] = useState('')
    const [newCalendarColor, setNewCalendarColor] = useState('#3b82f6')
    const [isAddingCalendar, setIsAddingCalendar] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadCalendarSources()
        }
    }, [isOpen])

    const loadCalendarSources = async () => {
        try {
            const sources = await window.api.getCalendarSources()
            setCalendarSources(sources)
        } catch (error) {
            console.error('Failed to load calendar sources:', error)
        }
    }

    const handleAddCalendar = async () => {
        if (!newCalendarName.trim() || !newCalendarUrl.trim()) {
            alert('Please provide both name and URL')
            return
        }

        setIsAddingCalendar(true)
        try {
            await window.api.addCalendarSource({
                name: newCalendarName.trim(),
                url: newCalendarUrl.trim(),
                color: newCalendarColor,
                enabled: true
            })

            // Reset form
            setNewCalendarName('')
            setNewCalendarUrl('')
            setNewCalendarColor('#3b82f6')

            // Reload sources
            await loadCalendarSources()
        } catch (error) {
            console.error('Failed to add calendar:', error)
            alert('Failed to add calendar. Please check the URL and try again.')
        } finally {
            setIsAddingCalendar(false)
        }
    }

    const handleDeleteCalendar = async (id: number) => {
        if (!confirm('Are you sure you want to remove this calendar?')) return

        try {
            await window.api.deleteCalendarSource(id)
            await loadCalendarSources()
        } catch (error) {
            console.error('Failed to delete calendar:', error)
            alert('Failed to delete calendar')
        }
    }

    const handleToggleCalendar = async (id: number, enabled: boolean) => {
        try {
            await window.api.updateCalendarSource(id, { enabled: !enabled })
            await loadCalendarSources()
        } catch (error) {
            console.error('Failed to toggle calendar:', error)
        }
    }

    if (!isOpen) return null

    const categories = [
        { id: 'connections' as const, label: 'Connections', icon: ExternalLink },
        { id: 'general' as const, label: 'General', icon: Palette },
        { id: 'appearance' as const, label: 'Appearance', icon: Sparkles }
    ]

    const renderConnections = () => (
        <div className="space-y-8">
            {/* Calendars Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-white/60" />
                    <h3 className="text-lg font-semibold text-white">Calendars</h3>
                </div>
                <p className="text-sm text-white/60 mb-6">
                    Connect your Google Calendar, Outlook, or any iCal-compatible calendar.
                </p>

                {/* Add Calendar Form */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h4 className="text-sm font-medium text-white mb-4">Add New Calendar</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-white/60 mb-2">Calendar Name</label>
                            <input
                                type="text"
                                value={newCalendarName}
                                onChange={(e) => setNewCalendarName(e.target.value)}
                                placeholder="e.g., Personal, Work, School"
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/60 mb-2">iCal URL (Secret Address)</label>
                            <input
                                type="url"
                                value={newCalendarUrl}
                                onChange={(e) => setNewCalendarUrl(e.target.value)}
                                placeholder="https://calendar.google.com/calendar/ical/..."
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 outline-none focus:border-white/30 transition-colors"
                            />
                            <p className="text-xs text-white/40 mt-2">
                                For Google Calendar: Settings → Your calendar → Integrate calendar → Secret address in iCal format
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs text-white/60 mb-2">Color</label>
                            <div className="flex gap-3">
                                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewCalendarColor(color)}
                                        className={`w-10 h-10 rounded-lg transition-all ${newCalendarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black/40' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleAddCalendar}
                            disabled={isAddingCalendar || !newCalendarName.trim() || !newCalendarUrl.trim()}
                            className="w-full px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            {isAddingCalendar ? 'Adding...' : 'Add Calendar'}
                        </button>
                    </div>
                </div>

                {/* Calendar List */}
                <div className="space-y-3">
                    {calendarSources.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-sm">
                            No calendars connected yet
                        </div>
                    ) : (
                        calendarSources.map((source) => (
                            <div
                                key={source.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: source.color }}
                                    />
                                    <div>
                                        <div className="text-white font-medium">{source.name}</div>
                                        <div className="text-xs text-white/40 truncate max-w-md">{source.url}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleCalendar(source.id!, source.enabled)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${source.enabled
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/10 text-white/60'
                                            }`}
                                    >
                                        {source.enabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCalendar(source.id!)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Spotify Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Music size={20} className="text-white/60" />
                    <h3 className="text-lg font-semibold text-white">Spotify</h3>
                </div>
                <p className="text-sm text-white/60 mb-6">
                    Connect your Spotify account to control music from MAGNUS.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <button className="px-6 py-3 bg-[#1DB954] text-white rounded-lg font-medium hover:bg-[#1ed760] transition-colors flex items-center gap-2">
                        <Music size={18} />
                        Connect Spotify (Coming Soon)
                    </button>
                </div>
            </div>

            {/* AI Model Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-white/60" />
                    <h3 className="text-lg font-semibold text-white">AI Model</h3>
                </div>
                <p className="text-sm text-white/60 mb-6">
                    Configure your AI assistant with API keys for enhanced features.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-white/60 mb-2">OpenAI API Key</label>
                            <input
                                type="password"
                                placeholder="sk-..."
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                        <button className="px-6 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors">
                            Save API Key (Coming Soon)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderGeneral = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-white font-medium">Sound Effects</div>
                            <div className="text-xs text-white/60">Enable UI sound feedback</div>
                        </div>
                        <button className="w-12 h-6 bg-white/20 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                        </button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-white font-medium">Notifications</div>
                            <div className="text-xs text-white/60">Show desktop notifications</div>
                        </div>
                        <button className="w-12 h-6 bg-white/20 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderAppearance = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
                <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-white font-medium mb-3">Theme</div>
                        <div className="flex gap-3">
                            <button className="flex-1 px-4 py-3 bg-black border border-white/20 rounded-lg text-white font-medium">
                                Dark
                            </button>
                            <button className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white/60">
                                Light (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-4 bg-[#121212] rounded-2xl border border-white/10 overflow-hidden flex"
            >
                {/* Sidebar */}
                <div className="w-64 bg-black/40 border-r border-white/10 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white">Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-white/60" />
                        </button>
                    </div>

                    <nav className="space-y-2">
                        {categories.map((category) => {
                            const Icon = category.icon
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeCategory === category.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon size={18} strokeWidth={1.5} />
                                    <span className="font-medium">{category.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-3xl">
                        {activeCategory === 'connections' && renderConnections()}
                        {activeCategory === 'general' && renderGeneral()}
                        {activeCategory === 'appearance' && renderAppearance()}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
