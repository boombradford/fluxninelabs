import { useState, useEffect } from 'react';
import type { VideoIdea, Status } from '../types';
import { Column } from './Column';
import { Modal } from './Modal';
import { initialData } from '../data';

const STORAGE_KEY = 'wave-react-planner-data';

export function Board() {
    const [ideas, setIdeas] = useState<VideoIdea[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : initialData;
        } catch (error) {
            console.error('Failed to load data from localStorage:', error);
            return initialData;
        }
    });

    const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
        } catch (error) {
            console.error('Failed to save data to localStorage:', error);
        }
    }, [ideas]);

    const handleCardClick = (idea: VideoIdea) => {
        setSelectedIdea(idea);
    };

    const handleCloseModal = () => {
        setSelectedIdea(null);
    };

    const handleStatusChange = (id: string, newStatus: Status) => {
        setIdeas((prevIdeas) =>
            prevIdeas.map((idea) =>
                idea.id === id ? { ...idea, status: newStatus } : idea
            )
        );

        if (selectedIdea && selectedIdea.id === id) {
            setSelectedIdea({ ...selectedIdea, status: newStatus });
        }
    };

    const getIdeasByStatus = (status: Status) => {
        return ideas.filter((idea) => idea.status === status);
    };

    return (
        <>
            <div className="flex gap-6 h-[calc(100vh-12rem)] overflow-x-auto pb-4">
                <Column
                    title="Ideas"
                    ideas={getIdeasByStatus('idea')}
                    onCardClick={handleCardClick}
                />
                <Column
                    title="In Progress"
                    ideas={getIdeasByStatus('in-progress')}
                    onCardClick={handleCardClick}
                />
                <Column
                    title="Published"
                    ideas={getIdeasByStatus('published')}
                    onCardClick={handleCardClick}
                />
            </div>

            {selectedIdea && (
                <Modal
                    isOpen={!!selectedIdea}
                    onClose={handleCloseModal}
                    idea={selectedIdea}
                    onStatusChange={handleStatusChange}
                />
            )}
        </>
    );
}
