import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '../components/TaskItem';
import { TimerStatus, Task } from '../types';
import React from 'react';
import { act } from 'react';

describe('TaskItem', () => {
  it('calls onActualDeleteTask after delete animation', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const task: Task = {
      id: 'task-1',
      text: 'Test task',
      estimatedDuration: 60,
      isCompleted: false,
      timerStatus: TimerStatus.IDLE,
      accumulatedTime: 0,
      timerStartTime: null,
    };

    const onActualDeleteTask = jest.fn();

    render(
      <TaskItem
        task={task}
        onToggleComplete={jest.fn()}
        onStartTimer={jest.fn()}
        onPauseTimer={jest.fn()}
        onResetTimer={jest.fn()}
        onSetTaskTimerStatus={jest.fn()}
        onActualDeleteTask={onActualDeleteTask}
        isDragging={false}
        onDragStart={jest.fn()}
        onDragOver={jest.fn()}
        onDragEnd={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete task/i }));
    expect(onActualDeleteTask).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(350);
      return Promise.resolve();
    });

    expect(onActualDeleteTask).toHaveBeenCalledWith(task.id);
    jest.useRealTimers();
  });
});
