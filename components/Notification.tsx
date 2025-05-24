
import React, { useEffect } from 'react';
import { NotificationMessage } from '../types';

interface NotificationProps {
  notification: NotificationMessage | null;
  onDismiss: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div
      className="fixed top-5 right-5 z-50 p-4 max-w-sm w-full bg-blue-500 dark:bg-blue-600 text-white rounded-lg shadow-xl transition-all animate-fadeIn"
      role="alert"
    >
      <div className="flex justify-between items-center">
        <span>{notification.message}</span>
        <button
          onClick={onDismiss}
          className="ml-4 text-xl font-semibold hover:opacity-75"
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
