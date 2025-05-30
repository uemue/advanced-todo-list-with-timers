import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task, TimerStatus } from '../types';
import { TimerDisplay } from './TimerDisplay';
import {
  PlayIcon,
  PauseIcon,
  RefreshIcon,
  CheckCircleIcon,
  CircleIcon,
  Bars3Icon,
  TrashIcon,
} from './icons';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onSetTaskTimerStatus: (taskId: string, status: TimerStatus) => void; // For internal status changes like FINISHED
  onActualDeleteTask: (taskId: string) => void; // Renamed, actual function to remove from state
  isNewlyAdded?: boolean; // Optional: for entry animation
  isDragging: boolean;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void; // Only preventDefault
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSetTaskTimerStatus,
  onActualDeleteTask,
  isNewlyAdded = false, // Default to false
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(!isNewlyAdded); // Start invisible if newly added
  const [isCollapsingForDrag, setIsCollapsingForDrag] = React.useState(false);

  useEffect(() => {
    if (isNewlyAdded) {
      // Trigger transition after a short delay to ensure initial styles (opacity-0) are applied
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50); // Small delay for browser to paint initial state
      return () => clearTimeout(timer);
    }
  }, [isNewlyAdded]);

  useEffect(() => {
    if (isDeleting) {
      const timer = setTimeout(() => {
        onActualDeleteTask(task.id);
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [isDeleting, task.id, onActualDeleteTask]);

  useEffect(() => {
    if (!isDragging) {
      setIsCollapsingForDrag(false);
    }
  }, [isDragging]);

  useEffect(() => {
    let logicIntervalId: number | undefined = undefined;

    if (task.timerStatus === TimerStatus.RUNNING) {
      logicIntervalId = window.setInterval(() => {
        const now = Date.now();
        const effectiveElapsedTimeMs =
          task.accumulatedTime +
          (task.timerStartTime ? now - task.timerStartTime : 0);
        const effectiveElapsedTimeInSeconds = Math.floor(
          effectiveElapsedTimeMs / 1000
        );

        if (effectiveElapsedTimeInSeconds >= task.estimatedDuration) {
          // onSetTaskTimerStatus will handle the notification trigger in App.tsx
          onSetTaskTimerStatus(task.id, TimerStatus.FINISHED);
          if (logicIntervalId) clearInterval(logicIntervalId); // Stop checking once finished
        }
      }, 250); // Check 4 times a second for responsiveness
    }

    return () => {
      if (logicIntervalId) clearInterval(logicIntervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    task.timerStatus,
    task.timerStartTime,
    task.accumulatedTime,
    task.estimatedDuration,
    task.id,
    onSetTaskTimerStatus,
  ]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // console.log('TaskItem handleDragStart for task:', task.id); // Original console log
    onDragStart(e, task.id); // Call prop
    // Delay setting the collapsing state
    setTimeout(() => {
      setIsCollapsingForDrag(true);
    }, 0); // 0ms timeout defers execution to the next event loop tick
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('TaskItem handleDragOver for task:', task.id);
    e.preventDefault(); // This is crucial for drop to work
    onDragOver(e);
  };

  return (
    <motion.div
      layout="position" // Added for Framer Motion reordering animation
      key={task.id} // Ensure key is on the motion component for AnimatePresence
      draggable // Added draggable attribute
      onDragStart={handleDragStart} // Added onDragStart handler
      onDragEnd={(e) => onDragEnd(e as any)} // Added onDragEnd handler
      onDragOver={handleDragOver}
      style={{
        maxHeight: isDeleting ? '0px' : '200px', // Estimate a large enough max-height for transition
        paddingTop: isDeleting ? '0px' : undefined,
        paddingBottom: isDeleting ? '0px' : undefined,
        marginBottom: isDeleting ? '0px' : undefined,
        boxShadow: isDeleting ? 'none' : undefined,
      }}
      className={`group flex md:flex-row flex-col items-start md:items-center md:justify-between rounded-lg shadow-md
                  hover:shadow-lg 
                  ${
                    task.isCompleted
                      ? 'bg-green-50 dark:bg-green-900/50'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                  }
                  ${
                    isCollapsingForDrag // Changed from isDragging
                      ? 'opacity-0 !h-0 !p-0 !my-0 !border-0 overflow-hidden motion-safe:!scale-100'
                      : 'motion-safe:scale-100'
                  }
                  ${
                    isVisible && !isDeleting
                      ? 'opacity-100 motion-safe:translate-y-0 motion-safe:scale-100'
                      : 'opacity-0 motion-safe:-translate-y-5 motion-safe:scale-95'
                  }
                  ${
                    isDeleting
                      ? 'motion-safe:opacity-0 motion-safe:scale-90 overflow-hidden !p-0 !mb-0'
                      : ''
                  }
                  motion-reduce:transition-none
                  p-4 mb-3 
                  `}
    >
      {/* Inner container to prevent content from collapsing immediately due to parent's padding/margin changes during delete animation */}
      <div
        className={`flex items-center w-full md:flex-grow ${
          isDeleting ? 'motion-safe:opacity-0' : 'opacity-100'
        } motion-safe:transition-opacity motion-safe:duration-150`}
      >
        <button
          // draggable removed
          // onDragStart removed
          // onDragEnd removed
          // onClick removed
          className='group/handle cursor-grab p-2 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400'
          aria-label='Drag to reorder task'
        >
          <Bars3Icon className='transition-transform duration-150 group-hover/handle:scale-110' />
        </button>
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`mr-3 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition-colors duration-200
                      ${
                        task.isCompleted
                          ? 'text-green-600 hover:text-green-700 focus:ring-green-500'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:ring-primary-500'
                      }`}
          aria-label={
            task.isCompleted
              ? 'Mark task as incomplete'
              : 'Mark task as complete'
          }
        >
          {task.isCompleted ? (
            <CheckCircleIcon className='w-6 h-6 transition-all duration-300 ease-in-out transform' />
          ) : (
            <CircleIcon className='w-6 h-6 transition-all duration-300 ease-in-out transform' />
          )}
        </button>
        <span
          className={`w-full md:flex-grow truncate md:whitespace-normal md:overflow-visible transition-all duration-300 ${
            task.isCompleted
              ? 'line-through text-gray-500 dark:text-gray-400'
              : 'text-gray-800 dark:text-gray-100'
          }`}
        >
          {task.text}
        </span>
      </div>

      <div className='w-full flex items-center justify-between mt-3 md:mt-0 md:ml-4 md:w-auto space-x-2'>
        <TimerDisplay task={task} />
        {!task.isCompleted && (
          <>
            {task.timerStatus === TimerStatus.RUNNING ||
            task.timerStatus === TimerStatus.FINISHED ? (
              <button
                onClick={() => onPauseTimer(task.id)}
                className='p-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-500'
                aria-label='Pause timer'
              >
                <PauseIcon />
              </button>
            ) : (
              <button
                onClick={() => onStartTimer(task.id)}
                className='p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='Start timer'
              >
                <PlayIcon />
              </button>
            )}
            <button
              onClick={() => onResetTimer(task.id)}
              className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500'
              aria-label='Reset timer'
            >
              <RefreshIcon />
            </button>
          </>
        )}
        <button
          onClick={() => setIsDeleting(true)} // Initiate deletion animation
          className='p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-500'
          aria-label='Delete task'
          disabled={isDeleting} // Disable button during animation
        >
          <TrashIcon />
        </button>
      </div>
    </motion.div>
  );
};
