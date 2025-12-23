import React from 'react';
import { motion } from 'framer-motion';
import { INSTRUMENTS } from '../lib/audioEngine';
import clsx from 'clsx';

interface SequencerGridProps {
    pattern: boolean[][];
    currentStep: number;
    onToggleStep: (instrumentIndex: number, stepIndex: number) => void;
    isPlaying: boolean;
}

export const SequencerGrid: React.FC<SequencerGridProps> = ({ pattern, currentStep, onToggleStep, isPlaying }) => {
    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="grid grid-cols-[60px_1fr] gap-4 p-6 bg-dark-surface rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm min-w-[800px]">
                {/* Instrument Labels */}
                <div className="flex flex-col justify-between py-1">
                    {INSTRUMENTS.map((inst) => (
                        <div key={inst} className="text-[10px] font-bold uppercase tracking-widest h-10 flex items-center text-gray-500">
                            {inst}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-rows-5 gap-3">
                    {pattern.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                            {row.map((active, stepIdx) => {
                                const isCurrent = isPlaying && currentStep === stepIdx;
                                const isBeat = stepIdx % 4 === 0;

                                return (
                                    <motion.button
                                        key={stepIdx}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onToggleStep(rowIdx, stepIdx)}
                                        className={clsx(
                                            "h-10 rounded-md transition-all duration-75 relative overflow-hidden border border-transparent",
                                            active
                                                ? "bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)] border-neon-blue/50"
                                                : "bg-dark-bg hover:bg-gray-800",
                                            !active && isBeat && "bg-[#1a1a1a]", // Subtle marker for beats
                                            isCurrent && !active && "!bg-gray-700", // Highlight current step even if inactive
                                            isCurrent && active && "brightness-150 scale-110 shadow-[0_0_20px_#fff]"
                                        )}
                                    >
                                        {/* Inner glow for active */}
                                        {active && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
