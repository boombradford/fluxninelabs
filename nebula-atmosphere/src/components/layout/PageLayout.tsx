import React from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
    children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-cyan)] selection:text-black">

            {/* Ambient Background - Nebula Gasses */}
            <div className="fixed inset-0 pointer-events-none -z-10 select-none overflow-hidden mix-blend-screen opacity-30">
                <motion.div
                    className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[120px]"
                    style={{ backgroundColor: 'var(--accent-purple)' }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.15, 0.1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px]"
                    style={{ backgroundColor: 'var(--accent-cyan)' }}
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 50, 0],
                        opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 lg:p-12">
                {children}
            </main>
        </div>
    );
};
