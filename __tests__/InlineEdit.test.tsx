import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';

// Provide matchMedia mock as in App.test
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

describe('Inline edit task', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  it('edits task text and duration inline and saves', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Add initial task with 1 minute
    await user.type(screen.getByLabelText(/task description/i), 'Old Task');
    await user.type(screen.getByLabelText(/estimated duration in minutes/i), '1');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    // Enter edit mode for the created task row
    const row = screen.getByText('Old Task').closest('[draggable="true"]') as HTMLElement;
    const editBtn = within(row).getByRole('button', { name: /edit task/i });
    await user.click(editBtn);

    // Change text and duration
    const textInput = screen.getByRole('textbox', { name: /edit task text/i });
    await user.clear(textInput);
    await user.type(textInput, 'New Task');

    const minutesInput = screen.getByRole('spinbutton', { name: /edit estimated minutes/i });
    await user.clear(minutesInput);
    await user.type(minutesInput, '2');

    // Save
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Verify text updated
    expect(await screen.findByText('New Task')).toBeInTheDocument();
    // Verify timer shows 02:00 (idle state shows estimated duration)
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('validates empty text and non-positive minutes', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Add initial task
    await user.type(screen.getByLabelText(/task description/i), 'Task');
    await user.type(screen.getByLabelText(/estimated duration in minutes/i), '5');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    const row2 = screen.getByText('Task').closest('[draggable="true"]') as HTMLElement;
    const editBtn2 = within(row2).getByRole('button', { name: /edit task/i });
    await user.click(editBtn2);

    const textInput = screen.getByRole('textbox', { name: /edit task text/i });
    const minutesInput = screen.getByRole('spinbutton', { name: /edit estimated minutes/i });

    // Empty text
    await user.clear(textInput);
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/task description cannot be empty/i)).toBeInTheDocument();

    // Invalid minutes
    await user.type(textInput, 'Ok');
    await user.clear(minutesInput);
    await user.type(minutesInput, '0');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/please enter a valid positive number for duration/i)).toBeInTheDocument();

    // Cancel leaves edit mode without changes
    await user.click(screen.getByRole('button', { name: /cancel edit/i }));
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });
});
