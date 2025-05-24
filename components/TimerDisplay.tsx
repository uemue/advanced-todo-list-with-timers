
import React, { useState, useEffect } from 'react';
import { Task, TimerStatus } from '../types';

interface TimerDisplayProps {
  task: Task;
}

const formatTime = (totalSeconds: number): string => {
  const absTotalSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(absTotalSeconds / 60);
  const seconds = absTotalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ task }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    let intervalId: number | undefined;
    if (task.timerStatus === TimerStatus.RUNNING || task.timerStatus === TimerStatus.FINISHED) {
      intervalId = window.setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [task.timerStatus]);

  const getEffectiveElapsedTimeMs = () => {
    if (task.timerStatus === TimerStatus.IDLE) return 0;
    if (task.timerStatus === TimerStatus.PAUSED) return task.accumulatedTime;
    // RUNNING or FINISHED (overtime)
    if (task.timerStartTime) {
      return task.accumulatedTime + (currentTime - task.timerStartTime);
    }
    // Fallback, though timerStartTime should be set if running/finished
    return task.accumulatedTime; 
  };

  const effectiveElapsedTimeMs = getEffectiveElapsedTimeMs();
  const effectiveElapsedTimeInSeconds = Math.floor(effectiveElapsedTimeMs / 1000);

  let displayTime: string;
  let timerColor = "text-gray-700 dark:text-gray-300";

  if (task.timerStatus === TimerStatus.IDLE) {
    displayTime = task.estimatedDuration > 0 ? formatTime(task.estimatedDuration) : '00:00';
  } else if (effectiveElapsedTimeInSeconds < task.estimatedDuration && task.timerStatus !== TimerStatus.FINISHED) {
    // Countdown
    const remainingSeconds = task.estimatedDuration - effectiveElapsedTimeInSeconds;
    displayTime = formatTime(remainingSeconds);
    if (task.timerStatus === TimerStatus.RUNNING) timerColor = "text-blue-600 dark:text-blue-400";
  } else {
    // Overtime or exactly at finish
    const overtimeSeconds = effectiveElapsedTimeInSeconds - task.estimatedDuration;
    displayTime = `+${formatTime(overtimeSeconds)}`;
    timerColor = "text-red-600 dark:text-red-400";
  }
  
  if (task.timerStatus === TimerStatus.PAUSED) {
    // Display accumulated time when paused or remaining if not started.
     if (effectiveElapsedTimeInSeconds < task.estimatedDuration) {
        const remainingSeconds = task.estimatedDuration - effectiveElapsedTimeInSeconds;
        displayTime = formatTime(remainingSeconds);
     } else {
        const overtimeSeconds = effectiveElapsedTimeInSeconds - task.estimatedDuration;
        displayTime = `+${formatTime(overtimeSeconds)}`;
     }
    timerColor = "text-yellow-600 dark:text-yellow-400";
  }

  if (task.isCompleted) {
    // Show final recorded time if completed.
    const finalTimeSeconds = Math.floor(task.accumulatedTime / 1000);
    if (finalTimeSeconds < task.estimatedDuration) {
        displayTime = formatTime(task.estimatedDuration - finalTimeSeconds);
    } else {
        displayTime = `+${formatTime(finalTimeSeconds - task.estimatedDuration)}`;
    }
    timerColor = "text-green-600 dark:text-green-400";
  }


  return <span className={`font-mono text-lg min-w-[70px] text-right ${timerColor}`}>{displayTime}</span>;
};
