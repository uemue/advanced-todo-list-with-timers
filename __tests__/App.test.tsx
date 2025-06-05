import userEvent from "@testing-library/user-event";
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import App from '../App';

// jsdom does not implement matchMedia, so provide a minimal mock
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /advanced todo list/i })).toBeInTheDocument();
  });
});



it('shows remaining time when marking a completed task as incomplete', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2021-01-01T00:00:00Z'));
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  const { findByRole, getByRole, findByText } = render(<App />);

  await user.type(getByRole('textbox', { name: /task description/i }), 'Test task');
  await user.type(getByRole('spinbutton', { name: /estimated duration in minutes/i }), '1');
  await user.click(getByRole('button', { name: /add task/i }));

  await user.click(getByRole('button', { name: /start timer/i }));
  await act(() => {
    jest.advanceTimersByTime(5000);
  });

  await user.click(getByRole('button', { name: /mark task as complete/i }));
  await findByText('00:05');

  await user.click(getByRole('button', { name: /mark task as incomplete/i }));
  await findByText('00:55');
  jest.useRealTimers();
});
