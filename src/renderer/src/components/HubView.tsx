import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { HubService } from '../../../shared/types'

interface HubViewProps {
    services: HubService[]
    activeServiceId: number | null
    focusModeStyle: React.CSSProperties
}

// CRUCIAL: User Agent string to prevent Zalo/Facebook login blocking
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export function HubView({
    services,
    activeServiceId,
    focusModeStyle
}: HubViewProps) {
    const webviewRefs = useRef<Map<number, HTMLElement>>(new Map())

    const activeService = services.find(s => s.id === activeServiceId)

    useEffect(() => {
        // Cleanup webview refs
        return () => {
            webviewRefs.current.clear()
        }
    }, [])

    if (!activeService) {
        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0A0A0A',
                    color: '#525252',
                    fontSize: '1rem',
                    ...focusModeStyle
                }}
            >
                No service selected
            </div>
        )
    }

    return (
        <motion.div
            key={activeServiceId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#000000',
                position: 'relative',
                ...focusModeStyle
            }}
        >
            {/* Tab Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#0A0A0A',
                    borderBottom: '1px solid #262626'
                }}
            >
                <span style={{ fontSize: '1.25rem' }}>{activeService.icon}</span>
                <span
                    style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#FFFFFF'
                    }}
                >
                    {activeService.name}
                </span>
                <span
                    style={{
                        fontSize: '0.75rem',
                        color: '#525252',
                        marginLeft: 'auto'
                    }}
                >
                    {activeService.url}
                </span>
            </div>

            {/* Webview Container */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 0
                }}
            >
                {services.filter(s => s.enabled).map((service) => (
                    <webview
                        key={service.id}
                        ref={(el) => {
                            if (el) webviewRefs.current.set(service.id!, el)
                        }}
                        src={service.url}
                        // CRUCIAL: Persistent partition for cookie storage
                        partition={`persist:webview-${service.id}`}
                        // CRUCIAL: User Agent spoofing to prevent bot detection
                        useragent={CHROME_USER_AGENT}
                        allowpopups={true}
                        style={{
                            display: service.id === activeServiceId ? 'flex' : 'none',
                            flex: 1,
                            width: '100%',
                            minHeight: 0,
                            border: 'none',
                            backgroundColor: '#FFFFFF'
                        }}
                    />
                ))}
            </div>

            {/* Loading Overlay (optional - shows while webview loads) */}
            <div
                style={{
                    position: 'absolute',
                    top: 60,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#0A0A0A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#525252',
                    fontSize: '0.875rem',
                    pointerEvents: 'none',
                    opacity: 0,
                    animation: 'fadeOut 0.5s ease-in 1s forwards'
                }}
            >
                <style>
                    {`
            @keyframes fadeOut {
              to { opacity: 0; visibility: hidden; }
            }
          `}
                </style>
                Loading {activeService.name}...
            </div>
        </motion.div>
    )
}
