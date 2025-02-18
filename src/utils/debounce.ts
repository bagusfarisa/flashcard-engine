type DebouncedFunction<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;

export function debounce<TArgs extends unknown[], TReturn>(
  func: DebouncedFunction<TArgs, TReturn>,
  wait: number
): DebouncedFunction<TArgs, TReturn> {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: TArgs): TReturn {
    const later = () => {
      timeout = null;
      return func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
    return func(...args);
  };
}
