import { type LoopConfig } from '../lib/audioEngine';
import { LoopTile } from './LoopTile';

interface LoopGridProps {
    loops: LoopConfig[];
    activeLoops: Set<string>;
    onToggle: (id: string) => void;
}

export const LoopGrid = ({ loops, activeLoops, onToggle }: LoopGridProps) => {
    const synths = loops.filter(l => l.type === 'synth');
    const drums = loops.filter(l => l.type === 'drum');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mx-auto p-6">
            {/* Synths Column */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-neon-cyan tracking-widest uppercase border-b border-neon-cyan/30 pb-2">
                    Synth Layers
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {synths.map(loop => (
                        <LoopTile
                            key={loop.id}
                            loop={loop}
                            isActive={activeLoops.has(loop.id)}
                            onToggle={() => onToggle(loop.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Drums Column */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-neon-pink tracking-widest uppercase border-b border-neon-pink/30 pb-2">
                    Rhythm Section
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {drums.map(loop => (
                        <LoopTile
                            key={loop.id}
                            loop={loop}
                            isActive={activeLoops.has(loop.id)}
                            onToggle={() => onToggle(loop.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
