import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { audioEngine } from '../lib/audioEngine';
import type { Instrument, Intensity } from '../lib/audioEngine';
import clsx from 'clsx';

export const LiveMatrix = () => {
    // Force re-render on engine updates
    const [, setTick] = useState(0);

    useEffect(() => {
        audioEngine.setCallback(() => {
            setTick(t => t + 1);
        });
    }, []);

    const handleCellClick = (inst: Instrument, level: Intensity) => {
        audioEngine.queueCell(inst, level);
    };

    const instruments: Instrument[] = ['drums', 'bass', 'synth', 'fx'];
    const intensities: Intensity[] = [1, 2, 3, 4];

    const getCellColor = (inst: Instrument, level: Intensity) => {
        const baseColors = {
            drums: 'bg-retro-orange',
            bass: 'bg-retro-pink',
            synth: 'bg-retro-cyan',
            fx: 'bg-retro-sand'
        };

        // Opacity based on intensity
        const opacity = 0.4 + (level * 0.15);
        return `${baseColors[inst]}/${Math.floor(opacity * 100)}`;
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 p-4">
            {/* Matrix Grid */}
            <div className="flex-1 grid grid-cols-4 gap-4">
                {instruments.map((inst) => (
                    <div key={inst} className="flex flex-col gap-4">
                        {/* Column Header */}
                        <div className="text-center text-xs font-bold uppercase tracking-widest text-retro-sand/60">
                            {inst}
                        </div>

                        {intensities.map((level) => {
                            const state = audioEngine.getCellState(inst, level);
                            const isPlaying = state === 'playing';
                            const isQueued = state === 'queued';

                            return (
                                <motion.button
                                    key={`${inst}-${level}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCellClick(inst, level)}
                                    className={clsx(
                                        "flex-1 rounded-xl relative overflow-hidden transition-all duration-200",
                                        "border-2",
                                        isPlaying ? "border-white shadow-[0_0_20px_currentColor]" : "border-transparent bg-white/5",
                                        isQueued && "animate-pulse border-white/50"
                                    )}
                                >
                                    {/* Background Fill */}
                                    <div className={clsx(
                                        "absolute inset-0 transition-opacity duration-500",
                                        getCellColor(inst, level),
                                        isPlaying ? "opacity-100" : "opacity-20 hover:opacity-40"
                                    )} />

                                    {/* Level Indicator */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="flex gap-1">
                                            {Array.from({ length: level }).map((_, i) => (
                                                <div key={i} className="w-1 h-1 bg-white rounded-full" />
                                            ))}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Master FX Pad */}
            <div className="h-32 bg-retro-space/30 rounded-xl border border-retro-space/50 relative overflow-hidden touch-none cursor-crosshair">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <span className="text-xs uppercase tracking-[0.5em]">Master FX (Filter / Reverb)</span>
                </div>
                <div
                    className="absolute inset-0"
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = 1 - (e.clientY - rect.top) / rect.height;
                        audioEngine.setMasterFX(x, y);
                    }}
                    onTouchMove={(e) => {
                        const touch = e.touches[0];
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (touch.clientX - rect.left) / rect.width;
                        const y = 1 - (touch.clientY - rect.top) / rect.height;
                        audioEngine.setMasterFX(x, y);
                    }}
                    onMouseLeave={() => audioEngine.setMasterFX(0.5, 0)}
                    onTouchEnd={() => audioEngine.setMasterFX(0.5, 0)}
                />
            </div>
        </div>
    );
};
