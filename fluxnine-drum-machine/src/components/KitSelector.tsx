import React from 'react';
import type { KitName } from '../lib/audioEngine';

interface KitSelectorProps {
    currentKit: KitName;
    onChange: (kit: KitName) => void;
}

export const KitSelector: React.FC<KitSelectorProps> = ({ currentKit, onChange }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Drum Kit</label>
            <div className="relative">
                <select
                    value={currentKit}
                    onChange={(e) => onChange(e.target.value as KitName)}
                    className="w-full bg-dark-surface border border-white/10 text-white rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] transition-all appearance-none cursor-pointer text-sm font-medium"
                >
                    <option value="808">808 Classic</option>
                    <option value="trap">Trap Heavy</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </div>
    );
};
