import { useState, useCallback, useRef, useEffect } from 'react';

interface TouchInteractionOptions {
  threshold?: number;
  disabled?: boolean;
  onSwipe?: (direction: 'up' | 'down') => void;
}

export function useTouchInteraction({ threshold = 0.15, disabled = false, onSwipe }: TouchInteractionOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef(0);
  const frameRef = useRef(0);
  const windowHeightRef = useRef(0);

  useEffect(() => {
    windowHeightRef.current = window.innerHeight;
    const handleResize = () => {
      windowHeightRef.current = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    dragStartRef.current = e.touches[0].clientY;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    cancelAnimationFrame(frameRef.current);
    
    frameRef.current = requestAnimationFrame(() => {
      const currentY = e.touches[0].clientY;
      const offset = currentY - dragStartRef.current;
      setDragOffset(offset);
    });
  }, [isDragging, disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    const thresholdPx = windowHeightRef.current * threshold;
    if (Math.abs(dragOffset) > thresholdPx && onSwipe) {
      onSwipe(dragOffset > 0 ? 'down' : 'up');
    }
    
    cancelAnimationFrame(frameRef.current);
    requestAnimationFrame(() => setDragOffset(0));
  }, [isDragging, disabled, dragOffset, threshold, onSwipe]);

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return {
    isDragging,
    dragOffset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
