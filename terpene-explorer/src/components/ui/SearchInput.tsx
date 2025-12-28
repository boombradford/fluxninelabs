import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * SearchInput
 * 
 * A polished, self-contained search component with clear functionality.
 * Follows 'Input + Action' pattern common in SaaS.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = "Search...",
    className = ""
}) => {
    return (
        <div className={`relative group ${className}`}>
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-primary)] transition-colors pointer-events-none">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="
            w-full bg-[var(--bg-elevated)] 
            border border-[var(--border-subtle)] 
            rounded-xl py-3 pl-11 pr-10
            text-[var(--text-primary)] placeholder-[var(--text-quaternary)]
            text-base font-medium
            transition-all duration-200
            focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-card)] focus:ring-1 focus:ring-[var(--border-strong)]
            hover:border-[var(--border-medium)]
        "
            />

            {/* Clear Button (AnimatePresence for smooth entry/exit) */}
            <AnimatePresence>
                {value && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => onChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--border-medium)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Clear search"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
