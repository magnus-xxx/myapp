import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CloudRain, Flame, Wind } from 'lucide-react'

// Reliable CDN URLs for ambient sounds
const SOUND_SOURCES = {
    rain: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1253.mp3',
    fire: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackling-loop-1738.mp3',
    wind: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-blowing-sfx-1358.mp3'
}

export function AtmosphereController() {
    const [volumes, setVolumes] = useState({ rain: 0, fire: 0, wind: 0 })
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

    const handleVolumeChange = (type: string, value: number) => {
        setVolumes(prev => ({ ...prev, [type]: value }))

        if (!audioRefs.current[type]) {
            audioRefs.current[type] = new Audio(SOUND_SOURCES[type])
            audioRefs.current[type].loop = true
        }

        const audio = audioRefs.current[type]
        audio.volume = value

        if (value > 0 && audio.paused) {
            audio.play().catch(e => console.error("Audio play failed:", e))
        } else if (value === 0 && !audio.paused) {
            audio.pause()
        }
    }

    return (
        <div className="p-6 w-72">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 border-b border-white/5 pb-2">
                Atmosphere
            </h3>

            <div className="space-y-4">
                {/* RAIN */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-white/70">
                        <div className="flex items-center gap-2">
                            <CloudRain className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Rain</span>
                        </div>
                        <span className="text-xs font-mono">{Math.round(volumes.rain * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes.rain}
                        onChange={(e) => handleVolumeChange('rain', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                </div>

                {/* FIRE */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-white/70">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Fire</span>
                        </div>
                        <span className="text-xs font-mono">{Math.round(volumes.fire * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes.fire}
                        onChange={(e) => handleVolumeChange('fire', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                </div>

                {/* WIND */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-white/70">
                        <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Wind</span>
                        </div>
                        <span className="text-xs font-mono">{Math.round(volumes.wind * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes.wind}
                        onChange={(e) => handleVolumeChange('wind', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                </div>
            </div>
        </div>
    )
}
