import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Milestone } from '../../../shared/types'

interface PlanSidebarProps {
    activeView: string
    onViewChange: (view: string) => void
}

export function PlanSidebar({ activeView, onViewChange }: PlanSidebarProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([])

    useEffect(() => {
        loadMilestones()
    }, [])

    const loadMilestones = async () => {
        try {
            const loaded = await window.api.getMilestones()
            setMilestones(loaded.filter(m => !m.completed))
        } catch (error) {
            console.error('Failed to load milestones:', error)
        }
    }

    const mainViews = [
        { id: 'my-day', label: 'My Day', icon: '☀️' },
        { id: 'calendar', label: 'Calendar', icon: '📅' },
        { id: 'all-tasks', label: 'All Tasks', icon: '📋' }
    ]

    const NavButton = ({ id, label, icon }: { id: string, label: string, icon: string }) => (
        <motion.button
            onClick={() => onViewChange(id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeView === id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: activeView === id ? '#fff' : '#a3a3a3',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: activeView === id ? 600 : 500,
                textAlign: 'left',
                transition: 'all 0.2s ease',
                outline: 'none'
            }}
            onMouseEnter={(e) => {
                if (activeView !== id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.color = '#d4d4d4'
                }
            }}
            onMouseLeave={(e) => {
                if (activeView !== id) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#a3a3a3'
                }
            }}
        >
            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            <span>{label}</span>
        </motion.button>
    )

    return (
        <div
            style={{
                width: '260px',
                height: '100%',
                backgroundColor: '#171717',
                borderRight: '1px solid #262626',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1rem',
                gap: '1.5rem'
            }}
        >
            {/* Main Views */}
            <div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#525252',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem',
                        paddingLeft: '1rem'
                    }}
                >
                    Views
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {mainViews.map((view) => (
                        <NavButton key={view.id} {...view} />
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#262626' }} />

            {/* Projects/Milestones */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#525252',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem',
                        paddingLeft: '1rem'
                    }}
                >
                    Projects
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {milestones.length === 0 ? (
                        <div
                            style={{
                                padding: '1rem',
                                fontSize: '0.875rem',
                                color: '#525252',
                                textAlign: 'center'
                            }}
                        >
                            No active projects
                        </div>
                    ) : (
                        milestones.map((milestone) => (
                            <motion.button
                                key={milestone.id}
                                onClick={() => onViewChange(`project-${milestone.id}`)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    background: activeView === `project-${milestone.id}` ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: activeView === `project-${milestone.id}` ? '#fff' : '#a3a3a3',
                                    cursor: 'pointer',
                                    fontSize: '0.9375rem',
                                    fontWeight: activeView === `project-${milestone.id}` ? 600 : 500,
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeView !== `project-${milestone.id}`) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                        e.currentTarget.style.color = '#d4d4d4'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeView !== `project-${milestone.id}`) {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.color = '#a3a3a3'
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: milestone.color,
                                        flexShrink: 0
                                    }}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {milestone.title}
                                </span>
                            </motion.button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
