import { motion, Reorder } from 'framer-motion'
import { HubService } from '../../../shared/types'

interface HubSidebarProps {
    services: HubService[]
    activeServiceId: number | null
    onServiceSelect: (id: number) => void
    onReorder: (newOrder: HubService[]) => void
    onAddClick: () => void
}

export function HubSidebar({
    services,
    activeServiceId,
    onServiceSelect,
    onReorder,
    onAddClick
}: HubSidebarProps) {
    const enabledServices = services.filter(s => s.enabled)

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
                width: 80,
                height: '100vh',
                backgroundColor: '#0A0A0A',
                borderRight: '1px solid #262626',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem 0.5rem',
                gap: '0.75rem',
                overflowY: 'auto'
            }}
        >
            {/* Service Icons - Drag to Reorder */}
            <Reorder.Group
                axis="y"
                values={enabledServices}
                onReorder={onReorder}
                style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    flex: 1
                }}
            >
                {enabledServices.map((service) => (
                    <Reorder.Item
                        key={service.id}
                        value={service}
                        style={{ cursor: 'grab' }}
                        whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                    >
                        <motion.button
                            onClick={() => onServiceSelect(service.id!)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: '100%',
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem',
                                border: activeServiceId === service.id ? '2px solid #FFFFFF' : '1px solid #262626',
                                borderRadius: '0.75rem',
                                backgroundColor: activeServiceId === service.id ? '#171717' : '#0A0A0A',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            title={service.name}
                        >
                            {/* Icon */}
                            <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>

                            {/* Name (truncated) */}
                            <span
                                style={{
                                    fontSize: '0.625rem',
                                    color: activeServiceId === service.id ? '#FFFFFF' : '#737373',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                    fontWeight: 500
                                }}
                            >
                                {service.name}
                            </span>
                        </motion.button>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            {/* Add Service Button */}
            <motion.button
                onClick={onAddClick}
                whileHover={{ scale: 1.1, backgroundColor: '#171717' }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #404040',
                    borderRadius: '0.75rem',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: '#525252',
                    outline: 'none',
                    transition: 'all 0.2s'
                }}
                title="Add Service"
            >
                +
            </motion.button>
        </motion.aside>
    )
}
