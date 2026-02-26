import React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    variant?: 'glass' | 'solid' | 'transparent';
    hoverEffect?: boolean;
}

export function Card({
    children,
    className,
    variant = 'glass',
    hoverEffect = false,
    ...props
}: CardProps) {

    const baseStyles = "rounded-2xl overflow-hidden transition-all duration-300";

    const variants = {
        glass: "border border-white/10 bg-white/[0.02] backdrop-blur-sm",
        solid: "bg-zinc-900 border border-zinc-800",
        transparent: "bg-transparent border-transparent"
    };

    const hoverStyles = hoverEffect
        ? "hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] hover:-translate-y-1 cursor-pointer"
        : "";

    return (
        <motion.div
            className={cn(baseStyles, variants[variant], hoverStyles, className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}
