import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { Task, TimerStatus } from './types';

// Mock crypto.randomUUID
const mockUUIDBase = 'mock-uuid-';
let uuidCounter = 0;
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => `${mockUUIDBase}${uuidCounter++}`,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
let mockStore: { [key: string]: string } = {};
const localStorageMock = {
  getItem: jest.fn(key => mockStore[key] || null),
  setItem: jest.fn((key, value) => {
    mockStore[key] = value.toString();
  }),
  removeItem: jest.fn(key => {
    delete mockStore[key];
  }),
  clear: jest.fn(() => {
    mockStore = {};
  }),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const initialTasksRaw: Omit<Task, 'id'>[] = [ // Use Omit to let mock UUIDs apply
  { text: 'Task 1: Go shopping', isCompleted: false, estimatedDuration: 30 * 60, accumulatedTime: 0, timerStartTime: null, timerStatus: TimerStatus.IDLE },
  { text: 'Task 2: Clean the house', isCompleted: false, estimatedDuration: 60 * 60, accumulatedTime: 0, timerStartTime: null, timerStatus: TimerStatus.IDLE },
  { text: 'Task 3: Write a novel', isCompleted: false, estimatedDuration: 120 * 60, accumulatedTime: 0, timerStartTime: null, timerStatus: TimerStatus.IDLE },
];

let tasksWithMockIds: Task[];

beforeEach(() => {
  uuidCounter = 0; // Reset counter for predictable IDs
  tasksWithMockIds = initialTasksRaw.map((task, index) => ({
    ...task,
    id: `${mockUUIDBase}${index}`, // Assign predictable IDs
  }));

  mockStore = {};
  localStorageMock.getItem.mockImplementation(key => mockStore[key] || null);
  localStorageMock.setItem.mockImplementation((key, value) => {
    mockStore[key] = value.toString();
  });
  localStorageMock.clear.mockClear();
  localStorageMock.setItem.mockClear(); // Clear mock usage counts

  // Set initial tasks in mock localStorage
  localStorage.setItem('todoTasks', JSON.stringify(tasksWithMockIds));
});

describe('App Task Reordering', () => {
  test('should reorder tasks using keyboard drag and drop and persist the new order', () => {
    render(<App />);

    const getRenderedTaskTexts = () => {
      const dragHandles = screen.getAllByLabelText('Drag to reorder task');
      const tasksTexts = dragHandles.map(handle => {
        // TaskItem root div has class "group" and other structural classes.
        // Let's find the closest div that acts as a TaskItem container.
        // Task text is in a span with class "flex-grow..."
        const taskItemElement = handle.closest('div.group.flex.items-center.justify-between');
        if (!taskItemElement) return '';
        const textElement = taskItemElement.querySelector('span[class*="flex-grow"]');
        return textElement ? textElement.textContent : '';
      });
      return tasksTexts.filter(Boolean); // Filter out any null/empty results
    };

    // Initial order check (UI)
    expect(getRenderedTaskTexts()).toEqual([
      'Task 1: Go shopping', // ID: mock-uuid-0
      'Task 2: Clean the house', // ID: mock-uuid-1
      'Task 3: Write a novel',   // ID: mock-uuid-2
    ]);

    // Locate drag handle for the first task ("Task 1")
    const dragHandles = screen.getAllByLabelText('Drag to reorder task');
    const firstTaskDragHandle = dragHandles[0];

    // Simulate DND: Lift "Task 1"
    fireEvent.keyDown(firstTaskDragHandle, { key: ' ', code: 'Space' });
    // Move "Task 1" down past "Task 2"
    fireEvent.keyDown(firstTaskDragHandle, { key: 'ArrowDown', code: 'ArrowDown' });
    // Drop "Task 1"
    fireEvent.keyDown(firstTaskDragHandle, { key: ' ', code: 'Space' });

    // Verify new order (UI)
    expect(getRenderedTaskTexts()).toEqual([
      'Task 2: Clean the house',
      'Task 1: Go shopping',
      'Task 3: Write a novel',
    ]);

    // Verify localStorage persistence for the new order
    // Expected order of task IDs in localStorage: mock-uuid-1, mock-uuid-0, mock-uuid-2
    const expectedOrderAfterFirstDrag = [
      tasksWithMockIds[1], // Task 2
      tasksWithMockIds[0], // Task 1
      tasksWithMockIds[2], // Task 3
    ];
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'todoTasks',
      JSON.stringify(expectedOrderAfterFirstDrag)
    );
    localStorage.setItem.mockClear(); // Clear for next check

    // --- Test another reorder: Move "Task 3" (now last) to the top ---
    // Current UI order: Task 2, Task 1, Task 3
    const currentDragHandles = screen.getAllByLabelText('Drag to reorder task'); // Re-query handles in current order
    const task3DragHandle = currentDragHandles[2]; // "Task 3" is the last item

    // Lift "Task 3"
    fireEvent.keyDown(task3DragHandle, { key: ' ', code: 'Space' });
    // Move "Task 3" up past "Task 1" (visually second)
    fireEvent.keyDown(task3DragHandle, { key: 'ArrowUp', code: 'ArrowUp' });
    // Move "Task 3" up past "Task 2" (visually first)
    fireEvent.keyDown(task3DragHandle, { key: 'ArrowUp', code: 'ArrowUp' });
    // Drop "Task 3"
    fireEvent.keyDown(task3DragHandle, { key: ' ', code: 'Space' });

    // Verify new order (UI)
    expect(getRenderedTaskTexts()).toEqual([
      'Task 3: Write a novel',
      'Task 2: Clean the house',
      'Task 1: Go shopping',
    ]);

    // Verify localStorage persistence for the final order
    // Expected order of task IDs: mock-uuid-2, mock-uuid-1, mock-uuid-0
    const expectedOrderAfterSecondDrag = [
      tasksWithMockIds[2], // Task 3
      tasksWithMockIds[1], // Task 2
      tasksWithMockIds[0], // Task 1
    ];
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'todoTasks',
      JSON.stringify(expectedOrderAfterSecondDrag)
    );
  });
});
