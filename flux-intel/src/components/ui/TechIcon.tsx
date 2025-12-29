"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface TechIconProps {
    icon: LucideIcon;
    color?: string;
    size?: number;
    isActive?: boolean;
    className?: string;
}

export const TechIcon = ({ icon: Icon, color = "text-white", size = 20, isActive = false, className }: TechIconProps) => {
    return (
        <div className={clsx("relative flex items-center justify-center w-10 h-10 group", className)}>
            {/* Corner Brackets */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 40 40" stopColor="currentColor">
                {/* Top Left */}
                <motion.path
                    d="M2 10V2H10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={clsx(isActive ? "text-[#38BDF8]" : "text-[#64748B]")}
                    initial={false}
                    animate={isActive ? { pathLength: 1, opacity: 1 } : { pathLength: 0.5, opacity: 0.5 }}
                />
                {/* Bottom Right */}
                <motion.path
                    d="M38 30V38H30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={clsx(isActive ? "text-[#38BDF8]" : "text-[#64748B]")}
                    initial={false}
                    animate={isActive ? { pathLength: 1, opacity: 1 } : { pathLength: 0.5, opacity: 0.5 }}
                />
            </svg>

            {/* Glow Effect Background */}
            <div className={clsx(
                "absolute inset-0 bg-[#38BDF8]/10 blur-xl rounded-full transition-all duration-500",
                isActive || "group-hover:opacity-50 opacity-0"
            )} />

            {/* The Icon */}
            <Icon
                size={size}
                className={clsx(
                    "relative z-10 transition-all duration-300",
                    isActive ? "text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" : "text-[#94A3B8] group-hover:text-white"
                )}
            />
        </div>
    );
};
