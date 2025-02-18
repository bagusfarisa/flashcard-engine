import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTopKanjiStats } from '@/utils/statisticsUtils';
import type { KanjiStats } from '@/utils/statisticsUtils';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_QUIZ_REQUIRED = 5;

interface QuizHistoryItem {
  date: string;
  score: number;
  total: number;
  percentage: number;
  deckSize: number;
}

export default function StatsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [stats, setStats] = useState<{ correct: KanjiStats[], incorrect: KanjiStats[] }>({ correct: [], incorrect: [] });
  const [mounted, setMounted] = useState(false);
  const [quizCount, setQuizCount] = useState(0);
  const [totalStats, setTotalStats] = useState<{ correctKanji: number; totalAnswered: number } | null>(null);

  const updateStats = useCallback(() => {
    const newStats = getTopKanjiStats();
    setStats(newStats);

    // Calculate total correct kanji from stats
    const storedStats = localStorage.getItem('kanjiStats');
    if (storedStats) {
      const allStats = JSON.parse(storedStats) as Record<string, KanjiStats>;
      const totals = Object.values(allStats).reduce<{ correctKanji: number; totalAnswered: number }>((acc, stat) => {
        if (stat.totalAttempts > 0) {
          acc.totalAnswered++;
          if (stat.accuracy >= 50) { // Consider kanji "learned" if accuracy is 50% or higher
            acc.correctKanji++;
          }
        }
        return acc;
      }, { correctKanji: 0, totalAnswered: 0 });
      
      setTotalStats(totals);
    }

    // Get quiz count
    const savedHistory = localStorage.getItem('quizHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory) as QuizHistoryItem[];
      setQuizCount(history.length);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen, updateStats]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Kanji Statistics</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {quizCount < MIN_QUIZ_REQUIRED ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-6">📊</div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">Statistics Locked</h3>
                <p className="text-gray-600 mb-6">
                  Complete {MIN_QUIZ_REQUIRED} quizzes to unlock statistics and track your progress.
                </p>
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(quizCount / MIN_QUIZ_REQUIRED) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {quizCount} of {MIN_QUIZ_REQUIRED} quizzes completed
                  </p>
                </div>
              </div>
            ) : (
              <>
                {totalStats && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Overall Progress</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-blue-700">{totalStats.correctKanji} <span className="text-lg">kanji</span></div>
                      <div className="text-sm text-gray-600">
                        {Math.round((totalStats.correctKanji / totalStats.totalAnswered) * 100)}% mastery rate
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Out of {totalStats.totalAnswered} kanji attempted
                    </div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-4">Best Performed</h3>
                    <div className="space-y-2">
                      {stats.correct.map((stat) => (
                        <div key={stat.word} className="p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="text-2xl">{stat.word}</div>
                            <div className="text-green-600 font-medium">
                              {stat.accuracy.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>{stat.meaning}</span>
                            <span className="mx-2">•</span>
                            <span>{stat.answer}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Correct: {stat.correctCount} / Total: {stat.totalAttempts}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Needs Improvement</h3>
                    <div className="space-y-2">
                      {stats.incorrect.map((stat) => (
                        <div key={stat.word} className="p-3 bg-red-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="text-2xl">{stat.word}</div>
                            <div className="text-red-600 font-medium">
                              {stat.accuracy.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>{stat.meaning}</span>
                            <span className="mx-2">•</span>
                            <span>{stat.answer}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Incorrect: {stat.incorrectCount} / Total: {stat.totalAttempts}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
