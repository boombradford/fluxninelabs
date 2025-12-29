import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import React from 'react';

export const CyberLoader = ({ text = "ANALYZING" }: { text?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            {/* FLUX CORE ANIMATION (Compact Version) */}
            <div className="relative mb-8 h-24 w-24 flex items-center justify-center">

                {/* 1. Outer Orbit Ring (Slow Rotate) */}
                <motion.div
                    className="absolute inset-0 border border-blue-500/20 rounded-full"
                    style={{ borderTopColor: 'rgba(59,130,246,0.6)', borderBottomColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                {/* 2. Inner Gyro Ring (Fast Rotate Reverse) */}
                <motion.div
                    className="absolute inset-2 border border-purple-500/30 rounded-full"
                    style={{ borderLeftColor: 'rgba(168,85,247,0.6)', borderRightColor: 'transparent' }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />

                {/* 3. The Neural Core (Pulse) */}
                <div className="relative h-12 w-12">
                    {/* Glow Bloom */}
                    <motion.div
                        className="absolute inset-0 bg-blue-500/40 blur-[20px] rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Solid Core */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-inner border border-white/20 backdrop-blur-sm overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                            animate={{ top: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                        />
                    </div>
                </div>
            </div>

            {/* Premium Text Lockup */}
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-lg font-light tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white animate-text-shimmer bg-[length:200%_auto] uppercase">
                    {text}
                </span>
            </div>
        </div>
    );
};
