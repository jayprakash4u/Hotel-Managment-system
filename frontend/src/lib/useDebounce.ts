import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Debounces a value with a configurable delay (default: 300ms).
 * Prevents excessive API fetching on rapid user input (e.g. search bars).
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

export default useDebounce;

