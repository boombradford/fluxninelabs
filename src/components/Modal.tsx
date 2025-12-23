import { LuX, LuCalendar, LuTag } from 'react-icons/lu';
import type { VideoIdea, Status } from '../types';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    idea: VideoIdea;
    onStatusChange: (id: string, newStatus: Status) => void;
}

export function Modal({ isOpen, onClose, idea, onStatusChange }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-white">{idea.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <LuX size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-gray-400">Status</label>
                            <div className="flex gap-2">
                                {(['idea', 'in-progress', 'published'] as Status[]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => onStatusChange(idea.id, status)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${idea.status === status
                                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Description</label>
                        <p className="text-gray-300 leading-relaxed bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                            {idea.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-950/30 p-4 rounded-xl border border-gray-800/30 flex items-center gap-3">
                            <LuCalendar className="text-gray-500" size={20} />
                            <div>
                                <div className="text-sm text-gray-400">Created</div>
                                <div className="font-medium">Nov 26, 2025</div>
                            </div>
                        </div>
                        <div className="bg-gray-950/30 p-4 rounded-xl border border-gray-800/30 flex items-center gap-3">
                            <LuTag className="text-gray-500" size={20} />
                            <div>
                                <div className="text-sm text-gray-400">Tags</div>
                                <div className="font-medium">React, Tutorial</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
