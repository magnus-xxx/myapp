import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for managing Focus Mode state
 * Focus Mode minimizes distractions by hiding/greyscaling the Hub
 */
export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load Focus Mode state from database on mount
  useEffect(() => {
    loadFocusMode()
  }, [])

  const loadFocusMode = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const value = await window.api.getSetting('focus_mode')
      setIsFocusMode(value === 'true')
    } catch (error) {
      console.error('[useFocusMode] Failed to load focus mode:', error)
      setIsFocusMode(false)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFocusMode = useCallback(async (): Promise<void> => {
    try {
      const newValue = !isFocusMode
      await window.api.setSetting('focus_mode', newValue ? 'true' : 'false')
      setIsFocusMode(newValue)
    } catch (error) {
      console.error('[useFocusMode] Failed to toggle focus mode:', error)
    }
  }, [isFocusMode])

  const enableFocusMode = useCallback(async (): Promise<void> => {
    if (!isFocusMode) {
      await toggleFocusMode()
    }
  }, [isFocusMode, toggleFocusMode])

  const disableFocusMode = useCallback(async (): Promise<void> => {
    if (isFocusMode) {
      await toggleFocusMode()
    }
  }, [isFocusMode, toggleFocusMode])

  /**
   * Get CSS filter for Focus Mode
   * Returns greyscale and opacity for visual "deemphasis"
   */
  const getFocusModeStyle = useCallback((): React.CSSProperties => {
    if (!isFocusMode) return {}
    
    return {
      filter: 'grayscale(100%)',
      opacity: 0.5,
      pointerEvents: 'none' as const,
      transition: 'all 0.3s ease-in-out'
    }
  }, [isFocusMode])

  return {
    isFocusMode,
    isLoading,
    toggleFocusMode,
    enableFocusMode,
    disableFocusMode,
    getFocusModeStyle
  }
}
