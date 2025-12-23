export type Status = 'idea' | 'in-progress' | 'published';

export interface VideoIdea {
    id: string;
    title: string;
    description: string;
    status: Status;
}
