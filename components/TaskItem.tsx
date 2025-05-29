import React, { useEffect } from 'react';
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onSetTaskTimerStatus: (taskId: string, status: TimerStatus) => void;
  onActualDeleteTask: (taskId: string) => void;
  isNewlyAdded?: boolean;
  isDragging?: boolean; // Renamed to isOverlayItem effectively, as passed by TaskList for DragOverlay
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSetTaskTimerStatus,
  onActualDeleteTask,
  isNewlyAdded = false,
  isDragging: isOverlayItem = false, // isDragging from props is for when item is in DragOverlay
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(!isNewlyAdded);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: dndIsDragging, // isDragging state from useSortable
  } = useSortable({ id: task.id });

  // Determine effective dragging state: true if dnd-kit says so, or if it's an overlay item
  const effectiveIsDragging = dndIsDragging || isOverlayItem;

  useEffect(() => {
    if (isNewlyAdded) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isNewlyAdded]);

  useEffect(() => {
    if (isDeleting) {
      const timer = setTimeout(() => {
        onActualDeleteTask(task.id);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDeleting, task.id, onActualDeleteTask]);

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
          onSetTaskTimerStatus(task.id, TimerStatus.FINISHED);
          if (logicIntervalId) clearInterval(logicIntervalId);
        }
      }, 250);
    }
    return () => {
      if (logicIntervalId) clearInterval(logicIntervalId);
    };
  }, [
    task.timerStatus,
    task.timerStartTime,
    task.accumulatedTime,
    task.estimatedDuration,
    task.id,
    onSetTaskTimerStatus,
  ]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease', // Fallback transition
    maxHeight: isDeleting ? '0px' : '200px',
    paddingTop: isDeleting ? '0px' : undefined,
    paddingBottom: isDeleting ? '0px' : undefined,
    marginBottom: isDeleting ? '0px' : undefined,
    boxShadow: isDeleting ? 'none' : undefined,
    // Opacity for entry/exit animation, overridden by dnd-kit dragging styles if applicable
    // dndIsDragging item (source) should be visible; overlayItem will get its opacity from className
    opacity: dndIsDragging ? 1 : (isVisible && !isDeleting ? 1 : 0),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex md:flex-row flex-col items-start md:items-center md:justify-between rounded-lg shadow-md
                  hover:shadow-lg 
                  ${
                    task.isCompleted
                      ? 'bg-green-50 dark:bg-green-900/50'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                  }
                  ${
                    effectiveIsDragging // For both source item being dragged and overlay item
                      ? 'opacity-75 ring-2 ring-primary-500 motion-safe:scale-105 z-10'
                      : 'motion-safe:scale-100'
                  }
                  ${
                    // Apply entry/exit animations only if not being dragged by dnd-kit (to avoid transform conflicts)
                    // and not an overlay item (overlay item has its own fixed appearance)
                    !dndIsDragging && !isOverlayItem && (isVisible && !isDeleting
                      ? 'motion-safe:translate-y-0 motion-safe:scale-100' // Normal visible state
                      : 'opacity-0 motion-safe:-translate-y-5 motion-safe:scale-95') // Initial invisible state for entry
                  }
                  ${
                    isDeleting // Deletion animation
                      ? 'motion-safe:opacity-0 motion-safe:scale-90 overflow-hidden !p-0 !mb-0'
                      : ''
                  }
                  motion-safe:transition-all motion-safe:duration-300 ease-in-out
                  motion-reduce:transition-none
                  p-4 mb-3 
                  `}
    >
      <div
        className={`flex items-center w-full md:flex-grow ${
          // Content opacity for delete animation (applied when not dndIsDragging to avoid conflict)
          isDeleting && !dndIsDragging ? 'motion-safe:opacity-0' : 'opacity-100'
        } motion-safe:transition-opacity motion-safe:duration-150`}
      >
        <button
          {...attributes}
          {...listeners}
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
          onClick={() => setIsDeleting(true)}
          className='p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-100 dark:hover:bg-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-500'
          aria-label='Delete task'
          disabled={isDeleting}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};
