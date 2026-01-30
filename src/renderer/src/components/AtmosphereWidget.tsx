import { useState, useEffect, useRef } from 'react'

export function AtmosphereWidget() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(0.5)
    const [activeSound, setActiveSound] = useState<'rain' | 'white_noise' | 'coffee'>('rain')

    const audioContextRef = useRef<AudioContext | null>(null)
    const sourceRef = useRef<AudioBufferSourceNode | null>(null)
    const gainNodeRef = useRef<GainNode | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number | null>(null)

    useEffect(() => {
        // Initialize Audio Context
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.connect(audioContextRef.current.destination)
        gainNodeRef.current.gain.value = volume

        return () => {
            audioContextRef.current?.close()
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        }
    }, [])

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime || 0, 0.1)
        }
    }, [volume])

    const createNoiseBuffer = (type: 'white' | 'pink' | 'brown') => {
        if (!audioContextRef.current) return null
        const bufferSize = audioContextRef.current.sampleRate * 2 // 2 seconds buffer
        const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
        const data = buffer.getChannelData(0)

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1
            }
        } else if (type === 'brown') {
            let lastOut = 0
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1
                data[i] = (lastOut + (0.02 * white)) / 1.02
                lastOut = data[i]
                data[i] *= 3.5 // Compensate for gain loss
            }
        }

        return buffer
    }

    const togglePlay = () => {
        if (isPlaying) {
            sourceRef.current?.stop()
            sourceRef.current = null
            setIsPlaying(false)
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            // Clear canvas
            const cvs = canvasRef.current
            if (cvs) {
                const ctx = cvs.getContext('2d')
                ctx?.clearRect(0, 0, cvs.width, cvs.height)
            }
        } else {
            if (!audioContextRef.current) return

            const buffer = createNoiseBuffer(activeSound === 'white_noise' ? 'white' : 'brown')
            // For Coffee Shop, we can't synthesize easily, so failover to brown noise (Rain) as placeholder
            // In a real app, we'd load an MP3 here.

            if (buffer) {
                const source = audioContextRef.current.createBufferSource()
                source.buffer = buffer
                source.loop = true
                source.connect(gainNodeRef.current!)
                source.start()
                sourceRef.current = source
                setIsPlaying(true)
                animateVisuals()
            }
        }
    }

    const animateVisuals = () => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        const width = canvasRef.current.width
        const height = canvasRef.current.height
        let time = 0

        const draw = () => {
            if (!isPlaying) return

            ctx.fillStyle = '#171717' // Background matches container
            // ctx.clearRect(0, 0, width, height) // Clear transparently? No, fade out trail
            ctx.fillRect(0, 0, width, height) // Clear with bg color

            ctx.beginPath()
            ctx.lineWidth = 2
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'

            // Draw 3 sine waves
            for (let i = 0; i < 3; i++) {
                ctx.beginPath()
                for (let x = 0; x < width; x++) {
                    const y = height / 2 +
                        Math.sin(x * 0.01 + time + i) * 20 * (volume * 2) +
                        Math.sin(x * 0.02 + time * 1.5) * 10
                    ctx.lineTo(x, y)
                }
                ctx.stroke()
            }

            time += 0.05
            animationFrameRef.current = requestAnimationFrame(draw)
        }
        draw()
    }

    // Resize observer for canvas
    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = canvasRef.current.offsetWidth
                canvasRef.current.height = canvasRef.current.offsetHeight
            }
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [])

    return (
        <div style={{
            backgroundColor: '#171717',
            borderRadius: '0.5rem',
            border: '0px solid #262626', // BentoGrid handles border usually? Or keep it.
            overflow: 'hidden',
            position: 'relative',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Visualiser Background */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0
                }}
            />

            {/* Controls */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '2rem'
            }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 300 }}>Atmosphere</h2>

                {/* Sound Selection */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {[
                        { id: 'rain', label: 'Rain' },
                        { id: 'white_noise', label: 'White Noise' },
                        { id: 'coffee', label: 'Coffee Shop' }
                    ].map(sound => (
                        <button
                            key={sound.id}
                            onClick={() => {
                                setActiveSound(sound.id as any)
                                if (isPlaying) { // Restart to change sound if playing
                                    togglePlay() // Stop
                                    setTimeout(togglePlay, 100) // Start new
                                }
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                border: `1px solid ${activeSound === sound.id ? '#fff' : '#404040'}`,
                                backgroundColor: activeSound === sound.id ? '#fff' : 'transparent',
                                color: activeSound === sound.id ? '#000' : '#737373',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                        >
                            {sound.label}
                        </button>
                    ))}
                </div>

                {/* Play Toggle */}
                <button
                    onClick={togglePlay}
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: isPlaying ? '#fff' : 'transparent',
                        border: '2px solid #fff',
                        color: isPlaying ? '#000' : '#fff',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                    }}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Volume Slider */}
                <div style={{ width: '200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#737373', fontSize: '0.8rem' }}>🔈</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        style={{
                            flex: 1,
                            accentColor: '#fff',
                            cursor: 'pointer'
                        }}
                    />
                    <span style={{ color: '#737373', fontSize: '0.8rem' }}>🔊</span>
                </div>
            </div>
        </div>
    )
}
