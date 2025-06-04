import { useEffect, useRef } from 'react';

/**
 * Requests a screen wake lock while `active` is true. The lock is released when
 * `active` becomes false or the component using this hook unmounts. If the page
 * becomes visible again after being hidden, the lock is re-requested.
 */
export function useScreenWakeLock(active: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const requestLock = async () => {
      if (!active || !('wakeLock' in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error('Failed to acquire wake lock', err);
      }
    };

    const releaseLock = async () => {
      try {
        await wakeLockRef.current?.release();
      } catch {
        // ignore
      } finally {
        wakeLockRef.current = null;
      }
    };

    if (active) {
      requestLock();
    } else {
      releaseLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [active]);
}
