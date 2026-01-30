import { useState, useEffect, useCallback } from 'react'
import { HubService } from '../../../shared/types'

/**
 * Custom hook for managing Hub Services
 * Handles CRUD operations for external web app integrations
 */
export function useHubServices() {
  const [services, setServices] = useState<HubService[]>([])
  const [activeServiceId, setActiveServiceId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load services on mount
  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const loadedServices = await window.api.getHubServices()
      setServices(loadedServices)
      
      // Set first service as active if none selected
      if (loadedServices.length > 0 && !activeServiceId) {
        setActiveServiceId(loadedServices[0].id!)
      }
    } catch (err) {
      setError('Failed to load services')
      console.error('[useHubServices] Failed to load services:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeServiceId])

  const addService = useCallback(async (
    service:  Omit<HubService, 'id' | 'created_at'>
  ): Promise<HubService | null> => {
    try {
      setError(null)
      const newService = await window.api.addHubService(service)
      setServices(prev => [...prev, newService])
      return newService
    } catch (err) {
      setError('Failed to add service')
      console.error('[useHubServices] Failed to add service:', err)
      return null
    }
  }, [])

  const updateService = useCallback(async (
    id: number,
    updates: Partial<HubService>
  ): Promise<HubService | null> => {
    try {
      setError(null)
      const updated = await window.api.updateHubService(id, updates)
      if (updated) {
        setServices(prev => prev.map(s => s.id === id ? updated : s))
      }
      return updated
    } catch (err) {
      setError('Failed to update service')
      console.error('[useHubServices] Failed to update service:', err)
      return null
    }
  }, [])

  const deleteService = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null)
      const success = await window.api.deleteHubService(id)
      if (success) {
        setServices(prev => prev.filter(s => s.id !== id))
        
        // Clear active service if it was deleted
        if (activeServiceId === id) {
          const remaining = services.filter(s => s.id !== id)
          setActiveServiceId(remaining.length > 0 ? remaining[0].id! : null)
        }
      }
      return success
    } catch (err) {
      setError('Failed to delete service')
      console.error('[useHubServices] Failed to delete service:', err)
      return false
    }
  }, [activeServiceId, services])

  const reorderServices = useCallback(async (serviceIds: number[]): Promise<void> => {
    try {
      setError(null)
      await window.api.reorderHubServices(serviceIds)
      
      // Reload to get updated positions
      await loadServices()
    } catch (err) {
      setError('Failed to reorder services')
      console.error('[useHubServices] Failed to reorder services:', err)
    }
  }, [loadServices])

  const toggleServiceEnabled = useCallback(async (id: number): Promise<void> => {
    const service = services.find(s => s.id === id)
    if (service) {
      await updateService(id, { enabled: !service.enabled })
    }
  }, [services, updateService])

  const getEnabledServices = useCallback((): HubService[] => {
    return services.filter(s => s.enabled)
  }, [services])

  const getActiveService = useCallback((): HubService | null => {
    if (!activeServiceId) return null
    return services.find(s => s.id === activeServiceId) || null
  }, [activeServiceId, services])

  return {
    services,
    activeServiceId,
    setActiveServiceId,
    isLoading,
    error,
    loadServices,
    addService,
    updateService,
    deleteService,
    reorderServices,
    toggleServiceEnabled,
    getEnabledServices,
    getActiveService
  }
}
