import type { VideoIdea } from '../types';
import { LuClock, LuCheck, LuLightbulb } from 'react-icons/lu';

interface CardProps {
    idea: VideoIdea;
    onClick: (idea: VideoIdea) => void;
}

export function Card({ idea, onClick }: CardProps) {
    const statusColors = {
        idea: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        published: 'bg-green-500/10 text-green-500 border-green-500/20',
    };

    const StatusIcon = {
        idea: LuLightbulb,
        'in-progress': LuClock,
        published: LuCheck,
    }[idea.status];

    return (
        <div
            onClick={() => onClick(idea)}
            className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-700 cursor-pointer transition-all hover:shadow-lg group"
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${statusColors[idea.status]}`}>
                    <StatusIcon size={12} />
                    {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                </span>
            </div>

            <h3 className="font-semibold text-gray-100 mb-2 group-hover:text-blue-400 transition-colors">
                {idea.title}
            </h3>

            <p className="text-sm text-gray-400 line-clamp-2">
                {idea.description}
            </p>
        </div>
    );
}
