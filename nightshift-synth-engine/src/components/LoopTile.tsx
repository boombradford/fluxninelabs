import { motion } from 'framer-motion';
import { type LoopConfig } from '../lib/audioEngine';
import clsx from 'clsx';

interface LoopTileProps {
    loop: LoopConfig;
    isActive: boolean;
    onToggle: () => void;
}

const ICONS: Record<string, string> = {
    pad: '🌫',
    drone: '🌫',
    texture: '✨',
    arp: '✨',
    lead: '✨',
    pulse: '🔄',
    perc: '🥁',
    lofi: '👻'
};

export const LoopTile = ({ loop, isActive, onToggle }: LoopTileProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={clsx(
                "relative w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 overflow-hidden",
                isActive
                    ? "border-neon-pink bg-neon-pink/20 shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                    : "border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10"
            )}
        >
            <div className="text-4xl filter drop-shadow-lg">
                {ICONS[loop.role] || '🎵'}
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">
                {loop.id.replace(/_/g, ' ')}
            </span>

            {isActive && (
                <motion.div
                    layoutId="active-glow"
                    className="absolute inset-0 bg-gradient-to-t from-neon-pink/20 to-transparent pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </motion.button>
    );
};
