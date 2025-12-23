# WaveReact Planner Architecture

## Overview
WaveReact Planner is a client-side React application built with Vite. It provides a Kanban-style interface for managing video content ideas.

## Core Components

### Layout & Navigation
- **Layout (`src/components/Layout.tsx`)**: The main wrapper component that establishes the app's structure (Sidebar + Main Content).
- **Sidebar (`src/components/Sidebar.tsx`)**: Contains the application navigation and branding.

### Board & Content
- **Board (`src/components/Board.tsx`)**: The central component that manages the state of the Kanban board. It holds the `ideas` state and handles interactions like opening the details modal.
- **Column (`src/components/Column.tsx`)**: Represents a single status column (Ideas, In Progress, Published). It receives a list of ideas and renders them.
- **Card (`src/components/Card.tsx`)**: Displays individual video ideas with their title, description, and status icon.
- **Modal (`src/components/Modal.tsx`)**: A dialog component for viewing and editing the details of a video idea, including changing its status.

## State Flow
1. **Initial State**: The `Board` component initializes its state from `src/data/index.ts`.
2. **Read**: The `Board` filters the `ideas` array by status and passes the relevant subset to each `Column`.
3. **Update**: 
   - When a user changes a card's status in the `Modal`, the `Board`'s `handleStatusChange` function is called.
   - This function updates the local `ideas` state, causing a re-render of the columns with the card in its new position.

## Data Models

### VideoIdea
The core entity representing a content item.

```typescript
export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  status: Status;
}
```

### Status
Union type defining the possible states of a video idea.

```typescript
export type Status = 'idea' | 'in-progress' | 'published';
```
