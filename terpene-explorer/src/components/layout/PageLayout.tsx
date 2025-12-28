import React from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
    showAmbientBackground?: boolean;
}

/**
 * PageLayout
 * 
 * The standardized shell for all views in the application.
 * Enforces consistent padding, max-width constraints, and ambient styling.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    className = '',
    showAmbientBackground = true
}) => {
    return (
        <div className={`min-h-screen relative overflow-hidden bg-[var(--bg-primary)] ${className}`}>

            {/* 
        Ambient Background Layer
        Refactored to be subtle and non-distracting.
        Uses CSS variables for performance.
      */}
            {showAmbientBackground && (
                <div className="fixed inset-0 pointer-events-none -z-10 select-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--herbal-primary)] opacity-[0.03] blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--citrus-primary)] opacity-[0.03] blur-[120px]" />
                </div>
            )}

            {/* Content Container */}
            {/* Enforces SaaS-standard max-width (usually 1100-1400px) and substantial padding */}
            <main className="w-full max-w-[1400px] mx-auto px-6 py-12 lg:px-12 lg:py-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};
