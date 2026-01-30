import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { LayoutDashboard, CalendarCheck2, MessageSquare, Wallet, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

// Navigation items organized by groups
const topNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
]

const workNavItems = [
    { id: 'plan', label: 'Plan', icon: CalendarCheck2 },
    { id: 'connect', label: 'Connect', icon: MessageSquare },
    { id: 'finance', label: 'Finance', icon: Wallet }
]

interface SidebarProps {
    activeItem: string
    onItemClick: (id: string) => void
}

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const NavButton = ({ item }: { item: typeof topNavItems[0] }) => {
        const Icon = item.icon
        const isActive = activeItem === item.id

        return (
            <motion.button
                onClick={() => onItemClick(item.id)}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius: '0.5rem',
                    border: 'none',
                    borderLeft: isActive ? '2px solid #fff' : '2px solid transparent',
                    background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: isActive ? '#fff' : '#737373',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    marginLeft: '-1px'
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
                <Icon size={20} strokeWidth={1.5} />
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                        >
                            {item.label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        )
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 72 : 240 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
                height: '100vh',
                background: '#1A1A1A',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1rem',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Logo/Brand Area */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    marginBottom: '2rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: '#FFFFFF',
                                letterSpacing: '-0.02em'
                            }}
                        >
                            Magnus
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Collapse Button */}
                <motion.button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        background: 'transparent',
                        color: '#737373',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                    }}
                >
                    {isCollapsed ? <ChevronRight size={16} strokeWidth={1.5} /> : <ChevronLeft size={16} strokeWidth={1.5} />}
                </motion.button>
            </div>

            {/* Navigation Items */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Top Section - Dashboard */}
                <div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {topNavItems.map((item) => (
                            <li key={item.id}>
                                <NavButton item={item} />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

                {/* Middle Section - Work Context */}
                <div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 500,
                                    color: '#525252',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: '0.5rem',
                                    paddingLeft: '1rem'
                                }}
                            >
                                Work
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {workNavItems.map((item) => (
                            <li key={item.id}>
                                <NavButton item={item} />
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* Bottom Section - Settings */}
            <div
                style={{
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <motion.button
                    onClick={() => onItemClick('settings')}
                    whileHover={{ x: activeItem === 'settings' ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        borderRadius: '0.5rem',
                        border: 'none',
                        borderLeft: activeItem === 'settings' ? '2px solid #fff' : '2px solid transparent',
                        background: activeItem === 'settings' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: activeItem === 'settings' ? '#fff' : '#525252',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        marginLeft: '-1px'
                    }}
                    onMouseEnter={(e) => {
                        if (activeItem !== 'settings') {
                            e.currentTarget.style.color = '#d4d4d4'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeItem !== 'settings') {
                            e.currentTarget.style.color = '#525252'
                        }
                    }}
                >
                    <Settings size={20} strokeWidth={1.5} />
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                            >
                                Settings
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </motion.aside>
    )
}
