import { motion } from 'framer-motion'
import { ReactNode } from 'react'

// Size variants for Bento cards
type CardSize = 'sm' | 'md' | 'lg' | 'xl' | 'wide' | 'tall'

interface BentoCardProps {
    title: string
    subtitle?: string
    size?: CardSize
    children?: ReactNode
    className?: string
}

// Card sizing map
const sizeStyles: Record<CardSize, { gridColumn: string; gridRow: string }> = {
    sm: { gridColumn: 'span 1', gridRow: 'span 1' },
    md: { gridColumn: 'span 2', gridRow: 'span 1' },
    lg: { gridColumn: 'span 2', gridRow: 'span 2' },
    xl: { gridColumn: 'span 3', gridRow: 'span 2' },
    wide: { gridColumn: 'span 3', gridRow: 'span 1' },
    tall: { gridColumn: 'span 1', gridRow: 'span 2' }
}

export function BentoCard({
    title,
    subtitle,
    size = 'sm',
    children,
    className = ''
}: BentoCardProps) {
    const sizeStyle = sizeStyles[size]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
                scale: 1.01,
                y: -6,
                transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }}
            whileTap={{ scale: 0.98 }}
            className={`bento-card ${className}`}
            style={{
                gridColumn: sizeStyle.gridColumn,
                gridRow: sizeStyle.gridRow,
                // Glassmorphism effect
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '1.25rem',
                padding: size === 'sm' || size === 'tall' ? '2rem' : '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
                // Soft glow shadow
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.02)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.boxShadow = '0 0 40px rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.02)'
            }}
        >
            {/* Subtle gradient overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    pointerEvents: 'none'
                }}
            />

            {/* Card Header */}
            <div>
                <h3
                    style={{
                        fontSize: size === 'sm' || size === 'tall' ? '1.125rem' : '1.5rem',
                        fontWeight: 500,
                        color: '#FFFFFF',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}
                >
                    {title}
                </h3>
                {subtitle && (
                    <p
                        style={{
                            fontSize: '0.875rem',
                            color: '#71717a',
                            margin: '0.5rem 0 0 0',
                            fontWeight: 400,
                            letterSpacing: '-0.01em'
                        }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Card Content */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 0
                }}
            >
                {children || (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#52525b',
                            fontSize: '0.875rem',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            background: 'rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        Content placeholder
                    </div>
                )}
            </div>
        </motion.div>
    )
}
