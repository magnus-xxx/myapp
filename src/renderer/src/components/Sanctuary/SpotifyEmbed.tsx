
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SpotifyEmbedProps {
    isOpen: boolean
    onClose: () => void
}

export function SpotifyEmbed({ isOpen, onClose }: SpotifyEmbedProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-24 right-8 w-80 h-[480px] z-50 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/80 backdrop-blur-3xl"
                >
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-end pr-3 pt-3">
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-black/40 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <iframe
                        src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
