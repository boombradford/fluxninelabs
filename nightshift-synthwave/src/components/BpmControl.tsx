import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

interface BpmControlProps {
    bpm: number;
    setBpm: (bpm: number) => void;
    isPlaying: boolean;
    onTogglePlayback: () => void;
}

export const BpmControl: React.FC<BpmControlProps> = ({ bpm, setBpm, isPlaying, onTogglePlayback }) => {
    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-synth-panel/95 backdrop-blur-xl border-t border-synth-border p-6 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
        >
            <div className="max-w-2xl mx-auto flex items-center gap-8">
                <button
                    onClick={onTogglePlayback}
                    className="w-12 h-12 rounded-full bg-neon-pink/10 border border-neon-pink text-neon-pink flex items-center justify-center hover:bg-neon-pink/20 hover:shadow-[0_0_15px_#ff00ff] transition-all"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>

                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Tempo</span>
                    <div className="text-neon-cyan font-mono text-3xl font-bold min-w-[100px] drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                        {bpm} <span className="text-sm text-gray-400">BPM</span>
                    </div>
                </div>

                <div className="flex-1 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink to-neon-cyan rounded-lg opacity-20 group-hover:opacity-40 blur transition-opacity" />
                    <input
                        type="range"
                        min="80"
                        max="120"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className="relative w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-pink focus:outline-none focus:ring-2 focus:ring-neon-pink/50"
                    />
                </div>
            </div>
        </motion.div>
    );
};
