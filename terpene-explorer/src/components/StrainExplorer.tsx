import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Strain } from '../types';
import { StrainService } from '../services/api';
import { getTerpeneById } from '../data/terpenes';
import { PageLayout } from './layout/PageLayout';
import { SearchInput } from './ui/SearchInput';

interface StrainExplorerProps {
    onBack: () => void;
    initialFilterTerpeneId?: string;
}

export const StrainExplorer: React.FC<StrainExplorerProps> = ({ onBack, initialFilterTerpeneId }) => {
    const [strains, setStrains] = useState<Strain[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const loadStrains = async () => {
            setIsLoading(true);
            let data;
            if (initialFilterTerpeneId) {
                data = await StrainService.getStrainsByTerpene(initialFilterTerpeneId);
            } else {
                data = await StrainService.getAllStrains();
            }
            setStrains(data);
            setIsLoading(false);
        };
        loadStrains();
    }, [initialFilterTerpeneId]);

    // Handle Search
    useEffect(() => {
        // Simple client-side filtering for the seed data
        // In prod, this would likely trigger an API call if debounce logic is added back
        const performSearch = async () => {
            if (searchTerm.trim() === '') {
                // Reset
                if (initialFilterTerpeneId) {
                    setStrains(await StrainService.getStrainsByTerpene(initialFilterTerpeneId));
                } else {
                    setStrains(await StrainService.getAllStrains());
                }
                return;
            }
            const results = await StrainService.searchStrains(searchTerm);
            setStrains(results);
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, initialFilterTerpeneId]);

    const activeFilterTerpene = initialFilterTerpeneId ? getTerpeneById(initialFilterTerpeneId) : null;

    return (
        <PageLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[var(--border-subtle)] pb-8">
                <div>
                    <button
                        onClick={onBack}
                        className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-4 flex items-center gap-2 group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
                    </button>

                    <h1 className="text-3xl font-bold mb-2">Strain Explorer</h1>

                    {activeFilterTerpene ? (
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <span>Showing strains high in</span>
                            <span className="font-semibold text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                {activeFilterTerpene.name}
                            </span>
                        </div>
                    ) : (
                        <p className="text-[var(--text-secondary)]">
                            Discover strains based on their unique terpene profiles.
                        </p>
                    )}
                </div>

                <div className="w-full md:w-80">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search strains..."
                    />
                </div>
            </div>

            {/* Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {strains.map((strain) => (
                        <motion.div
                            layout
                            key={strain.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -4 }}
                            className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 hover:border-[var(--border-medium)] hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        >
                            {/* Type Badge */}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`
                                    text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                                    ${strain.type === 'sativa' ? 'bg-orange-500/10 text-orange-400' : ''}
                                    ${strain.type === 'indica' ? 'bg-purple-500/10 text-purple-400' : ''}
                                    ${strain.type === 'hybrid' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                                `}>
                                    {strain.type}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">
                                {strain.name}
                            </h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-2 leading-relaxed">
                                {strain.description}
                            </p>

                            {/* Terpene Profile Viz */}
                            <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
                                {strain.dominantTerpenes.slice(0, 3).map((dt) => {
                                    const terpene = getTerpeneById(dt.terpeneId);
                                    if (!terpene) return null;
                                    return (
                                        <div key={dt.terpeneId} className="flex items-center gap-3">
                                            <span className="text-xs w-20 truncate text-[var(--text-secondary)]">
                                                {terpene.name}
                                            </span>
                                            <div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${Math.min(dt.percentage * 50, 100)}%`, // Capped at 100%
                                                        backgroundColor: `var(--${terpene.category}-primary)`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-[var(--text-tertiary)] w-8 text-right">
                                                {dt.percentage}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {!isLoading && strains.length === 0 && (
                <div className="text-center py-20 text-[var(--text-secondary)]">
                    <p className="text-lg">No strains found matching "{searchTerm}"</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-[var(--text-primary)] underline hover:no-underline"
                    >
                        Clear Search
                    </button>
                </div>
            )}
        </PageLayout>
    );
};

export default StrainExplorer;
