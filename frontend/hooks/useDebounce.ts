'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a value — useful for search inputs to avoid excess API calls.
 * @param value  The value to debounce
 * @param delay  Delay in milliseconds (default 300)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
