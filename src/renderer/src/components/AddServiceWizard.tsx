import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HubService } from '../../../shared/types'

interface AddServiceWizardProps {
    isOpen: boolean
    onClose: () => void
    onAdd: (service: Omit<HubService, 'id' | 'created_at'>) => Promise<void>
    nextPosition: number
}

// Service templates with enhanced styling
const SERVICE_TEMPLATES = [
    { name: 'Zalo', url: 'https://chat.zalo.me/', icon: '💬', color: '#0068FF' },
    { name: 'Lark', url: 'https://www.larksuite.com/', icon: '🐦', color: '#00D6A0' },
    { name: 'Messenger', url: 'https://www.messenger.com/', icon: '💌', color: '#0084FF' },
    { name: 'Slack', url: 'https://app.slack.com/', icon: '💼', color: '#4A154B' },
    { name: 'Notion', url: 'https://www.notion.so/', icon: '📝', color: '#000000' },
    { name: 'WhatsApp', url: 'https://web.whatsapp.com/', icon: '📱', color: '#25D366' },
    { name: 'Telegram', url: 'https://web.telegram.org/', icon: '✈️', color: '#0088CC' },
    { name: 'Discord', url: 'https://discord.com/channels/@me', icon: '🎮', color: '#5865F2' },
    { name: 'Gmail', url: 'https://mail.google.com/', icon: '📧', color: '#EA4335' },
    { name: 'Custom', url: '', icon: '🌐', color: '#FFFFFF' }
]

type WizardStep = 'select' | 'configure'

export function AddServiceWizard({
    isOpen,
    onClose,
    onAdd,
    nextPosition
}: AddServiceWizardProps) {
    const [step, setStep] = useState<WizardStep>('select')
    const [selectedTemplate, setSelectedTemplate] = useState<typeof SERVICE_TEMPLATES[0] | null>(null)
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [icon, setIcon] = useState('🌐')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleTemplateSelect = (template: typeof SERVICE_TEMPLATES[0]): void => {
        setSelectedTemplate(template)
        setName(template.name)
        setUrl(template.url)
        setIcon(template.icon)
        setStep('configure')
    }

    const handleBack = (): void => {
        setStep('select')
        setSelectedTemplate(null)
    }

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()

        if (!name.trim() || !url.trim()) {
            alert('Please fill in name and URL')
            return
        }

        setIsSubmitting(true)
        try {
            await onAdd({
                name: name.trim(),
                url: url.trim(),
                icon,
                color: selectedTemplate?.color || '#FFFFFF',
                position: nextPosition,
                enabled: true
            })

            // Reset state
            setStep('select')
            setSelectedTemplate(null)
            setName('')
            setUrl('')
            setIcon('🌐')
            onClose()
        } catch (error) {
            console.error('Failed to add service:', error)
            alert('Failed to add service')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = (): void => {
        setStep('select')
        setSelectedTemplate(null)
        setName('')
        setUrl('')
        setIcon('🌐')
        onClose()
    }

    if (!isOpen) return <></>

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '2rem 3rem',
                    borderBottom: '1px solid #262626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {step === 'configure' && (
                        <motion.button
                            onClick={handleBack}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                border: '1px solid #404040',
                                backgroundColor: 'transparent',
                                color: '#FFFFFF',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                outline: 'none'
                            }}
                        >
                            ←
                        </motion.button>
                    )}
                    <div>
                        <h1
                            style={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                margin: 0,
                                color: '#FFFFFF',
                                letterSpacing: '-0.02em'
                            }}
                        >
                            {step === 'select' ? 'Add New Service' : 'Configure Service'}
                        </h1>
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: '#737373',
                                margin: '0.5rem 0 0 0'
                            }}
                        >
                            {step === 'select'
                                ? 'Choose a service to integrate into your workflow'
                                : 'Customize your service details'}
                        </p>
                    </div>
                </div>

                <motion.button
                    onClick={handleClose}
                    whileHover={{ scale: 1.1, backgroundColor: '#262626' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: '1px solid #404040',
                        backgroundColor: 'transparent',
                        color: '#737373',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        transition: 'all 0.2s'
                    }}
                >
                    ✕
                </motion.button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                padding: '3rem',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '2rem',
                                maxWidth: '1400px',
                                margin: '0 auto'
                            }}
                        >
                            {SERVICE_TEMPLATES.map((template) => (
                                <motion.button
                                    key={template.name}
                                    onClick={() => handleTemplateSelect(template)}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: '0 0 40px rgba(255, 255, 255, 0.1)'
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: '#171717',
                                        border: '1px solid #262626',
                                        borderRadius: '1.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '1rem',
                                        padding: '2rem',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Glow effect on hover */}
                                    <motion.div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: `radial-gradient(circle at center, ${template.color}20, transparent 70%)`,
                                            opacity: 0
                                        }}
                                        whileHover={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />

                                    <span style={{ fontSize: '4rem', zIndex: 1 }}>{template.icon}</span>
                                    <span
                                        style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 600,
                                            color: '#FFFFFF',
                                            zIndex: 1
                                        }}
                                    >
                                        {template.name}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {step === 'configure' && (
                        <motion.div
                            key="configure"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                padding: '3rem',
                                maxWidth: '800px',
                                margin: '0 auto',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                        >
                            {/* Service Preview */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2rem',
                                    padding: '2rem',
                                    backgroundColor: '#171717',
                                    borderRadius: '1rem',
                                    border: '1px solid #262626',
                                    marginBottom: '3rem'
                                }}
                            >
                                <div
                                    style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: '1rem',
                                        backgroundColor: '#0A0A0A',
                                        border: '1px solid #404040',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '4rem'
                                    }}
                                >
                                    {icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2
                                        style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            margin: 0,
                                            color: '#FFFFFF'
                                        }}
                                    >
                                        {name || 'Service Name'}
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: '1rem',
                                            color: '#737373',
                                            margin: '0.5rem 0 0 0',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        {url || 'https://example.com'}
                                    </p>
                                </div>
                            </div>

                            {/* Configuration Form */}
                            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label
                                            style={{
                                                display: 'block',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                color: '#FFFFFF',
                                                marginBottom: '0.75rem'
                                            }}
                                        >
                                            Service Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Slack"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '1rem 1.5rem',
                                                backgroundColor: '#0A0A0A',
                                                border: '1px solid #262626',
                                                borderRadius: '0.75rem',
                                                color: '#FFFFFF',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#404040'}
                                            onBlur={(e) => e.target.style.borderColor = '#262626'}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <label
                                            style={{
                                                display: 'block',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                color: '#FFFFFF',
                                                marginBottom: '0.75rem'
                                            }}
                                        >
                                            Service URL
                                        </label>
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://example.com"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '1rem 1.5rem',
                                                backgroundColor: '#0A0A0A',
                                                border: '1px solid #262626',
                                                borderRadius: '0.75rem',
                                                color: '#FFFFFF',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#404040'}
                                            onBlur={(e) => e.target.style.borderColor = '#262626'}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            style={{
                                                display: 'block',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                color: '#FFFFFF',
                                                marginBottom: '0.75rem'
                                            }}
                                        >
                                            Icon (emoji)
                                        </label>
                                        <input
                                            type="text"
                                            value={icon}
                                            onChange={(e) => setIcon(e.target.value)}
                                            maxLength={2}
                                            style={{
                                                width: '120px',
                                                padding: '1rem',
                                                backgroundColor: '#0A0A0A',
                                                border: '1px solid #262626',
                                                borderRadius: '0.75rem',
                                                color: '#FFFFFF',
                                                fontSize: '2rem',
                                                textAlign: 'center',
                                                fontFamily: 'inherit',
                                                outline: 'none',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#404040'}
                                            onBlur={(e) => e.target.style.borderColor = '#262626'}
                                        />
                                    </div>
                                </div>

                                {/* Action Button */}
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        width: '100%',
                                        padding: '1.25rem',
                                        backgroundColor: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        color: '#000000',
                                        fontSize: '1.125rem',
                                        fontWeight: 700,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        opacity: isSubmitting ? 0.6 : 1,
                                        marginTop: '2rem'
                                    }}
                                >
                                    {isSubmitting ? 'Adding Service...' : 'Add to Hub'}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
