// Web Worker for heavy computations
/// <reference lib="webworker" />

// Message types for type safety
type ShuffleRequest = {
  type: 'SHUFFLE_CARDS';
  payload: {
    cards: unknown[];
  };
};

type AnswerRequest = {
  type: 'CHECK_ANSWER';
  payload: {
    input: string;
    expected: string;
  };
};

type WorkerMessage = ShuffleRequest | AnswerRequest;

type ShuffleResponse = {
  type: 'SHUFFLED_CARDS';
  payload: unknown[];
};

type AnswerResponse = {
  type: 'ANSWER_RESULT';
  payload: { isCorrect: boolean };
};

type WorkerResponse = ShuffleResponse | AnswerResponse;



// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Helper function to normalize Japanese text
function normalizeJapaneseText(text: string): string {
  return text
    .normalize('NFKC')
    .trim()
    .replace(/[〜～〰\u301c\uff5e\u3030～〜〰]/g, '~')
    .replace(/\s+/g, '')
    .replace(/[\u2012-\u2015]/g, '~');
}

// Add a console log at the very start to confirm worker is loaded
console.log('Kanji worker initialized');

// Handle messages
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  try {
    console.log('Worker received raw event:', event);
    const { type, payload } = event.data;
    console.log('Worker received message:', { type, payload });

    switch (type) {
      case 'SHUFFLE_CARDS':
        if (payload.cards) {
          const shuffledCards = shuffleArray(payload.cards);
          const response: WorkerResponse = { type: 'SHUFFLED_CARDS', payload: shuffledCards };
          console.log('Worker sending shuffle response:', response);
          self.postMessage(response);
        } else {
          console.error('Worker received SHUFFLE_CARDS but missing cards:', payload);
        }
        break;

      case 'CHECK_ANSWER':
        if (payload.input && payload.expected) {
          console.log('Worker checking answer:', { input: payload.input, expected: payload.expected });
          const normalizedInput = normalizeJapaneseText(payload.input);
          const normalizedExpected = normalizeJapaneseText(payload.expected);
          const isCorrect = normalizedInput === normalizedExpected;
          console.log('Worker check result:', { normalizedInput, normalizedExpected, isCorrect });
          const response: WorkerResponse = { type: 'ANSWER_RESULT', payload: { isCorrect } };
          console.log('Worker sending answer response:', response);
          self.postMessage(response);
        } else {
          console.error('Worker received CHECK_ANSWER but missing input or expected:', payload);
          self.postMessage({ type: 'ANSWER_RESULT', payload: { isCorrect: false } });
        }
        break;

      default:
        console.error('Unknown message type:', type);
        if (type === 'CHECK_ANSWER') {
          self.postMessage({ type: 'ANSWER_RESULT', payload: { isCorrect: false } });
        }
    }
  } catch (error) {
    console.error('Worker error processing message:', error);
    self.postMessage({ type: 'ANSWER_RESULT', payload: { isCorrect: false } });
  }
};
