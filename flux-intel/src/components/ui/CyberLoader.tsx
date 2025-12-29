"use client";

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

export const CyberLoader = ({ text = "ANALYZING" }: { text?: string }) => {
    const [scramble, setScramble] = useState(text);

    // Matrix rain effect characters
    const chars = "XYZ0123456789_###";

    useEffect(() => {
        const interval = setInterval(() => {
            setScramble(text.split('').map((char, i) => {
                if (Math.random() > 0.8) return chars[Math.floor(Math.random() * chars.length)];
                return char;
            }).join(''));
        }, 50);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            {/* Rotating Reticle */}
            <div className="relative w-24 h-24 flex items-center justify-center">
                <motion.div
                    className="absolute inset-0 border-t-2 border-l-2 border-[#38BDF8] rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-2 border-b-2 border-r-2 border-[#38BDF8]/30 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Pulse */}
                <div className="w-12 h-12 bg-[#38BDF8]/10 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#38BDF8] rounded-full shadow-[0_0_10px_#38BDF8]" />
                </div>
            </div>

            {/* Text Lockup */}
            <div className="text-center space-y-1">
                <div className="text-[#38BDF8] font-mono text-sm tracking-[0.2em] animate-pulse">
                    {scramble}
                </div>
                <div className="h-0.5 w-16 bg-[#38BDF8]/20 mx-auto">
                    <motion.div
                        className="h-full bg-[#38BDF8]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </div>
        </div>
    );
};
