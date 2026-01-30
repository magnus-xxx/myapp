import { ItemDomain } from '../../../shared/types'
import { Briefcase, Coffee, BookOpen, TrendingUp } from 'lucide-react'

interface DomainSwitcherProps {
    activeDomain: ItemDomain | 'all'
    onDomainChange: (domain: ItemDomain | 'all') => void
}

interface DomainConfig {
    value: ItemDomain
    label: string
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
    color: string
    bgColor: string
}

const DOMAINS: DomainConfig[] = [
    {
        value: 'work',
        label: 'Work',
        icon: Briefcase,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)'
    },
    {
        value: 'life',
        label: 'Life',
        icon: Coffee,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)'
    },
    {
        value: 'study',
        label: 'Study',
        icon: BookOpen,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)'
    },
    {
        value: 'invest',
        label: 'Invest',
        icon: TrendingUp,
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)'
    }
]

export function DomainSwitcher({ activeDomain, onDomainChange }: DomainSwitcherProps) {
    return (
        <div>
            {/* Header */}
            <h3
                style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#737373',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.625rem'
                }}
            >
                Domains
            </h3>

            {/* 2x2 Grid - Compact */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.375rem'
                }}
            >
                {DOMAINS.map((domain) => {
                    const isActive = activeDomain === domain.value
                    const Icon = domain.icon

                    return (
                        <button
                            key={domain.value}
                            onClick={() => onDomainChange(domain.value)}
                            title={domain.label}
                            style={{
                                padding: '0.5rem',
                                background: isActive ? domain.bgColor : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${isActive ? domain.color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem',
                                outline: 'none',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                                }
                            }}
                        >
                            <Icon
                                size={16}
                                style={{
                                    color: isActive ? domain.color : '#737373',
                                    transition: 'color 0.2s'
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.625rem',
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? domain.color : '#737373',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em'
                                }}
                            >
                                {domain.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* All Domains Toggle */}
            <button
                onClick={() => onDomainChange('all')}
                style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: activeDomain === 'all' ? 'rgba(163, 163, 163, 0.15)' : 'transparent',
                    border: `1px solid ${activeDomain === 'all' ? 'rgba(163, 163, 163, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '0.5rem',
                    color: activeDomain === 'all' ? '#a3a3a3' : '#737373',
                    fontSize: '0.75rem',
                    fontWeight: activeDomain === 'all' ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                }}
                onMouseEnter={(e) => {
                    if (activeDomain !== 'all') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    }
                }}
                onMouseLeave={(e) => {
                    if (activeDomain !== 'all') {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    }
                }}
            >
                All Domains
            </button>
        </div>
    )
}
