
export enum TimerStatus {
  IDLE = 'idle', // Timer not started or reset
  RUNNING = 'running', // Timer is actively counting down or up
  PAUSED = 'paused', // Timer is paused
  FINISHED = 'finished', // Countdown completed, now in overtime
}

export interface Task {
  id: string;
  text: string;
  estimatedDuration: number; // in seconds
  isCompleted: boolean;
  timerStatus: TimerStatus;
  accumulatedTime: number; // in milliseconds, time accumulated while timer was running (excluding current interval)
  timerStartTime: number | null; // Timestamp (ms) when current running interval started
}

export interface NotificationMessage {
  id: string;
  message: string;
  taskId: string; // To associate notification with a task if needed
}
