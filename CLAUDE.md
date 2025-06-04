# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Architecture

This is a React application built with TypeScript and Vite that implements an advanced todo list with timer functionality. The application uses local storage for persistence and has no backend.

### Core Data Structures

- **Task**: The main data structure representing a todo item
  - Includes properties for text, completion status, and timer-related fields
  - Timer states: IDLE, RUNNING, PAUSED, FINISHED
  - Tracks time using timestamps and accumulated duration

- **NotificationMessage**: Structure for displaying notifications to users
  - Contains message text and associated task ID

### Component Structure

- **App.tsx**: Main component that manages application state
  - Handles task operations (add, toggle, delete, reorder)
  - Controls timer functionality (start, pause, reset)
  - Manages dark mode and notifications
  - Persists tasks to localStorage

- **Components/**
  - **TaskList.tsx**: Renders the list of tasks and handles drag-and-drop reordering
  - **TaskItem.tsx**: Individual task item with controls for completion and timer management
  - **TimerDisplay.tsx**: Displays task timer, handling countdown and overtime display
  - **AddTaskForm.tsx**: Form for adding new tasks with estimated duration
  - **Notification.tsx**: Displays notifications (e.g., when timers expire)
  - **icons.tsx**: SVG icons used throughout the application

### Key Features Implementation

1. **Task Timer Logic**
   - Uses React's `useEffect` for timer management
   - Countdown timer transitions to overtime tracking when time is up
   - Timer states handled in TaskItem component with parent App managing state

2. **Drag and Drop Reordering**
   - Implemented using native HTML5 drag and drop API
   - State for dragged items maintained in App component

3. **Dark Mode**
   - Toggleable and auto-detects system preference
   - Uses CSS classes with dark mode variants
   - Persisted in localStorage

4. **Local Storage**
   - Tasks are automatically saved to localStorage on state changes
   - Retrieved on initial load to persist across sessions
