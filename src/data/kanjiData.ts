import { mergeKanjiData } from '../utils/mergeKanjiData';

export interface KanjiCard {
  id: number;
  word: string;  // Changed from kanji to word
  meaning: string;
  answer: string;
  tags: string[];
  column5?: string; // New optional column
  column6?: string; // New optional column
  sentence_example?: string;
  sentence_meaning?: string;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ("")
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  return values;
}

async function parseCSV(text: string): Promise<KanjiCard[]> {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const cards: KanjiCard[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 4) { // At least id, word, meaning, answer needed
      const [id, word, meaning, answer, tag, sentence_example, sentence_meaning] = values;
      cards.push({
        id: parseInt(id),
        word, // Changed from kanji to word
        meaning,
        answer,
        tags: [tag.trim()],
        sentence_example: sentence_example ? sentence_example.trim() : undefined,
        sentence_meaning: sentence_meaning ? sentence_meaning.trim() : undefined
      });
    }
  }
  
  return cards;
}

// Progress migration utility
export function migrateProgressData(cards: KanjiCard[]) {
  const STORAGE_VERSION_KEY = 'kantoku_progress_version';
  const CURRENT_VERSION = '1.0.0';
  
  // Check if migration is needed
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion === CURRENT_VERSION) return;

  try {
    // Get existing progress and cards
    const progressByTag = JSON.parse(localStorage.getItem('progressByTag') || '{}');
    const existingCards = JSON.parse(localStorage.getItem('kanjiCards') || '[]') as KanjiCard[];
    const newProgressByTag: Record<string, unknown> = {};

    // Build a map for quick lookups
    const cardMap = new Map(cards.map(card => [card.id, card]));
    const existingCardMap = new Map(existingCards.map(card => [card.id, card]));

    // Migrate progress for each existing tag
    Object.keys(progressByTag).forEach((tag) => {
      const tagProgress = progressByTag[tag] as {
        answeredCards?: number[];
        swipedCards?: number[];
        cardQueue?: KanjiCard[];
      };
      
      // Validate and update card IDs, preserving progress if card still exists
      const validAnsweredCards = tagProgress.answeredCards?.filter((cardId) => {
        const card = cardMap.get(cardId);
        const existingCard = existingCardMap.get(cardId);
        return (card && card.tags.includes(tag)) || (existingCard && existingCard.tags.includes(tag));
      }) || [];
      
      const validSwipedCards = tagProgress.swipedCards?.filter((cardId) => {
        const card = cardMap.get(cardId);
        const existingCard = existingCardMap.get(cardId);
        return (card && card.tags.includes(tag)) || (existingCard && existingCard.tags.includes(tag));
      }) || [];

      // Keep existing cardQueue if cards are still valid
      const validCardQueue = tagProgress.cardQueue?.filter(card => {
        const updatedCard = cardMap.get(card.id);
        const existingCard = existingCardMap.get(card.id);
        return (updatedCard && updatedCard.tags.includes(tag)) || (existingCard && existingCard.tags.includes(tag));
      });

      // Only update if we have valid progress data
      if (validAnsweredCards.length > 0 || validSwipedCards.length > 0 || (validCardQueue && validCardQueue.length > 0)) {
        newProgressByTag[tag] = {
          answeredCards: validAnsweredCards,
          swipedCards: validSwipedCards,
          cardQueue: validCardQueue || []
        };
      } else {
        // If no valid progress, keep the existing tag progress as is
        newProgressByTag[tag] = tagProgress;
      }
    });

    // Save migrated progress
    localStorage.setItem('progressByTag', JSON.stringify(newProgressByTag));
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);

    console.log('Progress data migrated successfully');
  } catch (error) {
    console.error('Error during progress migration:', error);
    // Don't throw, just log the error and continue
  }
}

// Initialize fetch immediately when module loads
const KANJI_CSV_PATH = '/dataset.csv';
let preloadedResponse: Promise<[Response, Response]> | null = null;
let cachedResponseText: string | undefined;
let pendingFetch: Promise<string> | null = null;

// Utility to safely read response text with caching
async function safelyReadResponse(mainResponse: Response, backupResponse: Response): Promise<string> {
  // If we already have a pending fetch, return that to avoid duplicate reads
  if (pendingFetch) {
    return pendingFetch;
  }

  // Create a new fetch promise
  pendingFetch = (async () => {
    try {
      // Try main response first
      const mainToRead = mainResponse.clone();
      return await mainToRead.text();
    } catch (error) {
      // If main fails, try backup
      console.warn('Main response read failed, trying backup:', error);
      const backupToRead = backupResponse.clone();
      return await backupToRead.text();
    } finally {
      // Clear the pending fetch once done
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

// Initialize the preload fetch in a self-executing function to ensure immediate execution
(() => {
  if (typeof window !== 'undefined') {
    const preloadLink = document.querySelector('link[rel="preload"][as="fetch"][href*="dataset.csv"]');

    if (preloadLink) {
      // Use preloaded response if available
      preloadedResponse = fetch(preloadLink.getAttribute('href') || KANJI_CSV_PATH)
        .then(response => {
          // Clone response immediately
          return [response.clone(), response.clone()] as [Response, Response];
        });
    } else {
      // Fallback to regular fetch if preload link not found
      preloadedResponse = fetch(KANJI_CSV_PATH, {
        cache: 'force-cache',
        headers: { 'Accept': 'text/csv' }
      }).then(response => {
        // Clone response immediately
        return [response.clone(), response.clone()] as [Response, Response];
      });
    }
  }
})();

export function getUniqueTags(cards: KanjiCard[]): string[] {
  const tagSet = new Set<string>();
  cards.forEach(card => {
    card.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

export async function loadKanjiCards(): Promise<KanjiCard[]> {
  try {
    console.log('Loading kanji data from:', KANJI_CSV_PATH);

    // Use cached text if available, otherwise fetch
    if (!cachedResponseText) {
      // Use preloaded responses or create new fetch
      const responses = await (preloadedResponse || fetch(KANJI_CSV_PATH, {
        cache: 'force-cache',
        headers: { 'Accept': 'text/csv' }
      }).then(response => [response.clone(), response.clone()] as [Response, Response]));

      const [response, backupResponse] = responses;

      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      }

      cachedResponseText = await safelyReadResponse(response, backupResponse);
    }
    
    if (!cachedResponseText || cachedResponseText.trim().length === 0) {
      throw new Error('CSV file is empty');
    }

    const newCards = await parseCSV(cachedResponseText);
    
    if (!newCards || newCards.length === 0) {
      throw new Error('No kanji cards were parsed');
    }

    // Get existing cards to merge progress
    const existingCardsRaw = localStorage.getItem('kanjiCards');
    const existingCards = existingCardsRaw ? JSON.parse(existingCardsRaw) : [];
    
    // Use mergeKanjiData to preserve progress and sentence examples
    const { mergedCards } = mergeKanjiData(existingCards, newCards);

    // Store the merged cards with sentence examples
    localStorage.setItem('kanjiCards', JSON.stringify(mergedCards));

    // Migrate progress data if needed
    if (typeof window !== 'undefined') {
      migrateProgressData(mergedCards);
    }

    console.log(`Successfully loaded ${mergedCards.length} kanji cards`);
    return mergedCards;

  } catch (error) {
    console.error('Error loading kanji data:', error);
    // Return fallback cards if available in localStorage, otherwise use default fallback
    const storedCards = localStorage.getItem('kanjiCards');
    return storedCards ? JSON.parse(storedCards) : fallbackKanjiCards;
  }
}

// Fallback data in case CSV loading fails
export const fallbackKanjiCards: KanjiCard[] = [
  {
    id: 1,
    word: "水",
    meaning: "water",
    answer: "みず",
    tags: ["JLPT N5"]
  },
  {
    id: 2,
    word: "火",
    meaning: "fire",
    answer: "ひ",
    tags: ["JLPT N5"]
  },
  {
    id: 3,
    word: "木",
    meaning: "tree",
    answer: "き",
    tags: ["JLPT N5"]
  },
  {
    id: 4,
    word: "金",
    meaning: "gold, money",
    answer: "きん",
    tags: ["JLPT N5"]
  },
  {
    id: 5,
    word: "土",
    meaning: "earth",
    answer: "つち",
    tags: ["JLPT N5"]
  },
  {
    id: 6,
    word: "日",
    meaning: "sun, day",
    answer: "ひ",
    tags: ["JLPT N5"]
  },
  {
    id: 7,
    word: "月",
    meaning: "moon, month",
    answer: "つき",
    tags: ["JLPT N5"]
  },
  {
    id: 8,
    word: "山",
    meaning: "mountain",
    answer: "やま",
    tags: ["JLPT N5"]
  },
  {
    id: 9,
    word: "川",
    meaning: "river",
    answer: "かわ",
    tags: ["JLPT N5"]
  },
  {
    id: 10,
    word: "雨",
    meaning: "rain",
    answer: "あめ",
    tags: ["JLPT N5"]
  },
  {
    id: 11,
    word: "風",
    meaning: "wind",
    answer: "かぜ",
    tags: ["JLPT N5"]
  },
  {
    id: 12,
    word: "空",
    meaning: "sky",
    answer: "そら",
    tags: ["JLPT N5"]
  },
  {
    id: 13,
    word: "花",
    meaning: "flower",
    answer: "はな",
    tags: ["JLPT N5"]
  },
  {
    id: 14,
    word: "雪",
    meaning: "snow",
    answer: "ゆき",
    tags: ["JLPT N5"]
  },
  {
    id: 15,
    word: "星",
    meaning: "star",
    answer: "ほし",
    tags: ["JLPT N5"]
  }
];

// Update kanji data without resetting progress
export async function updateKanjiData(): Promise<{success: boolean, message: string}> {
  try {
    // Force a fresh fetch instead of using cached response
    const response = await fetch(KANJI_CSV_PATH, {
      cache: 'reload', // Force reload to get fresh data
      headers: { 'Accept': 'text/csv' }
    });

    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
    }

    // Clone responses immediately
    const [mainResponse, backupResponse] = [response.clone(), response.clone()];

    cachedResponseText = await safelyReadResponse(mainResponse, backupResponse);
    
    if (!cachedResponseText || cachedResponseText.trim().length === 0) {
      throw new Error('CSV file is empty');
    }

    const updatedCards = await parseCSV(cachedResponseText);
    
    if (updatedCards.length === 0) {
      throw new Error('No cards parsed from CSV');
    }

    // Get current cards from localStorage
    const localCardsRaw = localStorage.getItem('kanjiCards');
    const localCards = localCardsRaw ? JSON.parse(localCardsRaw) : [];
    
    // Merge the updated data with local data using our utility
    const { mergedCards, isUpdated } = mergeKanjiData(localCards, updatedCards);
    
    if (isUpdated) {
      // Reset preloaded response to force fresh data on next load
      preloadedResponse = null;
      
      // Only update if there were actual changes
      localStorage.setItem('kanjiCards', JSON.stringify(mergedCards));
      
      // Make sure to migrate progress after update
      migrateProgressData(mergedCards);
      
      return { success: true, message: 'Kanji data updated successfully' };
    }
    
    return { success: true, message: 'Kanji data is already up to date' };
  } catch (error) {
    console.error('Error updating kanji data:', error);
    return { success: false, message: 'Failed to update kanji data: ' + (error instanceof Error ? error.message : String(error)) };
  }
}
