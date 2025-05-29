
import React from 'react';
import { Task, TimerStatus } from '../types';
import { TaskItem } from './TaskItem';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onSetTaskTimerStatus: (taskId: string, status: TimerStatus) => void;
  onActualDeleteTask: (taskId: string) => void;
  onReorderTasks: (draggedId: string, targetId: string) => void; // targetId will be string from over.id
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
  onActualDeleteTask,
  onReorderTasks,
  draggingItemId,
  setDraggingItemId,
}) => {
  const [newlyAddedTaskIds, setNewlyAddedTaskIds] = React.useState<string[]>([]);
  const prevTasksRef = React.useRef<Task[]>(tasks);

  React.useEffect(() => {
    const newTasks = tasks.filter(task => !prevTasksRef.current.find(pt => pt.id === task.id));
    if (newTasks.length > 0) {
      const newIds = newTasks.map(t => t.id);
      setNewlyAddedTaskIds(currentIds => [...currentIds, ...newIds]);
      newIds.forEach(id => {
        const timer = setTimeout(() => {
          setNewlyAddedTaskIds(currentIds => currentIds.filter(currentId => currentId !== id));
        }, 350);
        return () => clearTimeout(timer);
      });
    }
    prevTasksRef.current = tasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDndStart = (event: DragStartEvent) => {
    setDraggingItemId(event.active.id as string);
  };

  const handleDndEnd = (event: DragEndEvent) => {
    console.log('[TaskList] onDragEnd: active.id:', event.active.id, 'over.id:', event.over?.id);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderTasks(active.id as string, over.id as string);
    }
    setDraggingItemId(null);
  };

  if (tasks.length === 0) { // No need to check draggingItemId here for the empty message
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No tasks yet. Add one above!</p>;
  }

  const draggedTask = tasks.find(t => t.id === draggingItemId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDndStart}
      onDragEnd={handleDndEnd}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-6">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onStartTimer={onStartTimer}
              onPauseTimer={onPauseTimer}
              onResetTimer={onResetTimer}
              onSetTaskTimerStatus={onSetTaskTimerStatus}
              onActualDeleteTask={onActualDeleteTask}
              isNewlyAdded={newlyAddedTaskIds.includes(task.id)}
              // isDragging is passed for styling the item in the DragOverlay,
              // and potentially for styling the original item if it's visible during drag.
              // TaskItem will use its own isDragging from useSortable for its direct sortable state.
              isDragging={draggingItemId === task.id} 
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {draggingItemId && draggedTask ? (
          <TaskItem
            task={draggedTask}
            // Pass all necessary props for visual rendering.
            // Interactive props might be disabled or have no effect in an overlay.
            onToggleComplete={onToggleComplete} 
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResetTimer={onResetTimer}
            onSetTaskTimerStatus={onSetTaskTimerStatus}
            onActualDeleteTask={onActualDeleteTask} // This likely won't be triggered from overlay
            isNewlyAdded={false} // Not newly added when just being dragged
            isDragging={true} // Crucial for styling the overlay item
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
