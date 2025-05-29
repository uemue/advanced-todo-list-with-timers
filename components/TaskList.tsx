
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
  onSetTaskTimerStatus,
  onActualDeleteTask, // Renamed
  onReorderTasks,
  draggingItemId,
  setDraggingItemId
}) => {
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);
  const [newlyAddedTaskIds, setNewlyAddedTaskIds] = React.useState<string[]>([]);
  const prevTasksRef = React.useRef<Task[]>(tasks);

  React.useEffect(() => {
    const newTasks = tasks.filter(task => !prevTasksRef.current.find(pt => pt.id === task.id));
    if (newTasks.length > 0) {
      const newIds = newTasks.map(t => t.id);
      setNewlyAddedTaskIds(currentIds => [...currentIds, ...newIds]);
      newIds.forEach(id => {
        // Duration should be slightly longer than animation
        const timer = setTimeout(() => {
          setNewlyAddedTaskIds(currentIds => currentIds.filter(currentId => currentId !== id));
        }, 350); // Animation duration is 300ms
        // Cleanup timeout if component unmounts or tasks change causing re-run
        return () => clearTimeout(timer);
      });
    }
    prevTasksRef.current = tasks;
  }, [tasks]);


  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    console.log('handleDragStart called with taskId:', taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
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
        console.log('Setting dropTargetIndex to:', newDropIndex, 'for taskId:', taskId);
        setDropTargetIndex(newDropIndex);
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    console.log('handleDrop called with dropTargetIndex:', dropTargetIndex);
    event.preventDefault();
    event.stopPropagation();
    const draggedTaskId = event.dataTransfer.getData('text/plain');
    console.log('draggedTaskId:', draggedTaskId);
    
    if (draggedTaskId && dropTargetIndex !== null) {
        console.log('dropTargetIndex:', dropTargetIndex);
        
        const targetTask = tasks[dropTargetIndex];
        console.log('targetTask:', targetTask?.id ?? 'null');
        // If dropTargetIndex is tasks.length or beyond, targetTask will be undefined.
        // This means dropping at the end. onReorderTasks needs to handle targetId: null
        onReorderTasks(draggedTaskId, targetTask?.id ?? null);
    }
    setDraggingItemId(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = (_event: React.DragEvent<HTMLDivElement>) => {
    setDraggingItemId(null);
    setDropTargetIndex(null);
  };

  const handleDragLeaveList = (event: React.DragEvent<HTMLDivElement>) => {
    // Check if the mouse is leaving the list container towards an unrelated element
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setDropTargetIndex(null);
    }
  };
  
  const Placeholder = () => (
    <div 
      key={PLACEHOLDER_ID} 
      className="h-16 border-2 border-dashed border-primary-500 dark:border-primary-400 rounded-lg my-2 opacity-75 transition-all duration-150"
      aria-hidden="true"
    ></div>
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
            // This onDragOver on the list itself is to handle dragging over empty space
            // or to set a default drop index (e.g., end of list) if not over any item.
            e.preventDefault();
            if (tasks.length === 0 && draggingItemId) {
                setDropTargetIndex(0); // Allow dropping into an empty list
            }
            // Potentially, if not over any specific item but over the list,
            // you could set dropTargetIndex to tasks.length (to drop at the end).
            // However, this might conflict with handleTaskItemDragOver.
            // The current logic relies on handleTaskItemDragOver for precise positioning.
            // handleDragLeaveList will clear it if we drag out.
         }}
         onDrop={handleDrop}>
      {itemsWithPlaceholder}
    </div>
  );
};
