import { type Genre, GENRES } from '../lib/audioEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import clsx from 'clsx';

interface GenreSelectorProps {
    currentGenre: Genre;
    onSelect: (genre: Genre) => void;
}

export const GenreSelector = ({ currentGenre, onSelect }: GenreSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative z-50 w-64">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-3 bg-dark-panel border border-neon-cyan/50 rounded-lg text-neon-cyan font-bold tracking-widest uppercase flex justify-between items-center hover:bg-neon-cyan/10 transition-colors"
            >
                <span>{currentGenre}</span>
                <span className={clsx("transition-transform", isOpen && "rotate-180")}>▼</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-dark-panel border border-neon-cyan/30 rounded-lg overflow-hidden shadow-xl shadow-neon-cyan/20"
                    >
                        {GENRES.map(genre => (
                            <button
                                key={genre}
                                onClick={() => {
                                    onSelect(genre);
                                    setIsOpen(false);
                                }}
                                className={clsx(
                                    "w-full px-6 py-3 text-left uppercase tracking-wider transition-colors hover:bg-neon-cyan/20",
                                    currentGenre === genre ? "text-neon-cyan bg-neon-cyan/10" : "text-white/70"
                                )}
                            >
                                {genre}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
