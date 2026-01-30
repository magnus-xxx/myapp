import { useState } from 'react'
import { SanctuarySidebar } from '../components/Sanctuary/SanctuarySidebar'
import { FocusCapsule } from '../components/Sanctuary/FocusCapsule'
import { SpotifyEmbed } from '../components/Sanctuary/SpotifyEmbed'
import { AtmosphereController } from '../components/Sanctuary/AtmosphereController'
import { Music } from 'lucide-react'

interface ActiveTask {
    id: string | number
    title: string
}

export function Sanctuary() {
    const [activeTask, setActiveTask] = useState<ActiveTask | null>(null)
    const [isSpotifyOpen, setIsSpotifyOpen] = useState(false)

    return (
        // LAYER 1: Main Container (Black base)
        <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-white selection:bg-blue-500/30">

            {/* LAYER 2: Background Image (Fixed Z-0) */}
            {/* Changed opacity logic: Keep image opaque, use overlay to darken. Cleaner look. */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop')" }}
            />

            {/* LAYER 3: Dark Glass Overlay (Fixed Z-10) */}
            {/* Increased clarity: slightly darker but blurrier for depth */}
            <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />

            {/* LAYER 4: Content Grid (Relative Z-20) */}
            <div className="relative z-20 grid h-full w-full grid-cols-[350px_1fr]">

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
                <main className="relative flex flex-col items-center justify-center w-full h-full p-6">

                    {/* 1. The Floating Focus Card */}
                    <FocusCapsule
                        activeTaskTitle={activeTask?.title}
                    />

                    {/* 2. The Bottom Dock (Separated from Card) */}
                    <div className="absolute bottom-12 flex items-center gap-4 p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-700">

                        {/* Atmosphere Controls */}
                        <div className="flex items-center px-4 border-r border-white/10">
                            <AtmosphereController />
                        </div>

                        {/* Spotify Toggle */}
                        <button
                            onClick={() => setIsSpotifyOpen(!isSpotifyOpen)}
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center transition-all
                                ${isSpotifyOpen ? 'bg-green-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}
                            `}
                        >
                            <Music className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 3. Spotify Drawer (Fixed Bottom Right) */}
                    <SpotifyEmbed isOpen={isSpotifyOpen} onClose={() => setIsSpotifyOpen(false)} />
                </main>
            </div>
        </div>
    )
}

export default Sanctuary