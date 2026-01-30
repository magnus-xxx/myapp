import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { HubSidebar } from './components/HubSidebar'
import { HubView } from './components/HubView'
import { AddServiceWizard } from './components/AddServiceWizard'
import { PlanView } from './components/PlanView'
import { FinanceView } from './components/FinanceView'
import Settings from './pages/Settings'
import Sanctuary from './pages/Sanctuary'
import { HubService } from '../../shared/types'
import {
  pageTransitionVariants
} from './utils/animations'
import { useFocusMode } from './hooks/useFocusMode'
import { useHubServices } from './hooks/useHubServices'

function App() {
  const [activeNav, setActiveNav] = useState('sanctuary')
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)

  // Hooks
  const { getFocusModeStyle } = useFocusMode()
  const {
    services,
    activeServiceId,
    setActiveServiceId,
    addService,
    reorderServices
  } = useHubServices()

  // Load database info on mount
  useEffect(() => {
    loadDbInfo()
  }, [])

  const loadDbInfo = async (): Promise<void> => {
    try {
      const path = await window.api.getDbPath()
      console.log('Database path:', path)
    } catch (error) {
      console.error('Failed to get DB path:', error)
    }
  }

  const handleAddService = async (
    service: Omit<HubService, 'id' | 'created_at'>
  ): Promise<void> => {
    await addService(service)
    setIsAddServiceModalOpen(false)
  }

  const handleReorderServices = async (newOrder: HubService[]): Promise<void> => {
    const serviceIds = newOrder.map(s => s.id!).filter(id => id !== undefined)
    await reorderServices(serviceIds)
  }

  // Render Hub section
  const renderHub = () => {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Hub Sidebar */}
        <div style={getFocusModeStyle()}>
          <HubSidebar
            services={services}
            activeServiceId={activeServiceId}
            onServiceSelect={setActiveServiceId}
            onReorder={handleReorderServices}
            onAddClick={() => setIsAddServiceModalOpen(true)}
          />
        </div>

        {/* Hub View */}
        <HubView
          services={services}
          activeServiceId={activeServiceId}
          focusModeStyle={getFocusModeStyle()}
        />

        {/* Add Service Wizard */}
        <AddServiceWizard
          isOpen={isAddServiceModalOpen}
          onClose={() => setIsAddServiceModalOpen(false)}
          onAdd={handleAddService}
          nextPosition={services.length}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#121212',
        color: '#FFFFFF',
        overflow: 'hidden'
      }}
    >
      {/* MAGNUS Bar (Top Navigation) */}
      <Navbar
        activeNav={activeNav}
        onNavClick={setActiveNav}
        onSettingsClick={() => setActiveNav('settings')}
        focusMode={false}
        focusTimeRemaining={1499}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activeNav}
          variants={pageTransitionVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          style={{
            width: '100%',
            height: '100vh',
            paddingTop: '3.5rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Content Area - No header needed, Navbar handles it */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeNav === 'sanctuary' && <Sanctuary />}
            {activeNav === 'plan' && <PlanView />}
            {activeNav === 'brain' && renderHub()}
            {activeNav === 'vault' && <FinanceView />}
            {activeNav === 'settings' && <Settings />}
          </div>
        </motion.main>
      </AnimatePresence>
    </div>
  )
}

export default App
