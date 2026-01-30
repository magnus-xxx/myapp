import { motion } from 'framer-motion'
import { useState } from 'react'
import { Home, CalendarCheck2, Brain, Gem, Settings } from 'lucide-react'

// Navigation items for the Maglev Sidebar
const navItems = [
    { id: 'sanctuary', label: 'Sanctuary', icon: Home, description: 'Your focus space' },
    { id: 'plan', label: 'Plan', icon: CalendarCheck2, description: 'Work & Calendar' },
    { id: 'brain', label: 'Second Brain', icon: Brain, description: 'Notes & Browser' },
    { id: 'vault', label: 'Vault', icon: Gem, description: 'Finance' }
]

interface MaglevSidebarProps {
    activeItem: string
    onItemClick: (id: string) => void
    onSettingsClick: () => void
}

export function MaglevSidebar({ activeItem, onItemClick, onSettingsClick }: MaglevSidebarProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
            {/* Navigation Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeItem === item.id
                    const isHovered = hoveredItem === item.id

                    return (
                        <div key={item.id} style={{ position: 'relative' }}>
                            <motion.button
                                onClick={() => onItemClick(item.id)}
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    position: 'relative',
                                    width: '3rem',
                                    height: '3rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.3s',
                                    outline: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    boxShadow: isActive
                                        ? '0 0 20px rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                        : 'none'
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent'
                                    }
                                }}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={1.5}
                                    color={isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
                                    style={{ transition: 'color 0.3s' }}
                                />
                            </motion.button>

                            {/* Tooltip */}
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        marginLeft: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '0.5rem 0.75rem',
                                        background: 'rgba(0, 0, 0, 0.9)',
                                        backdropFilter: 'blur(40px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0.5rem',
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.125rem' }}>
                                        {item.description}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Settings */}
            <div style={{ position: 'relative' }}>
                <motion.button
                    onClick={onSettingsClick}
                    onMouseEnter={() => setHoveredItem('settings')}
                    onMouseLeave={() => setHoveredItem(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: '3rem',
                        height: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.75rem',
                        transition: 'all 0.3s',
                        outline: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'transparent'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent'
                    }}
                >
                    <Settings size={22} strokeWidth={1.5} color="rgba(255, 255, 255, 0.6)" />
                </motion.button>

                {/* Tooltip */}
                {hoveredItem === 'settings' && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        style={{
                            position: 'absolute',
                            left: '100%',
                            marginLeft: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(0, 0, 0, 0.9)',
                            backdropFilter: 'blur(40px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.5rem',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>
                            Settings
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.125rem' }}>
                            Preferences
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.aside>
    )
}
