import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface BentoGridProps {
    children: ReactNode
    columns?: number
    className?: string
}

export function BentoGrid({
    children,
    columns = 4,
    className = ''
}: BentoGridProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`bento-grid ${className}`}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridAutoRows: 'minmax(180px, auto)',
                gap: '1rem',
                padding: '1.5rem',
                width: '100%',
                height: '100%',
                overflowY: 'auto'
            }}
        >
            {children}
        </motion.div>
    )
}
