interface BpmControlProps {
    bpm: number;
    onChange: (bpm: number) => void;
}

export const BpmControl = ({ bpm, onChange }: BpmControlProps) => {
    return (
        <div className="w-full max-w-md mx-auto bg-dark-panel p-6 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
                <span className="text-neon-pink font-bold tracking-widest uppercase">Global BPM</span>
                <span className="text-2xl font-mono text-white">{bpm}</span>
            </div>
            <input
                type="range"
                min="80"
                max="130"
                value={bpm}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-pink"
            />
            <div className="flex justify-between text-xs text-white/40 mt-2 font-mono">
                <span>80</span>
                <span>130</span>
            </div>
        </div>
    );
};
