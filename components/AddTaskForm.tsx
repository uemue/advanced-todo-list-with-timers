
import React, { useState } from 'react';

interface AddTaskFormProps {
  onAddTask: (text: string, durationMinutes: number) => void;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask }) => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(''); // Duration in minutes
  const [textError, setTextError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;

    if (!text.trim()) {
      setTextError("Task description cannot be empty.");
      isValid = false;
    } else {
      setTextError(null);
    }

    const durationMinutes = parseInt(duration, 10);
    if (!duration.trim() || isNaN(durationMinutes) || durationMinutes <= 0) {
      setDurationError("Please enter a valid positive number for duration.");
      isValid = false;
    } else {
      setDurationError(null);
    }

    if (!isValid) {
      return;
    }

    onAddTask(text, durationMinutes);
    setText('');
    setDuration('');
    setTextError(null);
    setDurationError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (textError) setTextError(null);
          }}
          placeholder="New task description..."
          className={`flex-grow w-full p-3 rounded-md border 
                     bg-gray-50 text-gray-900 placeholder-gray-500 
                     dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-400 
                     ${textError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-700 focus:border-primary-500'}
                     focus:ring-2 focus:ring-primary-500  
                     focus:bg-gray-100 dark:focus:bg-slate-700/50
                     transition-colors transition-shadow duration-150`}
          aria-label="Task description"
          aria-invalid={!!textError}
          aria-describedby={textError ? "text-error" : undefined}
        />
        <p id="text-error" className="text-red-500 text-sm mt-1 h-5" aria-live="polite">
          {textError || ''}
        </p>
      </div>
      <div>
        <input
          type="number"
          value={duration}
          onChange={(e) => {
            setDuration(e.target.value);
            if (durationError) setDurationError(null);
          }}
          placeholder="Est. minutes"
          min="1"
          className={`w-full p-3 rounded-md border
                     bg-gray-50 text-gray-900 placeholder-gray-500 
                     dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-400 
                     ${durationError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-700 focus:border-primary-500'}
                     focus:ring-2 focus:ring-primary-500 
                     focus:bg-gray-100 dark:focus:bg-slate-700/50
                     transition-colors transition-shadow duration-150`}
          aria-label="Estimated duration in minutes"
          aria-invalid={!!durationError}
          aria-describedby={durationError ? "duration-error" : undefined}
        />
        <p id="duration-error" className="text-red-500 text-sm mt-1 h-5" aria-live="polite">
          {durationError || ''}
        </p>
      </div>
      <button
        type="submit"
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:scale-95 transform transition-all duration-150 ease-in-out"
      >
        Add Task
      </button>
    </form>
  );
};