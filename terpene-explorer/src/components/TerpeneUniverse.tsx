import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERPENES } from '../data/terpenes';
import type { Terpene } from '../types';
import { PageLayout } from './layout/PageLayout';
import { SearchInput } from './ui/SearchInput';

interface TerpeneUniverseProps {
    onTerpeneSelect: (terpene: Terpene) => void;
    onExploreStrains: () => void;
}

// Helper: Calculate positions for the circular layout
const getCircularLayout = (items: Terpene[], radius: number) => {
    return items.map((item, index) => {
        const count = items.length;
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        return {
            ...item,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    });
};

// Styles for categories to ensure consistency
const CATEGORY_STYLES: Record<string, string> = {
    citrus: 'var(--citrus-primary)',
    herbal: 'var(--herbal-primary)',
    floral: 'var(--floral-primary)',
    earthy: 'var(--earthy-primary)',
    spicy: 'var(--spicy-primary)',
};

export const TerpeneUniverse: React.FC<TerpeneUniverseProps> = ({ onTerpeneSelect, onExploreStrains }) => {
    // 1. Logic
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTerpenes, setFilteredTerpenes] = useState<Terpene[]>(TERPENES);

    // Search Effect
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTerpenes(TERPENES);
            return;
        }
        const lower = searchTerm.toLowerCase();
        setFilteredTerpenes(TERPENES.filter(t =>
            t.name.toLowerCase().includes(lower) ||
            t.effects.some(e => e.includes(lower)) ||
            t.aromas.some(a => a.includes(lower))
        ));
    }, [searchTerm]);

    // Compute Nodes (Memoized)
    const nodes = useMemo(() => getCircularLayout(TERPENES, 280), []);

    // 2. Render
    return (
        <PageLayout className="flex flex-col items-center justify-center">

            {/* Header Section */}
            <div className="text-center max-w-2xl mx-auto mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block px-3 py-1 mb-4 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                >
                    <span className="text-xs font-semibold tracking-wider text-[var(--herbal-primary)] uppercase">
                        Cannabis Science Explorer
                    </span>
                </motion.div>

                <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
                    Terpene Universe
                </h1>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
                    Navigate the aromatic compounds that define cannabis effects.
                </p>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                    <div className="w-full sm:w-72">
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Find myrcene, sleep, pine..."
                        />
                    </div>
                    <button
                        onClick={onExploreStrains}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-white transition-colors shadow-lg shadow-white/5 whitespace-nowrap"
                    >
                        Explore Strains →
                    </button>
                </div>
            </div>

            {/* Visualization Area */}
            <div className="relative w-full max-w-3xl aspect-square lg:aspect-[16/9] flex items-center justify-center my-8">

                {/* Center Hub */}
                <div className="absolute z-10 w-32 h-32 rounded-full bg-[var(--bg-card)] border border-[var(--border-medium)] flex items-center justify-center shadow-2xl backdrop-blur-sm">
                    <span className="text-xs font-bold text-[var(--text-tertiary)] text-center px-2">
                        {filteredTerpenes.length} <br /> Compounds
                    </span>
                </div>

                {/* Nodes */}
                <AnimatePresence>
                    {nodes.map((node) => {
                        const isMatch = filteredTerpenes.some(t => t.id === node.id);
                        const isDimmed = searchTerm && !isMatch;
                        const color = CATEGORY_STYLES[node.category];

                        return (
                            <motion.button
                                key={node.id}
                                onClick={() => onTerpeneSelect(node)}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: isDimmed ? 0.1 : 1,
                                    scale: isDimmed ? 0.8 : 1,
                                    x: node.x,
                                    y: node.y
                                }}
                                whileHover={{ scale: isDimmed ? 0.8 : 1.15, zIndex: 50 }}
                                className={`
                                    absolute w-20 h-20 -ml-10 -mt-10 rounded-full flex items-center justify-center p-1
                                    border transition-all duration-300 bg-[var(--bg-card)]
                                    shadow-lg
                                `}
                                style={{
                                    borderColor: isDimmed ? 'var(--border-subtle)' : color,
                                    boxShadow: isMatch && !isDimmed ? `0 0 20px -5px ${color}` : 'none'
                                }}
                            >
                                <span className="text-[10px] font-bold text-center leading-tight truncate px-1" style={{ color: isDimmed ? 'var(--text-quaternary)' : 'var(--text-primary)' }}>
                                    {node.name}
                                </span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {/* Connecting Lines (Decorative) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10" style={{ overflow: 'visible' }}>
                    <g transform="translate(50%, 50%)" style={{ transformBox: 'view-box' }}>
                        {/* Note: SVG transforms are tricky in React/Tailwind. 
                            Using a specialized logic or centering 0,0 is usually best. 
                            Here we rely on the parent flex centering and absolute nodes. 
                            Lines need to be drawn from center (0,0 concept) to node.x/y.
                            Since standard SVG 0,0 is top-left, we need to offset.
                            Simplification: Skip lines for this clean "SaaS" version? 
                            Yes. Lines are often "visual noise". 
                            Clean floating orbs are more "Apple". 
                        */}
                    </g>
                </svg>

            </div>

        </PageLayout>
    );
};

export default TerpeneUniverse;
