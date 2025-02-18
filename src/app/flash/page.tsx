'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import QuizCard from '@/components/QuizCard';
import ScoreModal from '@/components/ScoreModal';
import { KanjiCard as KanjiCardType } from '@/data/kanjiData';
import { shuffleArray } from '@/utils/arrayUtils';
import Link from 'next/link';
import StatsModal from '@/components/StatsModal';

const DECK_SIZES = [5, 10, 25, 50];
const MIN_CARDS_REQUIRED = 10;

interface TagProgress {
  answeredCards: number[];
  correctCount?: number;
  totalAttempts?: number;
}

interface Progress {
  [tag: string]: TagProgress;
}

// Helper function to get weighted cards based on performance
function getWeightedCards(cards: KanjiCardType[]): KanjiCardType[] {
  const storedStats = localStorage.getItem('kanjiStats');
  if (!storedStats) return shuffleArray([...cards]);

  const stats = JSON.parse(storedStats);
  
  // Weight cards based on accuracy - cards with lower accuracy get higher weight
  const weightedCards = cards.map(card => {
    const stat = stats[card.word];  // Changed from kanji to word
    if (!stat || stat.totalAttempts === 0) {
      // New cards get medium weight
      return { card, weight: 0.5 };
    }
    // Weight is inverse of accuracy (lower accuracy = higher weight)
    // Add 0.1 to ensure even 100% accuracy cards have a small chance
    const weight = 1 - (stat.accuracy / 100) + 0.1;
    return { card, weight };
  });

  // Sort by weight and apply some randomization while keeping weights relevant
  const sortedCards = weightedCards.sort((a, b) => b.weight - a.weight);
  
  // Take more cards from the higher weights but keep some randomization
  const selectedCards: KanjiCardType[] = [];
  const totalWeight = sortedCards.reduce((sum, item) => sum + item.weight, 0);
  
  while (selectedCards.length < cards.length) {
    const randomValue = Math.random() * totalWeight;
    let weightSum = 0;
    
    for (const item of sortedCards) {
      weightSum += item.weight;
      if (randomValue <= weightSum && !selectedCards.includes(item.card)) {
        selectedCards.push(item.card);
        break;
      }
    }
    
    // Fallback if no card was selected
    if (selectedCards.length === 0) {
      selectedCards.push(sortedCards[0].card);
    }
  }
  
  return selectedCards;
}

interface QuizResult {
  date: string;
  score: number;
  total: number;
  percentage: number;
  deckSize: number;
}

export default function Flash() {
  const [deckSize, setDeckSize] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [quizDeck, setQuizDeck] = useState<KanjiCardType[]>([]);
  const [allCards, setAllCards] = useState<KanjiCardType[]>([]);
  const [answeredCards, setAnsweredCards] = useState<KanjiCardType[]>([]);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Load quiz history
    const savedHistory = localStorage.getItem('quizHistory');
    if (savedHistory) {
      setQuizHistory(JSON.parse(savedHistory));
    }

    // Load cards and progress from localStorage
    const savedCards = localStorage.getItem('kanjiCards');
    const savedProgress = localStorage.getItem('progressByTag');
    
    if (savedCards && savedProgress) {
      const cards = JSON.parse(savedCards);
      const progress: Progress = JSON.parse(savedProgress);
      
      // Get all answered cards across all tags
      const answeredCardIds = new Set<number>();
      Object.values(progress).forEach((tagProgress: TagProgress) => {
        if (tagProgress.answeredCards) {
          tagProgress.answeredCards.forEach((id: number) => answeredCardIds.add(id));
        }
      });
      
      // Filter cards to only include correctly answered ones
      const answeredCardsArray = cards.filter((card: KanjiCardType) => answeredCardIds.has(card.id));
      setAnsweredCards(answeredCardsArray);
      setAllCards(answeredCardsArray);
    }
  }, []);

  const startQuiz = () => {
    if (!deckSize || allCards.length === 0) return;
    
    setShowStats(false); // Close stats modal if open
    // Use weighted selection instead of pure random
    const weightedCards = getWeightedCards([...allCards]);
    const selectedCards = weightedCards.slice(0, deckSize);
    setQuizDeck(selectedCards);
    setCurrentCardIndex(0);
    setScore(0);
    setIsPlaying(true);
  };

  const getAnswerOptions = (correctAnswer: string): string[] => {
    // Get all unique incorrect answers, excluding the correct one
    const incorrectAnswers = Array.from(new Set(
      allCards
        .filter(card => card.answer !== correctAnswer)
        .map(card => card.answer)
    ));
    
    // If we don't have enough unique distractors, duplicate some
    if (incorrectAnswers.length < 3) {
      while (incorrectAnswers.length < 3) {
        incorrectAnswers.push(incorrectAnswers[incorrectAnswers.length - 1]);
      }
    }
    
    const shuffledIncorrect = shuffleArray(incorrectAnswers);
    const options = [correctAnswer, ...shuffledIncorrect.slice(0, 3)];
    
    // Shuffle the final array of options
    return shuffleArray(options);
  };

  const saveQuizResult = (finalScore: number) => {
    const result: QuizResult = {
      date: new Date().toISOString(),
      score: finalScore,
      total: quizDeck.length,
      percentage: Math.round((finalScore / quizDeck.length) * 100),
      deckSize: quizDeck.length
    };

    const updatedHistory = [...quizHistory, result].slice(-10); // Keep last 10 results
    setQuizHistory(updatedHistory);
    localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Move to next card after a delay
    setTimeout(() => {
      if (currentCardIndex < quizDeck.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        // Quiz complete
        saveQuizResult(isCorrect ? score + 1 : score);
        setShowScoreModal(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setDeckSize(null);
    setIsPlaying(false);
    setScore(0);
    setCurrentCardIndex(0);
    setQuizDeck([]);
    setShowScoreModal(false);
  };

  // If there aren't enough answered cards, show the minimum requirement message
  if (answeredCards.length < MIN_CARDS_REQUIRED) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Enough Cards Yet!</h2>
          <p className="text-gray-600 mb-8">
            You need to correctly answer at least {MIN_CARDS_REQUIRED} cards in Chill mode before taking the quiz.
            <br />
            <br />
            Current progress: <span className="font-bold">{answeredCards.length}/{MIN_CARDS_REQUIRED}</span> cards
          </p>
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-lg text-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
          >
            Go to Chill Mode
          </Link>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">⚡ Flash Quiz</h1>
            <button
              onClick={() => setShowStats(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Statistics
            </button>
          </div>
          
          <div className="text-gray-600 mb-6 text-center">
            Quiz from <span className="font-bold">{answeredCards.length} kanji</span> you completed on Chill mode
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Select deck size:</h2>
            <div className="grid grid-cols-2 gap-4">
              {DECK_SIZES.filter(size => size <= answeredCards.length).map(size => (
                <button
                  key={size}
                  onClick={() => setDeckSize(size)}
                  className={`p-4 rounded-lg transition-colors duration-200 ${
                    deckSize === size
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {size} cards
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={!deckSize}
            className={`w-full py-3 rounded-lg text-lg font-medium transition-colors duration-200 ${
              deckSize
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Start Quiz
          </button>

          {quizHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Previous sessions</h3>
                <div className="text-sm text-gray-600">
                  Average performance: {Math.round(quizHistory.reduce((acc, result) => acc + result.percentage, 0) / quizHistory.length)}%
                </div>
              </div>
              <div className="space-y-2">
                {quizHistory.slice().reverse().slice(0, 3).map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {new Date(result.date).toLocaleDateString()}
                      </span>
                      <span className="font-medium text-blue-500">
                        {result.percentage}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {result.score}/{result.total} ({result.deckSize} cards)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      </div>
    );
  }

  const currentCard = quizDeck[currentCardIndex];

  return (
    <div className="min-h-screen pt-16 flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
        <div>
          <div className="text-lg font-medium text-gray-600">
            Card {currentCardIndex + 1} of {quizDeck.length}
          </div>
          <div className="text-2xl font-bold text-blue-500">
            Score: {score}
          </div>
        </div>
        <button
          onClick={() => setShowStats(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Statistics
        </button>
      </div>

      <AnimatePresence mode="wait">
        <QuizCard
          key={currentCard.id}
          card={currentCard}
          options={getAnswerOptions(currentCard.answer)}
          onAnswer={handleAnswer}
        />
      </AnimatePresence>

      <button
        onClick={resetQuiz}
        className="mt-4 px-6 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200"
      >
        Quit Quiz
      </button>

      <AnimatePresence>
        {showScoreModal && (
          <ScoreModal
            score={score}
            total={quizDeck.length}
            onClose={resetQuiz}
            previousResults={quizHistory}
          />
        )}
      </AnimatePresence>

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}
