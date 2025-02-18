import { KanjiCard } from '@/data/kanjiData';

export interface KanjiStats {
  word: string; // Changed from kanji
  meaning: string;
  answer: string;
  correctCount: number;
  incorrectCount: number;
  totalAttempts: number;
  accuracy: number;
}

const STATS_STORAGE_KEY = 'kanjiStats';

export function updateKanjiStats(card: KanjiCard, isCorrect: boolean) {
  try {
    const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
    const stats: Record<string, KanjiStats> = storedStats ? JSON.parse(storedStats) : {};
    
    if (!stats[card.word]) { // Changed from kanji
      stats[card.word] = { // Changed from kanji
        word: card.word, // Changed from kanji
        meaning: card.meaning,
        answer: card.answer,
        correctCount: 0,
        incorrectCount: 0,
        totalAttempts: 0,
        accuracy: 0
      };
    }
    
    const kanjiStat = stats[card.word]; // Changed from kanji
    if (isCorrect) {
      kanjiStat.correctCount++;
    } else {
      kanjiStat.incorrectCount++;
    }
    kanjiStat.totalAttempts++;
    kanjiStat.accuracy = (kanjiStat.correctCount / kanjiStat.totalAttempts) * 100;
    
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating kanji stats:', error);
  }
}

export function getTopKanjiStats(limit: number = 7): { correct: KanjiStats[], incorrect: KanjiStats[] } {
  try {
    const storedStats = localStorage.getItem(STATS_STORAGE_KEY);
    if (!storedStats) {
      return { correct: [], incorrect: [] };
    }

    const stats: Record<string, KanjiStats> = JSON.parse(storedStats);
    const statsList = Object.values(stats)
      .filter(stat => stat.totalAttempts > 0); // Only include attempted kanji

    const correct = [...statsList]
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit);

    const incorrect = [...statsList]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, limit);

    return { correct, incorrect };
  } catch (error) {
    console.error('Error getting kanji stats:', error);
    return { correct: [], incorrect: [] };
  }
}
