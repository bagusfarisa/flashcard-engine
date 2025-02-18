import { KanjiCard } from '../data/kanjiData';

// Functions to handle progress data serialization
interface ProgressData {
  answeredCards: number[];
  swipedCards: number[];
  cardQueue: Array<{
    id: number;
    word: string;  // Changed from kanji
    meaning: string;
    answer: string;
    tags: string[];
  }>;
}

function serializeProgress(progress: Record<string, {
  answeredCards: Set<number>;
  swipedCards: Set<number>;
  cardQueue: KanjiCard[];
}>): Record<string, ProgressData> {
  return Object.fromEntries(
    Object.entries(progress).map(([tag, data]) => [
      tag,
      {
        answeredCards: Array.from(data.answeredCards),
        swipedCards: Array.from(data.swipedCards),
        cardQueue: data.cardQueue.map(card => ({
          id: card.id,
          word: card.word,  // Changed from kanji
          meaning: card.meaning,
          answer: card.answer,
          tags: card.tags
        }))
      }
    ])
  );
}

function deserializeProgress(
  data: Record<string, ProgressData>,
  cardsMap: Map<number, KanjiCard>
): Record<string, {
  answeredCards: Set<number>;
  swipedCards: Set<number>;
  cardQueue: KanjiCard[];
}> {
  return Object.fromEntries(
    Object.entries(data).map(([tag, progress]) => [
      tag,
      {
        answeredCards: new Set(progress.answeredCards),
        swipedCards: new Set(progress.swipedCards),
        cardQueue: progress.cardQueue
          .map(card => cardsMap.get(card.id))
          .filter((card): card is KanjiCard => card !== undefined)
      }
    ])
  );
}

// Export both functions for use in KanjiCardContainer
export { serializeProgress, deserializeProgress };
