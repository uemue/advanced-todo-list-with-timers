
import React from 'react';
import { Task, TimerStatus } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onSetTaskTimerStatus: (taskId: string, status: TimerStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (draggedId: string, targetId: string) => void;
  draggingItemId: string | null;
  setDraggingItemId: (id: string | null) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleComplete,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSetTaskTimerStatus,
  onDeleteTask,
  onReorderTasks,
  draggingItemId,
  setDraggingItemId
}) => {

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    setDraggingItemId(taskId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetTaskId: string) => {
    event.preventDefault();
    const draggedTaskId = event.dataTransfer.getData('text/plain');
    if (draggedTaskId && draggedTaskId !== targetTaskId) {
      onReorderTasks(draggedTaskId, targetTaskId);
    }
    setDraggingItemId(null); 
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingItemId(null);
  };


  if (tasks.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No tasks yet. Add one above!</p>;
  }

  return (
    <div className="mt-6">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onStartTimer={onStartTimer}
          onPauseTimer={onPauseTimer}
          onResetTimer={onResetTimer}
          onSetTaskTimerStatus={onSetTaskTimerStatus}
          onDeleteTask={onDeleteTask}
          isDragging={draggingItemId === task.id}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};
