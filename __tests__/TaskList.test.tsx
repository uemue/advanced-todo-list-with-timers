import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TaskList } from '../components/TaskList';
import { Task, TimerStatus } from '../types';

// Simplify framer-motion for tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />)
    },
    AnimatePresence: ({ children }: any) => <div>{children}</div>
  };
});

class DataTransferMock {
  private store: Record<string, string> = {};
  effectAllowed = '';
  setData(type: string, val: string) {
    this.store[type] = val;
  }
  getData(type: string) {
    return this.store[type];
  }
  setDragImage() {}
}

describe('TaskList drag and drop', () => {
  const baseTasks: Task[] = [
    { id: '1', text: 'First', estimatedDuration: 60, isCompleted: false, timerStatus: TimerStatus.IDLE, accumulatedTime: 0, timerStartTime: null },
    { id: '2', text: 'Second', estimatedDuration: 60, isCompleted: false, timerStatus: TimerStatus.IDLE, accumulatedTime: 0, timerStartTime: null },
  ];

  const renderList = () => {
    const onReorderTasks = jest.fn();

    const Wrapper: React.FC = () => {
      const [draggingItemId, setDraggingItemId] = React.useState<string | null>(null);
      return (
        <TaskList
          tasks={baseTasks}
          onToggleComplete={jest.fn()}
          onStartTimer={jest.fn()}
          onPauseTimer={jest.fn()}
          onResetTimer={jest.fn()}
          onSetTaskTimerStatus={jest.fn()}
          onActualDeleteTask={jest.fn()}
          onReorderTasks={onReorderTasks}
          draggingItemId={draggingItemId}
          setDraggingItemId={setDraggingItemId}
        />
      );
    };

    const utils = render(<Wrapper />);
    return { ...utils, onReorderTasks };
  };

  it('reorders tasks and toggles placeholder based on drag state', async () => {
    const { container, onReorderTasks } = renderList();
    const items = container.querySelectorAll('[draggable="true"]');
    const firstItem = items[0] as HTMLElement;
    const secondItem = items[1] as HTMLElement;
    // Provide bounding box values for getBoundingClientRect used in drag logic
    jest.spyOn(secondItem, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 100,
      bottom: 100,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => {}
    } as DOMRect);
    const data = new DataTransferMock();

    // No placeholder initially
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(0);

    fireEvent.dragStart(firstItem, { dataTransfer: data });
    // Wait for state update after dragStart
    await waitFor(() => expect(true).toBe(true));
    // Still no placeholder until dragOver sets dropTargetIndex
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(0);

    fireEvent.dragOver(secondItem, { dataTransfer: data, clientY: 25 });
    // Wait for state update that adds the placeholder
    await waitFor(() => {
      expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
    });
    const list = container.querySelector('.mt-6') as HTMLElement;
    fireEvent.drop(secondItem, { dataTransfer: data });

    expect(onReorderTasks).toHaveBeenCalledWith('1', null);
    // Placeholder removed after drop
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(0);
  });
});

