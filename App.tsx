
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TimerStatus, NotificationMessage } from './types';
import { useScreenWakeLock } from './hooks/useScreenWakeLock';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { Notification } from './components/Notification';
import { MoonIcon, SunIcon } from './components/icons';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('todoTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
     if (typeof window !== 'undefined') {
        return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
     }
     return false;
  });

  const anyTimerRunning = tasks.some(
    t => t.timerStatus === TimerStatus.RUNNING || t.timerStatus === TimerStatus.FINISHED
  );
  useScreenWakeLock(anyTimerRunning);

  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const showAppNotification = (message: string, taskId: string) => {
    setNotification({ id: Date.now().toString(), message, taskId });
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  const addTask = (text: string, durationMinutes: number) => {
    // Fallback UUID generation for environments without crypto.randomUUID
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback implementation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newTask: Task = {
      id: generateId(),
      text,
      estimatedDuration: durationMinutes * 60, // Convert minutes to seconds
      isCompleted: false,
      timerStatus: TimerStatus.IDLE,
      accumulatedTime: 0,
      timerStartTime: null,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const isCurrentlyCompleted = task.isCompleted;
          
          if (!isCurrentlyCompleted) {
            // Task is being marked as complete
            // If timer is running, preserve the accumulated time including current interval
            if (task.timerStartTime && (task.timerStatus === TimerStatus.RUNNING || task.timerStatus === TimerStatus.FINISHED)) {
              const elapsedInCurrentInterval = Date.now() - task.timerStartTime;
              return {
                ...task,
                isCompleted: true,
                timerStatus: TimerStatus.IDLE,
                accumulatedTime: task.accumulatedTime + elapsedInCurrentInterval,
                timerStartTime: null
              };
            } else {
              // Timer not running, just mark as complete
              return {
                ...task,
                isCompleted: true,
                timerStatus: TimerStatus.IDLE,
                timerStartTime: null
              };
            }
          } else {
            // Task is being marked as incomplete - reset timer state
            return {
              ...task,
              isCompleted: false,
              timerStatus: TimerStatus.IDLE,
              timerStartTime: null
            };
          }
        }
        return task;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const startTimer = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId && !task.isCompleted) {
          // If resuming from PAUSED, accumulatedTime is already set.
          // If starting from IDLE, accumulatedTime is 0.
          return { ...task, timerStatus: TimerStatus.RUNNING, timerStartTime: Date.now() };
        }
        return task;
      })
    );
  };

  const pauseTimer = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId && task.timerStartTime && (task.timerStatus === TimerStatus.RUNNING || task.timerStatus === TimerStatus.FINISHED) ) {
          const elapsedInCurrentInterval = Date.now() - task.timerStartTime;
          return {
            ...task,
            timerStatus: TimerStatus.PAUSED,
            accumulatedTime: task.accumulatedTime + elapsedInCurrentInterval,
            timerStartTime: null,
          };
        }
        return task;
      })
    );
  };

  const resetTimer = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, timerStatus: TimerStatus.IDLE, accumulatedTime: 0, timerStartTime: null }
          : task
      )
    );
  };
  
  const setTaskTimerStatus = useCallback((taskId: string, newStatus: TimerStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(t => {
        if (t.id === taskId) {
          if (t.timerStatus === newStatus) return t; // No change if status is already the new status

          if (t.timerStatus === TimerStatus.RUNNING && newStatus === TimerStatus.FINISHED) {
            // Only show notification if it's a true transition to FINISHED from RUNNING
             // And if not already FINISHED (to avoid re-notifying if logic runs multiple times)
            showAppNotification(`Task "${t.text}" time is up! Now tracking overtime.`, t.id);
          }
          return { ...t, timerStatus: newStatus };
        }
        return t;
      })
    );
  }, []);


  const reorderTasks = (draggedId: string, targetId: string | null) => {
    setTasks(prevTasks => {
      const draggedItemIndex = prevTasks.findIndex(task => task.id === draggedId);

      if (draggedItemIndex === -1) return prevTasks; // Dragged item not found

      const draggedItem = prevTasks[draggedItemIndex];
      const newTasks = [...prevTasks];
      
      // Remove the dragged item
      newTasks.splice(draggedItemIndex, 1);
      
      if (targetId === null) {
        // If targetId is null, move to the end of the list
        newTasks.push(draggedItem);
        return newTasks;
      } else {
        // If targetId is provided, find its index in the new array and insert before it
        const targetItemIndex = newTasks.findIndex(task => task.id === targetId);
        if (targetItemIndex === -1) { 
          // Target item not found, fallback to end
          newTasks.push(draggedItem);
          return newTasks;
        }
        
        // Insert before target
        newTasks.splice(targetItemIndex, 0, draggedItem);
        return newTasks;
      }
    });
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-8 transition-colors duration-300">
      <div className="container mx-auto max-w-2xl px-4">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">Advanced Todo List</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>
        
        <Notification notification={notification} onDismiss={dismissNotification} />

        <main>
          <AddTaskForm onAddTask={addTask} />
          <TaskList
            tasks={tasks}
            onToggleComplete={toggleTaskComplete}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onResetTimer={resetTimer}
            onSetTaskTimerStatus={setTaskTimerStatus}
            onActualDeleteTask={deleteTask}
            onReorderTasks={reorderTasks}
            draggingItemId={draggingItemId}
            setDraggingItemId={setDraggingItemId}
          />
        </main>
        <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Drag tasks to reorder. Timers count down, then count up overtime.</p>
          <p>&copy; {new Date().getFullYear()} Todo App. Crafted with care.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
