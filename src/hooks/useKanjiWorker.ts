import { useEffect, useCallback, useRef } from 'react';
import type { KanjiCard } from '@/data/kanjiData';

interface ShuffleRequest {
  type: 'SHUFFLE_CARDS';
  payload: {
    cards: KanjiCard[];
  };
}

interface ShuffleResponse {
  type: 'SHUFFLED_CARDS';
  payload: KanjiCard[];
}

export function useKanjiWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return;
    }

    // Only create the worker in the browser
    if (!workerRef.current && 'Worker' in window) {
      console.log('Creating new Web Worker');
      try {
        const workerUrl = new URL('../workers/kanjiWorker.ts', import.meta.url);
        console.log('Worker URL:', workerUrl.toString());
        workerRef.current = new Worker(workerUrl);
        console.log('Web Worker created successfully');

        // Test the worker
        const testHandler = ((event: MessageEvent) => {
          console.log('Test message received:', event.data);
          workerRef.current?.removeEventListener('message', testHandler);
        }) as EventListener;

        workerRef.current.addEventListener('message', testHandler);
        workerRef.current.addEventListener('error', (error) => {
          console.error('Worker error:', error);
        });

        console.log('Sending test message to worker');
        workerRef.current.postMessage({
          type: 'CHECK_ANSWER',
          payload: { input: 'test', expected: 'test' }
        });
      } catch (error) {
        console.error('Error creating Web Worker:', error);
      }
    } else {
      console.log('Worker status:', {
        exists: !!workerRef.current,
        workerSupported: 'Worker' in window
      });
    }

    return () => {
      if (workerRef.current) {
        console.log('Terminating Web Worker');
        workerRef.current.terminate();
      }
    };
  }, []);

  const shuffleCards = useCallback((cards: KanjiCard[]): Promise<KanjiCard[]> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        // Fallback if worker is not available
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        resolve(shuffled);
        return;
      }

      const handler = ((event: MessageEvent<ShuffleResponse>) => {
        workerRef.current?.removeEventListener('message', handler);
        resolve(event.data.payload);
      }) as EventListener;

      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({
        type: 'SHUFFLE_CARDS',
        payload: { cards },
      } as ShuffleRequest);
    });
  }, []);

  // Normalize Japanese text including various types of tilde characters
  const normalizeJapaneseText = (text: string): string => {
    return text
      .normalize('NFKC')
      .trim()
      // Normalize various types of tilde characters to a standard tilde
      .replace(/[〜〰～]|[\u2012-\u2015]/g, '~');
  };

  const checkAnswer = useCallback((input: string, expected: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Use direct comparison with full normalization
      const normalizedInput = normalizeJapaneseText(input);
      const normalizedExpected = normalizeJapaneseText(expected);
      const result = normalizedInput === normalizedExpected;
      resolve(result);
    });
  }, []);

  return {
    shuffleCards,
    checkAnswer,
  };
}
