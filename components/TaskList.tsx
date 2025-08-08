
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TimerStatus } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Pick<Task, 'text' | 'estimatedDuration'>>) => void;
  onSetTaskTimerStatus: (taskId: string, status: TimerStatus) => void;
  onActualDeleteTask: (taskId: string) => void; // Renamed from onDeleteTask for clarity
  onReorderTasks: (draggedId: string, targetId: string | null) => void; // targetId can be null for dropping at the end
  draggingItemId: string | null;
  setDraggingItemId: (id: string | null) => void;
}

const PLACEHOLDER_ID = "drop-placeholder";

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleComplete,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onUpdateTask,
  onSetTaskTimerStatus,
  onActualDeleteTask, // Renamed
  onReorderTasks,
  draggingItemId,
  setDraggingItemId
}) => {
  const noop = () => {};
  const updateTask = onUpdateTask ?? noop;
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);
  const [newlyAddedTaskIds, setNewlyAddedTaskIds] = React.useState<string[]>([]);
  const prevTasksRef = React.useRef<Task[]>(tasks);

  React.useEffect(() => {
    const newTasks = tasks.filter(task => !prevTasksRef.current.find(pt => pt.id === task.id));
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (newTasks.length > 0) {
      const newIds = newTasks.map(t => t.id);
      setNewlyAddedTaskIds(currentIds => [...currentIds, ...newIds]);

      newIds.forEach(id => {
        // Duration should be slightly longer than animation
        const timer = setTimeout(() => {
          setNewlyAddedTaskIds(currentIds => currentIds.filter(currentId => currentId !== id));
        }, 350); // Animation duration is 300ms
        timeouts.push(timer);
      });
    }

    prevTasksRef.current = tasks;

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [tasks]);


  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    // Set custom drag image
    if (event.currentTarget) { // Check if currentTarget is available
      event.dataTransfer.setDragImage(event.currentTarget, 10, 10);
    }
    setDraggingItemId(taskId);
    // setDropTargetIndex(null); // Clear any previous placeholder
  };

  // This handleDragOver is for the TaskItem itself.
  const handleTaskItemDragOver = (event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent bubbling to the list's dragOver if needed for specific logic

    if (!draggingItemId) return;

    const targetElement = event.currentTarget as HTMLDivElement;
    const rect = targetElement.getBoundingClientRect();
    const verticalMidpoint = rect.top + rect.height / 2;
    const isTopHalf = event.clientY < verticalMidpoint;

    const overItemIndex = tasks.findIndex(t => t.id === taskId);
    if (overItemIndex === -1) return;

    const newDropIndex = isTopHalf ? overItemIndex : overItemIndex + 1;
    
    // Optimization: only update state if the index actually changes
    if (newDropIndex !== dropTargetIndex) {
        setDropTargetIndex(newDropIndex);
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const draggedTaskId = event.dataTransfer.getData('text/plain');
    
    if (draggedTaskId && dropTargetIndex !== null) {
        
        const targetTask = tasks[dropTargetIndex];
        // If dropTargetIndex is tasks.length or beyond, targetTask will be undefined.
        // This means dropping at the end. onReorderTasks needs to handle targetId: null
        onReorderTasks(draggedTaskId, targetTask?.id ?? null);
    }
    setDraggingItemId(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = (_event: any) => {
    setDraggingItemId(null);
    setDropTargetIndex(null);
  };

  const handleDragLeaveList = (event: React.DragEvent<HTMLDivElement>) => {
    // Check if the mouse is leaving the list container towards an unrelated element
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && !event.currentTarget.contains(relatedTarget)) {
        setDropTargetIndex(null);
    }
  };
  
  const Placeholder = () => (
    <motion.div
      layout="position"
      key={PLACEHOLDER_ID}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: '4rem' }} // h-16 is 4rem
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="border-2 border-dashed border-primary-500 dark:border-primary-400 rounded-lg my-2 opacity-75" // Removed h-16, transition-all, duration-150. Height is handled by animate.
      aria-hidden="true"
    ></motion.div>
  );

  if (tasks.length === 0 && !draggingItemId) { // Also check draggingItemId to show placeholder in empty list
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No tasks yet. Add one above!</p>;
  }

  // Build the list with potential placeholder
  const itemsWithPlaceholder: React.ReactNode[] = [];
  tasks.forEach((task, index) => {
    if (dropTargetIndex === index) {
      itemsWithPlaceholder.push(<Placeholder key={`${PLACEHOLDER_ID}-${index}`} />);
    }
    itemsWithPlaceholder.push(
      <TaskItem
        key={task.id}
        task={task}
        onToggleComplete={onToggleComplete}
        onStartTimer={onStartTimer}
        onPauseTimer={onPauseTimer}
        onResetTimer={onResetTimer}
        onUpdateTask={updateTask}
        onSetTaskTimerStatus={onSetTaskTimerStatus}
        // onDeleteTask prop of TaskItem will trigger its internal animation sequence
        // onActualDeleteTask is the function from App.tsx to remove from state
        onActualDeleteTask={onActualDeleteTask} 
        isNewlyAdded={newlyAddedTaskIds.includes(task.id)}
        isDragging={draggingItemId === task.id}
        onDragStart={(e) => handleDragStart(e, task.id)}
        // Pass the task-specific dragOver handler
        onDragOver={(e) => handleTaskItemDragOver(e, task.id)} 
        onDragEnd={handleDragEnd}
        // onUpdateDropTarget is not needed if TaskItem's onDragOver directly calls logic
      />
    );
  });

  // If dragging to the end of the list
  if (dropTargetIndex === tasks.length) {
    itemsWithPlaceholder.push(<Placeholder key={`${PLACEHOLDER_ID}-end`} />);
  }
  
  // Handle empty list while dragging
  if (tasks.length === 0 && draggingItemId && dropTargetIndex === 0) {
     itemsWithPlaceholder.push(<Placeholder key={`${PLACEHOLDER_ID}-empty`} />);
  }


  return (
    <div className="mt-6" 
         onDragLeave={handleDragLeaveList}
         onDragOver={(e) => {
            e.preventDefault();
            if (tasks.length === 0 && draggingItemId) {
                setDropTargetIndex(0); 
            }
         }}
         onDrop={handleDrop}>
      <AnimatePresence initial={false} mode='popLayout'>
        {itemsWithPlaceholder}
      </AnimatePresence>
    </div>
  );
};
