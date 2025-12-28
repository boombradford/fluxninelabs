import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SpectrumVisualizer } from './SpectrumVisualizer';

interface XYPadProps {
    x: number; // 0-1
    y: number; // 0-1
    onChange: (x: number, y: number) => void;
    label?: string;
}

export const XYPad: React.FC<XYPadProps> = ({ x, y, onChange, label = "TEXTURE FIELD" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        let newX = (clientX - rect.left) / rect.width;
        let newY = 1 - ((clientY - rect.top) / rect.height); // Invert Y so up is 1

        // Clamp
        newX = Math.max(0, Math.min(1, newX));
        newY = Math.max(0, Math.min(1, newY));

        onChange(newX, newY);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        // Force initial update on click
        const rect = containerRef.current!.getBoundingClientRect();
        let newX = (e.clientX - rect.left) / rect.width;
        let newY = 1 - ((e.clientY - rect.top) / rect.height);

        newX = Math.max(0, Math.min(1, newX));
        newY = Math.max(0, Math.min(1, newY));
        onChange(newX, newY);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    // Attach global listeners for smooth dragging outside bounds
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove as any);
            window.addEventListener('pointerup', handlePointerUp);
        } else {
            window.removeEventListener('pointermove', handlePointerMove as any);
            window.removeEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove as any);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging]);

    return (
        <div className="flex flex-col gap-2 w-full h-full min-h-[300px]">
            <div className="flex justify-between items-center text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase">
                <span>{label}</span>
                <span className="text-[var(--accent-cyan)]">{Math.round(x * 100)} / {Math.round(y * 100)}</span>
            </div>

            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                className={`
                    relative w-full flex-1 bg-[var(--bg-elevated)] border rounded-xl overflow-hidden cursor-crosshair touch-none transition-colors duration-300
                    ${isDragging ? 'border-[var(--accent-cyan)]' : 'border-[var(--border-medium)] hover:border-[var(--border-strong)]'}
                `}
                style={{
                    boxShadow: isDragging ? '0 0 30px -5px rgba(34, 211, 238, 0.2)' : 'none'
                }}
            >
                {/* Visualizer Background */}
                <SpectrumVisualizer />

                {/* Grid Lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(var(--border-medium) 1px, transparent 1px), linear-gradient(90deg, var(--border-medium) 1px, transparent 1px)`,
                        backgroundSize: '25% 25%'
                    }}
                />

                {/* The Puck */}
                <motion.div
                    className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-[var(--text-primary)] shadow-[0_0_15px_var(--accent-cyan)] z-10 pointer-events-none"
                    style={{
                        left: `${x * 100}%`,
                        top: `${(1 - y) * 100}%` // Invert Y for display
                    }}
                    animate={{
                        scale: isDragging ? 1.5 : 1
                    }}
                />

                {/* Trail/Ghost Effect (Visual polish) */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute w-full h-full opacity-20"
                        style={{
                            background: `radial-gradient(circle at ${x * 100}% ${(1 - y) * 100}%, var(--accent-cyan), transparent 60%)`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
