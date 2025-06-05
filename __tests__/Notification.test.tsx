import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Notification, AUTO_DISMISS_DURATION, ANIMATION_DURATION } from '../components/Notification';
import { NotificationMessage } from '../types';

describe('Notification', () => {
  const sampleNotification: NotificationMessage = {
    id: '1',
    message: 'Test notification',
    taskId: 'task-1'
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('auto dismisses after AUTO_DISMISS_DURATION', async () => {
    const onDismiss = jest.fn();
    render(<Notification notification={sampleNotification} onDismiss={onDismiss} />);
    await act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await act(() => {
      jest.advanceTimersByTime(AUTO_DISMISS_DURATION);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(ANIMATION_DURATION);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses when button clicked and clears timers', async () => {
    const onDismiss = jest.fn();
    render(<Notification notification={sampleNotification} onDismiss={onDismiss} />);
    await act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /dismiss notification/i }));
    await act(() => {
      jest.advanceTimersByTime(ANIMATION_DURATION);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    await act(() => {
      jest.advanceTimersByTime(AUTO_DISMISS_DURATION);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
