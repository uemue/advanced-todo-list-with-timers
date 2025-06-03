import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AddTaskForm } from '../components/AddTaskForm';

describe('AddTaskForm', () => {
  it('shows a description error when the description is empty', async () => {
    const onAddTask = jest.fn();
    render(<AddTaskForm onAddTask={onAddTask} />);

    await userEvent.type(screen.getByLabelText(/estimated duration in minutes/i), '5');
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(onAddTask).not.toHaveBeenCalled();
    expect(screen.getByText('Task description cannot be empty.')).toBeInTheDocument();
  });

  it('shows a duration error when the duration is empty', async () => {
    const onAddTask = jest.fn();
    render(<AddTaskForm onAddTask={onAddTask} />);

    await userEvent.type(screen.getByLabelText(/task description/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(onAddTask).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter a valid positive number for duration.')).toBeInTheDocument();
  });

  it('calls onAddTask with valid values', async () => {
    const onAddTask = jest.fn();
    render(<AddTaskForm onAddTask={onAddTask} />);

    await userEvent.type(screen.getByLabelText(/task description/i), 'Test task');
    await userEvent.type(screen.getByLabelText(/estimated duration in minutes/i), '15');

    await userEvent.click(screen.getByRole('button', { name: /add task/i }));

    expect(onAddTask).toHaveBeenCalledWith('Test task', 15);
  });
});
