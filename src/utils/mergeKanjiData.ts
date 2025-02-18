import { KanjiCard } from '../data/kanjiData';

interface Progress {
  answeredCards: Set<number>;
  swipedCards: Set<number>;
  cardQueue: KanjiCard[];
}

interface SerializedProgress {
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

export function mergeKanjiData(existingCards: KanjiCard[], newCards: KanjiCard[]) {
  const mergedCards: KanjiCard[] = [];
  let isUpdated = false;

  // Create maps for faster lookups
  const existingCardMap = new Map(existingCards.map(card => [card.id, card]));
  const newCardMap = new Map(newCards.map(card => [card.id, card]));

  // Process all cards from both sets
  const allIds = new Set([...existingCardMap.keys(), ...newCardMap.keys()]);

  allIds.forEach(id => {
    const existingCard = existingCardMap.get(id);
    const newCard = newCardMap.get(id);

    if (existingCard && newCard) {
      // Merge existing and new card data
      const mergedCard = {
        ...newCard,
        tags: Array.from(new Set([...existingCard.tags, ...newCard.tags])),
        sentence_example: newCard.sentence_example || existingCard.sentence_example,
        sentence_meaning: newCard.sentence_meaning || existingCard.sentence_meaning
      };

      // Check if anything changed
      if (JSON.stringify(mergedCard) !== JSON.stringify(existingCard)) {
        isUpdated = true;
      }

      mergedCards.push(mergedCard);
    } else if (newCard) {
      // Add new card
      mergedCards.push(newCard);
      isUpdated = true;
    } else if (existingCard) {
      // Keep existing card
      mergedCards.push(existingCard);
    }
  });

  return {
    mergedCards: mergedCards.sort((a, b) => a.id - b.id),
    isUpdated
  };
}

export function serializeProgressData(progress: Progress): SerializedProgress {
  return {
    answeredCards: Array.from(progress.answeredCards),
    swipedCards: Array.from(progress.swipedCards),
    cardQueue: progress.cardQueue.map(card => ({
      id: card.id,
      word: card.word,  // Changed from kanji
      meaning: card.meaning,
      answer: card.answer,
      tags: card.tags
    }))
  };
}

export function deserializeProgressData(data: Partial<SerializedProgress>, cardsMap: Map<number, KanjiCard>): Progress {
  const answeredCards = new Set<number>(
    (data.answeredCards || [])
      .map(Number)
      .filter(id => !isNaN(id) && cardsMap.has(id))
  );

  const swipedCards = new Set<number>(
    (data.swipedCards || [])
      .map(Number)
      .filter(id => !isNaN(id) && cardsMap.has(id))
  );

  const cardQueue = Array.isArray(data.cardQueue)
    ? data.cardQueue
        .map((savedCard: SerializedProgress['cardQueue'][0]) => cardsMap.get(savedCard.id))
        .filter((card): card is KanjiCard => card !== undefined)
    : [];

  return {
    answeredCards,
    swipedCards,
    cardQueue
  };
}
