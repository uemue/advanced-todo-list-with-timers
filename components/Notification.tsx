
import React, { useEffect } from 'react';
import { NotificationMessage } from '../types';

interface NotificationProps {
  notification: NotificationMessage | null;
  onDismiss: () => void;
}

import { CheckCircleIcon } from './icons'; // Assuming CheckCircleIcon is available

export const ANIMATION_DURATION = 300; // ms
export const AUTO_DISMISS_DURATION = 5000; // ms

export const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const [show, setShow] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const dismissTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const exitAnimationTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const clearExitAnimationTimer = () => {
    if (exitAnimationTimerRef.current) {
      clearTimeout(exitAnimationTimerRef.current);
      exitAnimationTimerRef.current = null;
    }
  };
  
  const handleDismissAndNotifyParent = React.useCallback(() => {
    clearDismissTimer(); // Clear auto-dismiss if manual dismiss is triggered
    setIsEntering(false); // Ensure not in entering phase
    setIsExiting(true);
  }, []);


  useEffect(() => {
    clearDismissTimer();
    clearExitAnimationTimer();

    if (notification) {
      setShow(true);
      setIsExiting(false);
      setIsEntering(true); // Start entry: apply initial styles (opacity-0, translate-x-full)

      const entryTransitionTimer = setTimeout(() => {
        setIsEntering(false); // End entry: trigger transition to visible (opacity-100, translate-x-0)
      }, 50); // Short delay for initial styles to paint

      // Auto-dismiss logic
      dismissTimerRef.current = setTimeout(() => {
        handleDismissAndNotifyParent();
      }, AUTO_DISMISS_DURATION);
      
      return () => clearTimeout(entryTransitionTimer); // Cleanup entry transition timer
    } else {
      // If notification becomes null externally, ensure we are not showing/animating
      // This might need a graceful exit if not already exiting
      if(show && !isExiting) {
         handleDismissAndNotifyParent();
      } else if (!show) { // If already hidden, ensure states are reset
         setIsEntering(false);
         setIsExiting(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification]); // handleDismissAndNotifyParent is memoized

  useEffect(() => {
    if (isExiting) {
      clearExitAnimationTimer();
      exitAnimationTimerRef.current = setTimeout(() => {
        setShow(false);
        setIsExiting(false); // Reset for next notification
        onDismiss(); // Call parent's onDismiss *after* animation
      }, ANIMATION_DURATION);
    }
    return () => clearExitAnimationTimer(); // Cleanup exit animation timer
  }, [isExiting, onDismiss]);

  if (!show && !isExiting) { // Only return null if not visible AND not in the process of exiting
     // If isExiting is true, we still need to render for the exit animation.
     // If show is false AND isExiting is false, then it's truly gone.
    return null;
  }
  
  // Determine current transform and opacity based on state
  let currentTransform = 'transform motion-safe:translate-x-0';
  let currentOpacity = 'opacity-100';

  if (isEntering || (isExiting && show)) { // isExiting && show ensures we apply exit styles only if it was visible
    currentTransform = 'transform motion-safe:translate-x-full';
    currentOpacity = 'opacity-0';
  }
  // For reduced motion, no translation, just fade
  if (isEntering || isExiting) {
      currentTransform = `${currentTransform} motion-reduce:translate-x-0`;
  }


  return (
    <div
      className={`fixed top-5 right-5 z-50 p-4 max-w-sm w-full 
                 bg-sky-600 dark:bg-sky-700 text-white 
                 rounded-lg shadow-2xl border border-sky-500 dark:border-sky-600 
                 motion-safe:transition-all motion-safe:ease-in-out
                 ${isEntering || isExiting ? `duration-${ANIMATION_DURATION}` : 'duration-0'}
                 ${currentTransform} ${currentOpacity}
                 motion-reduce:transition-opacity motion-reduce:duration-${ANIMATION_DURATION}`}
      role="alert"
      aria-live="assertive" // More appropriate for notifications that appear/disappear
      aria-atomic="true"
    >
      <div className="flex items-start">
        <CheckCircleIcon className="w-6 h-6 mr-3 text-white flex-shrink-0 mt-0.5" />
        <span className="flex-grow">{notification?.message || ''}</span>
        <button
          onClick={handleDismissAndNotifyParent}
          className="ml-4 p-1 rounded-md hover:bg-sky-500 dark:hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
