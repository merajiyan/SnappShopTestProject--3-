import { useCallback, useEffect, useRef } from 'react';

type DebouncedFunction<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay = 500,
): DebouncedFunction<T> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      cancel();

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [cancel, delay],
  );

  return Object.assign(debounced, { cancel }) as DebouncedFunction<T>;
}