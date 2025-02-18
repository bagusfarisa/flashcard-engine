import { useState, useEffect, useMemo } from 'react';

interface VirtualizationOptions {
  itemCount: number;
  visibleItems: number;
  currentIndex: number;
}

export function useVirtualization({ itemCount, visibleItems, currentIndex }: VirtualizationOptions) {
  const [windowStart, setWindowStart] = useState(0);

  useEffect(() => {
    const newStart = Math.max(0, Math.min(currentIndex - 1, itemCount - visibleItems));
    setWindowStart(newStart);
  }, [currentIndex, itemCount, visibleItems]);

  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < visibleItems && windowStart + i < itemCount; i++) {
      indices.push(windowStart + i);
    }
    return indices;
  }, [windowStart, visibleItems, itemCount]);

  return {
    visibleIndices,
    isVisible: (index: number) => visibleIndices.includes(index)
  };
}