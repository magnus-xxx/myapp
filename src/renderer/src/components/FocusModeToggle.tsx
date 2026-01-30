import { motion } from 'framer-motion'
import { useFocusMode } from '../hooks/useFocusMode'

export function FocusModeToggle() {
    const { isFocusMode, isLoading, toggleFocusMode } = useFocusMode()

    if (isLoading) return <></>

    return (
        <motion.button
            onClick={toggleFocusMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isFocusMode ? {
                boxShadow: [
                    '0 0 20px rgba(255, 255, 255, 0.1)',
                    '0 0 30px rgba(255, 255, 255, 0.15)',
                    '0 0 20px rgba(255, 255, 255, 0.1)'
                ]
            } : {}}
            transition={isFocusMode ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
            } : {}}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                background: isFocusMode
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: isFocusMode ? '#000000' : '#FFFFFF',
                border: isFocusMode
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.875rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                outline: 'none',
                boxShadow: isFocusMode
                    ? '0 0 20px rgba(255, 255, 255, 0.1)'
                    : '0 0 10px rgba(255, 255, 255, 0.02)'
            }}
            title={isFocusMode ? 'Exit Deep Work Mode' : 'Enter Deep Work Mode'}
        >
            <motion.span
                style={{ fontSize: '1.25rem' }}
                animate={isFocusMode ? { rotate: [0, 5, -5, 0] } : {}}
                transition={isFocusMode ? { duration: 2, repeat: Infinity } : {}}
            >
                {isFocusMode ? '🎯' : '◎'}
            </motion.span>
            <span>
                {isFocusMode ? 'Deep Work' : 'Focus'}
            </span>
        </motion.button>
    )
}
