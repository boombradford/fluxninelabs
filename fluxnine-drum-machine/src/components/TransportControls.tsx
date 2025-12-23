import React from 'react';
import { motion } from 'framer-motion';

interface TransportControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onClear: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({ isPlaying, onPlayPause, onClear }) => {
    return (
        <div className="flex items-center gap-6">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayPause}
                className={`
          flex items-center justify-center w-16 h-16 md:w-14 md:h-14 rounded-full 
          ${isPlaying
                        ? 'bg-neon-pink shadow-[0_0_20px_rgba(255,0,255,0.6)]'
                        : 'bg-neon-green shadow-[0_0_20px_rgba(0,255,0,0.6)]'
                    }
          text-black transition-all duration-300
        `}
            >
                {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="ml-1">
                        <path d="M5 3L19 12L5 21V3Z" strokeLinejoin="round" />
                    </svg>
                )}
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onClear}
                className="px-4 py-2 rounded-lg bg-dark-surface border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors text-xs font-bold tracking-wider"
            >
                CLEAR PATTERN
            </motion.button>
        </div>
    );
};
