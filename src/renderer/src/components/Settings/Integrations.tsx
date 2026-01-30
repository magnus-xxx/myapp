import React, { useState, useEffect } from 'react'
import { Loader, User } from 'lucide-react'
import { GoogleLogo, OpenAILogo, SpotifyLogo } from '../Icons'

interface GoogleUserProfile {
    email: string
    name: string
    picture: string
}

const Integrations: React.FC = () => {
    // Google Calendar state
    const [isGoogleConnected, setIsGoogleConnected] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isCheckingStatus, setIsCheckingStatus] = useState(true)
    const [googleError, setGoogleError] = useState<string | null>(null)
    const [googleUserProfile, setGoogleUserProfile] = useState<GoogleUserProfile | null>(null)

    // Check Google auth status on mount
    useEffect(() => {
        checkGoogleAuthStatus()
    }, [])

    const checkGoogleAuthStatus = async () => {
        setIsCheckingStatus(true)
        try {
            const authenticated = await window.api.auth.checkStatus()
            setIsGoogleConnected(authenticated)

            if (authenticated) {
                // Fetch real user profile
                const profile = await window.api.auth.getProfile()
                if (profile) {
                    setGoogleUserProfile(profile)
                    console.log('[Integrations] User profile loaded:', profile.email)
                }
            }

            console.log('[Integrations] Google auth status:', authenticated)
        } catch (err) {
            console.error('[Integrations] Error checking Google auth status:', err)
        } finally {
            setIsCheckingStatus(false)
        }
    }

    const handleGoogleConnect = async () => {
        setIsGoogleLoading(true)
        setGoogleError(null)

        try {
            console.log('[Integrations] Starting Google OAuth flow...')

            // Call IPC to start Google OAuth flow
            const result = await window.api.auth.signInGoogle()

            if (result.success) {
                setIsGoogleConnected(true)

                // Fetch user profile after successful login
                const profile = await window.api.auth.getProfile()
                if (profile) {
                    setGoogleUserProfile(profile)
                    console.log('[Integrations] User profile loaded:', profile.email)
                }

                console.log('[Integrations] Google Calendar connected successfully')
            } else {
                const errorMessage = result.error || 'Failed to connect. Please try again.'
                setGoogleError(errorMessage)
                console.error('[Integrations] OAuth flow failed:', errorMessage)

                // Show alert with detailed error
                alert(`Google Calendar Connection Failed:\n\n${errorMessage}\n\nCheck the console for more details.`)
            }
        } catch (err) {
            const errorMessage = (err as any).message || 'An error occurred. Please check the console.'
            console.error('[Integrations] Google connection error:', err)
            setGoogleError(errorMessage)

            // Show alert with detailed error
            alert(`Google Calendar Connection Error:\n\n${errorMessage}\n\nCheck the console for more details.`)
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const handleGoogleDisconnect = async () => {
        setIsGoogleLoading(true)
        setGoogleError(null)

        try {
            await window.api.auth.signOutGoogle()
            setIsGoogleConnected(false)
            setGoogleUserProfile(null)
            console.log('[Integrations] Google Calendar disconnected')
        } catch (err) {
            console.error('[Integrations] Disconnect error:', err)
            setGoogleError('Failed to disconnect.')
        } finally {
            setIsGoogleLoading(false)
        }
    }

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h2>Integrations</h2>
                <p>Manage your connections to external services</p>
            </div>

            {isCheckingStatus ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '40px',
                    color: '#9ca3af'
                }}>
                    <Loader size={20} className="spinner" />
                    <span>Loading integrations...</span>
                </div>
            ) : (
                <div className="integrations-grid">
                    {/* Google Calendar Card */}
                    <div className="integration-card">
                        <div className="integration-card-header">
                            <div className="integration-card-info">
                                <div className="integration-icon">
                                    <GoogleLogo size={40} />
                                </div>
                                <div className="integration-title">
                                    <h3>Google Calendar</h3>
                                </div>
                            </div>
                            <div className={`integration-status-badge ${isGoogleConnected ? 'connected' : 'disconnected'}`}>
                                {isGoogleConnected ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>

                        <div className="integration-card-body">
                            <p className="integration-description">
                                Two-way sync for events, tasks, and meetings. Keep your calendar in sync across all your devices.
                            </p>
                            {googleError && (
                                <p className="integration-meta" style={{ color: '#ef4444', marginTop: '12px' }}>
                                    ⚠ {googleError}
                                </p>
                            )}
                        </div>

                        <div className="integration-card-footer">
                            {isGoogleConnected && googleUserProfile && (
                                <div className="integration-user-info">
                                    {googleUserProfile.picture ? (
                                        <img
                                            src={googleUserProfile.picture}
                                            alt="Profile"
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <User size={14} />
                                    )}
                                    <span>
                                        {googleUserProfile.name || googleUserProfile.email}
                                    </span>
                                </div>
                            )}

                            {isGoogleConnected ? (
                                <button
                                    className="integration-action-btn danger"
                                    onClick={handleGoogleDisconnect}
                                    disabled={isGoogleLoading}
                                >
                                    {isGoogleLoading ? (
                                        <>
                                            <Loader size={16} className="spinner" />
                                            <span>Disconnecting...</span>
                                        </>
                                    ) : (
                                        <span>Disconnect</span>
                                    )}
                                </button>
                            ) : (
                                <button
                                    className="integration-action-btn primary"
                                    onClick={handleGoogleConnect}
                                    disabled={isGoogleLoading}
                                >
                                    {isGoogleLoading ? (
                                        <>
                                            <Loader size={16} className="spinner" />
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <span>Connect Account</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* OpenAI Card */}
                    <div className="integration-card disabled">
                        <div className="integration-card-header">
                            <div className="integration-card-info">
                                <div className="integration-icon">
                                    <OpenAILogo size={40} />
                                </div>
                                <div className="integration-title">
                                    <h3>OpenAI</h3>
                                </div>
                            </div>
                            <div className="integration-status-badge coming-soon">
                                Coming Soon
                            </div>
                        </div>

                        <div className="integration-card-body">
                            <p className="integration-description">
                                Power your Brain with GPT-4. Get AI-powered insights, summaries, and intelligent task management.
                            </p>
                        </div>

                        <div className="integration-card-footer">
                            <button
                                className="integration-action-btn primary"
                                disabled
                            >
                                <span>Coming Soon</span>
                            </button>
                        </div>
                    </div>

                    {/* Spotify Card */}
                    <div className="integration-card disabled">
                        <div className="integration-card-header">
                            <div className="integration-card-info">
                                <div className="integration-icon">
                                    <SpotifyLogo size={40} />
                                </div>
                                <div className="integration-title">
                                    <h3>Spotify</h3>
                                </div>
                            </div>
                            <div className="integration-status-badge coming-soon">
                                Coming Soon
                            </div>
                        </div>

                        <div className="integration-card-body">
                            <p className="integration-description">
                                Control music playback from the sidebar. See what's playing and manage your playlists without leaving the app.
                            </p>
                        </div>

                        <div className="integration-card-footer">
                            <button
                                className="integration-action-btn primary"
                                disabled
                            >
                                <span>Coming Soon</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Integrations
