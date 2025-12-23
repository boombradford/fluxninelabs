import type { VideoIdea } from '../types';
import { Card } from './Card';
import { LuPlus } from 'react-icons/lu';

interface ColumnProps {
    title: string;
    ideas: VideoIdea[];
    onCardClick: (idea: VideoIdea) => void;
}

export function Column({ title, ideas, onCardClick }: ColumnProps) {
    const count = ideas.length;

    return (
        <div className="flex flex-col h-full min-w-[320px] w-full max-w-md">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-300">{title}</h3>
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        {count}
                    </span>
                </div>
                <button className="text-gray-500 hover:text-gray-300 hover:bg-gray-800 p-1 rounded">
                    <LuPlus size={18} />
                </button>
            </div>

            <div
                className="flex-1 bg-gray-900/30 rounded-xl p-3 border border-gray-800/50 space-y-3 overflow-y-auto"
            >
                {ideas.map((idea) => (
                    <Card key={idea.id} idea={idea} onClick={onCardClick} />
                ))}
            </div>
        </div>
    );
}
