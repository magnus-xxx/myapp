import React, { useState } from 'react'
import { Settings as SettingsIcon, Link as LinkIcon, Palette } from 'lucide-react'
import Integrations from '../components/Settings/Integrations'
import './Settings.css'

type SettingsTab = 'general' | 'integrations' | 'appearance'

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('integrations')

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
            </div>

            <div className="settings-content">
                {/* Sidebar Tabs */}
                <div className="settings-sidebar">
                    <button
                        className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <SettingsIcon size={18} />
                        <span>General</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'integrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('integrations')}
                    >
                        <LinkIcon size={18} />
                        <span>Integrations</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        <Palette size={18} />
                        <span>Appearance</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="settings-main">
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <div className="settings-section-header">
                                <h2>General Settings</h2>
                                <p>Manage your application preferences and behavior</p>
                            </div>
                            <p style={{ color: '#9ca3af', marginTop: '24px' }}>
                                Coming soon...
                            </p>
                        </div>
                    )}

                    {activeTab === 'integrations' && <Integrations />}

                    {activeTab === 'appearance' && (
                        <div className="settings-section">
                            <div className="settings-section-header">
                                <h2>Appearance</h2>
                                <p>Customize the look and feel of your workspace</p>
                            </div>
                            <p style={{ color: '#9ca3af', marginTop: '24px' }}>
                                Coming soon...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Settings
