
import React, { useState } from 'react';

interface AddTaskFormProps {
  onAddTask: (text: string, durationMinutes: number) => void;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask }) => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(''); // Duration in minutes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !duration.trim()) {
      alert("Please enter task description and estimated duration.");
      return;
    }
    const durationMinutes = parseInt(duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert("Please enter a valid positive number for duration.");
      return;
    }
    onAddTask(text, durationMinutes);
    setText('');
    setDuration('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New task description..."
        className="flex-grow p-3 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-800 text-gray-200 placeholder-gray-400 border border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600"
        aria-label="Task description"
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Est. minutes"
        min="1"
        className="w-full p-3 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-800 text-gray-200 placeholder-gray-400 border border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600"
        aria-label="Estimated duration in minutes"
      />
      <button
        type="submit"
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
      >
        Add Task
      </button>
    </form>
  );
};