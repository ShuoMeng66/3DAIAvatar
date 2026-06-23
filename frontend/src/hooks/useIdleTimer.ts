import { useEffect, useRef } from 'react';

export function useIdleTimer(callback: () => void, timeout: number) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const timer = setInterval(() => {
      callbackRef.current();
    }, timeout);
    return () => clearInterval(timer);
  }, [timeout]);
}