import React from 'react';
import { motion } from 'framer-motion';
import { Terpene } from '../types';
import { PageLayout } from './layout/PageLayout';

interface TerpeneDetailProps {
    terpene: Terpene;
    onBack: () => void;
    onFindStrains: () => void;
}

export const TerpeneDetail: React.FC<TerpeneDetailProps> = ({ terpene, onBack, onFindStrains }) => {

    // Category Color Mapping
    const categoryColors: Record<string, string> = {
        citrus: 'var(--citrus-primary)',
        herbal: 'var(--herbal-primary)',
        floral: 'var(--floral-primary)',
        earthy: 'var(--earthy-primary)',
        spicy: 'var(--spicy-primary)',
    };

    const primaryColor = categoryColors[terpene.category];

    return (
        <PageLayout showAmbientBackground={false}>
            {/* Custom Atmospheric Background for this Terpene */}
            <div className="fixed inset-0 pointer-events-none -z-10 select-none overflow-hidden">
                <motion.div
                    className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.08] blur-[100px]"
                    style={{ backgroundColor: primaryColor }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.12, 0.08] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Navigation */}
            <div className="mb-8 lg:mb-12">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    BACK TO UNIVERSE
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Hero Header */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-16"
                >
                    {/* Category Label */}
                    <div className="flex items-center gap-3 mb-6">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                        />
                        <span
                            className="text-xs font-bold tracking-widest uppercase"
                            style={{ color: primaryColor }}
                        >
                            {terpene.category} Terpene
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 text-[var(--text-primary)]">
                        {terpene.name}
                    </h1>
                    <p className="text-2xl text-[var(--text-tertiary)] font-serif italic mb-8 opacity-80">
                        {terpene.scientificName}
                    </p>
                    <p className="text-xl leading-relaxed text-[var(--text-secondary)] mb-10 max-w-2xl">
                        {terpene.description}
                    </p>

                    <button
                        onClick={onFindStrains}
                        className="px-8 py-4 rounded-xl font-bold transition-transform active:scale-95 text-[var(--bg-primary)] shadow-lg shadow-white/5"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Find Strains with {terpene.name} →
                    </button>
                </motion.div>

                {/* Content Grid */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid md:grid-cols-2 gap-8 lg:gap-12"
                >
                    {/* Left Column: Properties */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Aroma Profile</h3>
                            <div className="flex flex-wrap gap-2">
                                {terpene.aromas.map(aroma => (
                                    <span key={aroma} className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm capitalize">
                                        {aroma}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wide mb-4">Effects</h3>
                            <div className="flex flex-wrap gap-2">
                                {terpene.effects.map(effect => (
                                    <span key={effect} className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm capitalize">
                                        {effect}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Therapeutics */}
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="text-[var(--benefit-primary)]">✚</span> Therapeutic Potential
                        </h3>
                        <ul className="space-y-4">
                            {terpene.therapeuticProperties.map((prop, i) => (
                                <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                                    <span className="leading-relaxed">{prop}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </div>
        </PageLayout>
    );
};
