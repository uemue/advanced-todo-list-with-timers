import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { TimerDisplay } from '../components/TimerDisplay';
import { Task, TimerStatus } from '../types';

describe('TimerDisplay', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows estimated duration when idle', () => {
    const task: Task = {
      id: '1',
      text: 'Idle task',
      estimatedDuration: 90,
      isCompleted: false,
      timerStatus: TimerStatus.IDLE,
      accumulatedTime: 0,
      timerStartTime: null,
    };

    render(<TimerDisplay task={task} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('shows countdown while running before completion', () => {
    jest.useFakeTimers();
    const baseTime = new Date('2021-01-01T00:00:00Z');
    jest.setSystemTime(baseTime);
    const task: Task = {
      id: '2',
      text: 'Running task',
      estimatedDuration: 5,
      isCompleted: false,
      timerStatus: TimerStatus.RUNNING,
      accumulatedTime: 0,
      timerStartTime: baseTime.getTime(),
    };

    render(<TimerDisplay task={task} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:04')).toBeInTheDocument();
  });

  it('shows overtime once running past completion', () => {
    jest.useFakeTimers();
    const baseTime = new Date('2021-01-01T00:00:00Z');
    jest.setSystemTime(baseTime);
    const task: Task = {
      id: '3',
      text: 'Running overtime task',
      estimatedDuration: 5,
      isCompleted: false,
      timerStatus: TimerStatus.RUNNING,
      accumulatedTime: 0,
      timerStartTime: baseTime.getTime(),
    };

    render(<TimerDisplay task={task} />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(screen.getByText('+00:01')).toBeInTheDocument();
  });

  it('shows remaining time when paused', () => {
    const task: Task = {
      id: '4',
      text: 'Paused task',
      estimatedDuration: 60,
      isCompleted: false,
      timerStatus: TimerStatus.PAUSED,
      accumulatedTime: 40000,
      timerStartTime: null,
    };

    render(<TimerDisplay task={task} />);
    expect(screen.getByText('00:20')).toBeInTheDocument();
  });

  it('shows overtime in finished state', () => {
    jest.useFakeTimers();
    const baseTime = new Date('2021-01-01T00:00:00Z');
    jest.setSystemTime(baseTime);
    const task: Task = {
      id: '5',
      text: 'Finished task',
      estimatedDuration: 5,
      isCompleted: false,
      timerStatus: TimerStatus.FINISHED,
      accumulatedTime: 0,
      timerStartTime: baseTime.getTime(),
    };

    render(<TimerDisplay task={task} />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(screen.getByText('+00:01')).toBeInTheDocument();
  });
});
