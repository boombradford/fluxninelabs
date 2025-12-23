import React from 'react';

interface BpmSliderProps {
    bpm: number;
    onChange: (bpm: number) => void;
}

export const BpmSlider: React.FC<BpmSliderProps> = ({ bpm, onChange }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Tempo</label>
                <div className="flex items-baseline gap-1">
                    <span className="text-white font-bold text-lg">{bpm}</span>
                    <span className="text-gray-500 text-xs font-medium">BPM</span>
                </div>
            </div>
            <input
                type="range"
                min="60"
                max="180"
                value={bpm}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-4 bg-transparent appearance-none cursor-pointer outline-none
          [&::-webkit-slider-runnable-track]:h-1 
          [&::-webkit-slider-runnable-track]:bg-dark-surface 
          [&::-webkit-slider-runnable-track]:rounded-full
          [&::-webkit-slider-thumb]:appearance-none 
          [&::-webkit-slider-thumb]:w-6 
          [&::-webkit-slider-thumb]:h-6 
          [&::-webkit-slider-thumb]:-mt-2.5 
          [&::-webkit-slider-thumb]:rounded-full 
          [&::-webkit-slider-thumb]:bg-neon-blue 
          [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,243,255,0.5)] 
          [&::-webkit-slider-thumb]:transition-all
          hover:[&::-webkit-slider-thumb]:scale-110
          active:[&::-webkit-slider-thumb]:scale-95
        "
            />
        </div>
    );
};
