import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  jank: number;
}

export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    frameTime: 0,
    jank: 0
  });

  const framesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(performance.now());
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!window.requestAnimationFrame) return;

    const measurePerformance = () => {
      const now = performance.now();
      const frameTime = now - lastFrameRef.current;
      
      // Track frame times for FPS calculation
      framesRef.current.push(frameTime);
      if (framesRef.current.length > 60) {
        framesRef.current.shift();
      }

      // Calculate metrics
      const avgFrameTime = framesRef.current.reduce((a, b) => a + b, 0) / framesRef.current.length;
      const fps = 1000 / avgFrameTime;
      const jank = framesRef.current.filter(t => t > 16.67).length / framesRef.current.length;

      metricsRef.current = {
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime),
        jank: Math.round(jank * 100)
      };

      lastFrameRef.current = now;
      rafRef.current = requestAnimationFrame(measurePerformance);
    };

    rafRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return metricsRef.current;
}
