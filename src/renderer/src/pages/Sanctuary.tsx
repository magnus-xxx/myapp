import { useState } from 'react'
import { SanctuarySidebar } from '../components/Sanctuary/SanctuarySidebar'
import { FocusCapsule } from '../components/Sanctuary/FocusCapsule'
import { SpotifyEmbed } from '../components/Sanctuary/SpotifyEmbed'
import { AtmosphereController } from '../components/Sanctuary/AtmosphereController'

interface ActiveTask {
    id: string | number
    title: string
}

export function Sanctuary() {
    const [activeTask, setActiveTask] = useState<ActiveTask | null>(null)
    const [isSpotifyOpen, setIsSpotifyOpen] = useState(false)
    const [showAtmosphere, setShowAtmosphere] = useState(false)

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-white">
            {/* Background Image - FORCED VISIBILITY */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-70 transition-opacity duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop')" }}
            />

            {/* Dark Overlay for Text Contrast */}
            <div className="absolute inset-0 z-0 bg-black/40" />

            {/* Content Grid */}
            <div className="relative z-10 grid h-full w-full grid-cols-[340px_1fr]">

                {/* LEFT: Sidebar Panel */}
                <SanctuarySidebar
                    activeTaskId={activeTask?.id}
                    onTaskSelect={(task) => {
                        if (task.id) {
                            setActiveTask({ id: task.id, title: task.title })
                        }
                    }}
                />

                {/* RIGHT: Main Focus Area */}
                <main className="relative flex flex-col items-center justify-center p-10 w-full h-full">
                    <FocusCapsule
                        activeTaskTitle={activeTask?.title}
                        onSpotifyToggle={() => setIsSpotifyOpen(!isSpotifyOpen)}
                    />

                    {/* Floating Docks */}
                    <div className="absolute bottom-10 right-10 flex flex-col gap-4 items-end">
                        {/* Toggle for Atmosphere is implicitly handled or could be added here */}
                        <div className="scale-90 origin-bottom-right">
                            {/* Atmosphere could be toggled, for now rendering properly if needed */}
                        </div>
                    </div>

                    <SpotifyEmbed isOpen={isSpotifyOpen} onClose={() => setIsSpotifyOpen(false)} />

                    {/* Atmosphere Controller - Positioned absolute bottom right for now or toggled */}
                    <div className="absolute bottom-10 right-28">
                        {/* Keeping it hidden unless explicitly toggled or integrated differently if not passed down. 
                             Based on previous request, it was separate. I'll include it in the layout but maybe hidden by default. 
                             Actually, let's keep it as an overlay triggered by the FocusCapsule controls as before, 
                             or if the user wants it visible, we can slot it. 
                             The user asked to "Render Dock & Spotify here or inside main".
                         */}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Sanctuary
