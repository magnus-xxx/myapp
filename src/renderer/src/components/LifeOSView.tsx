import { useState } from 'react'
import { ItemDomain, CalendarItem } from '../../../shared/types'
import { useCalendarItems } from '../hooks/useCalendarItems'
import { DomainSwitcher } from './DomainSwitcher'

export function LifeOSView() {
    const [activeDomain, setActiveDomain] = useState<ItemDomain | 'all'>('all')

    // Build filter based on active domain
    const filter = activeDomain === 'all' ? undefined : { domains: [activeDomain] }

    const { items, loading, error, refresh } = useCalendarItems(filter)

    const handleDomainChange = (domain: ItemDomain | 'all') => {
        setActiveDomain(domain)
    }

    return (
        <div
            style={{
                height: '100vh',
                background: '#0A0A0A',
                color: '#fff',
                overflow: 'auto',
                padding: '2rem'
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1
                    style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        margin: 0,
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, #fff 0%, #a3a3a3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    Life OS
                </h1>
                <p style={{ color: '#737373', margin: 0, fontSize: '0.875rem' }}>
                    Your unified productivity system across Work, Life, Study, and Invest
                </p>
            </div>

            {/* Domain Switcher */}
            <DomainSwitcher activeDomain={activeDomain} onDomainChange={handleDomainChange} />

            {/* Stats Bar */}
            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#737373', marginBottom: '0.25rem' }}>
                        Total Items
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{items.length}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#737373', marginBottom: '0.25rem' }}>
                        Active Domain
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {activeDomain}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#737373', marginBottom: '0.25rem' }}>
                        Status
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {loading ? '⏳' : error ? '❌' : '✅'}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '1.5rem',
                    minHeight: '400px'
                }}
            >
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            color: '#737373'
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                            <div>Loading items...</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            color: '#ef4444'
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                            <div>Error loading items</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#737373' }}>
                                {error.message}
                            </div>
                            <button
                                onClick={refresh}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '0.5rem',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && items.length === 0 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '400px',
                            color: '#737373'
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                            <div>No items found</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                {activeDomain === 'all'
                                    ? 'Create your first item to get started'
                                    : `No items in ${activeDomain} domain`}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && items.length > 0 && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                                Items ({items.length})
                            </h2>
                            <button
                                onClick={refresh}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '0.5rem',
                                    color: '#3b82f6',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                                }}
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {items.map((item) => (
                                <ItemCard key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ItemCard({ item }: { item: CalendarItem }) {
    const getDomainColor = (domain: ItemDomain) => {
        switch (domain) {
            case 'work':
                return '#3b82f6'
            case 'life':
                return '#10b981'
            case 'study':
                return '#f59e0b'
            case 'invest':
                return '#8b5cf6'
            default:
                return '#737373'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'event':
                return '📅'
            case 'task':
                return '✅'
            case 'milestone':
                return '🎯'
            case 'habit':
                return '🔁'
            default:
                return '📌'
        }
    }

    return (
        <div
            style={{
                padding: '1rem',
                background: '#1A1A1A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.background = '#1F1F1F'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.background = '#1A1A1A'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Type Icon */}
                <div style={{ fontSize: '1.5rem' }}>{getTypeIcon(item.type)}</div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
                        <span
                            style={{
                                padding: '0.125rem 0.5rem',
                                background: `${getDomainColor(item.domain)}20`,
                                border: `1px solid ${getDomainColor(item.domain)}40`,
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                color: getDomainColor(item.domain),
                                textTransform: 'uppercase',
                                fontWeight: 600
                            }}
                        >
                            {item.domain}
                        </span>
                        <span
                            style={{
                                padding: '0.125rem 0.5rem',
                                background: 'rgba(163, 163, 163, 0.1)',
                                border: '1px solid rgba(163, 163, 163, 0.2)',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                color: '#a3a3a3',
                                textTransform: 'capitalize'
                            }}
                        >
                            {item.type}
                        </span>
                    </div>

                    {item.description && (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#737373', marginBottom: '0.5rem' }}>
                            {item.description}
                        </p>
                    )}

                    {/* Metadata Preview */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div
                            style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                color: '#a3a3a3',
                                overflow: 'auto'
                            }}
                        >
                            <div style={{ marginBottom: '0.25rem', color: '#737373' }}>Metadata:</div>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(item.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
