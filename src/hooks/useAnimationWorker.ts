import { useEffect, useRef, useCallback } from 'react';

type CardPosition = {
  y: number;
  zIndex: number;
};

type WorkerResponse = {
  type: 'CARD_POSITIONS_CALCULATED';
  payload: [number, CardPosition][];
};

export function useAnimationWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      workerRef.current = new Worker(new URL('../workers/animationWorker.ts', import.meta.url));

      return () => {
        workerRef.current?.terminate();
      };
    }
  }, []);

  const calculateCardPositions = useCallback((
    currentIndex: number,
    windowHeight: number,
    manualDragOffset: number,
    isManualDragging: boolean
  ): Promise<Map<number, CardPosition>> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        // Fallback calculation if worker is not available
        const positions = new Map<number, CardPosition>();
        positions.set(currentIndex, {
          y: isManualDragging ? -manualDragOffset : 0,
          zIndex: 2
        });
        positions.set(currentIndex + 1, {
          y: isManualDragging ? Math.max(windowHeight - manualDragOffset, 0) : windowHeight,
          zIndex: 1
        });
        resolve(positions);
        return;
      }

      const handler = (event: MessageEvent<WorkerResponse>) => {
        workerRef.current?.removeEventListener('message', handler);
        resolve(new Map(event.data.payload));
      };

      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({
        type: 'CALCULATE_CARD_POSITIONS',
        payload: {
          currentIndex,
          windowHeight,
          manualDragOffset,
          isManualDragging
        }
      });
    });
  }, []);

  return { calculateCardPositions };
}