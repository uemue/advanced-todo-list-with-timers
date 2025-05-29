
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
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  // arrayMove, // Assuming App.tsx handles reordering logic
} from '@dnd-kit/sortable';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onResetTimer: (taskId: string) => void;
  onSetTaskTimerStatus: (taskId: string, status: TimerStatus) => void;
  onActualDeleteTask: (taskId: string) => void;
  onReorderTasks: (draggedId: string, targetId: string) => void; // targetId will not be null with dnd-kit logic here
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

  const handleDragStartInternal = (event: DragStartEvent) => {
    setDraggingItemId(event.active.id as string);
  };

  const handleDragOverInternal = (event: DragOverEvent) => {
    // The `SortableContext` and `useSortable` (in TaskItem) typically handle visual cues.
    // This handler can be used for more complex scenarios if needed.
    // For now, we might not need specific logic here.
    // console.log("DragOver: ", event.active.id, event.over?.id);
  };

  const handleDragEndInternal = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderTasks(active.id as string, over.id as string);
    }
    setDraggingItemId(null);
  };

  if (tasks.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No tasks yet. Add one above!</p>;
  }

  const draggedTask = tasks.find(t => t.id === draggingItemId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStartInternal}
      onDragOver={handleDragOverInternal}
      onDragEnd={handleDragEndInternal}
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
              // The following props related to HTML5 DND are no longer needed by TaskItem directly for sorting
              // isDragging={draggingItemId === task.id} 
              // onDragStart, onDragOver, onDrop, onDragEnd will be handled by useSortable in TaskItem
              // For now, we pass isDragging for potential overlay styling or other non-dnd-kit uses if any.
              isDragging={draggingItemId === task.id} 
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {draggingItemId && draggedTask ? (
          <TaskItem
            task={draggedTask}
            onToggleComplete={onToggleComplete} // These might not be interactive in overlay
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResetTimer={onResetTimer}
            onSetTaskTimerStatus={onSetTaskTimerStatus}
            onActualDeleteTask={onActualDeleteTask}
            isNewlyAdded={false} // Not newly added when just being dragged
            isDragging={true} // It is being dragged
            // The overlay TaskItem doesn't need dnd event handlers itself
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
