import { motion } from 'framer-motion';
import { useState } from 'react';

interface QuizResult {
  date: string;
  score: number;
  total: number;
  percentage: number;
  deckSize: number;
}

interface ScoreModalProps {
  score: number;
  total: number;
  onClose: () => void;
  previousResults?: QuizResult[];
}

export default function ScoreModal({ score, total, onClose, previousResults = [] }: ScoreModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full"
      >
        <h2 className="text-3xl font-bold mb-4 text-center">Quiz Complete!</h2>
        <div className="text-6xl font-bold text-blue-500 mb-6 text-center">
          {percentage}%
        </div>
        <p className="text-lg text-gray-600 mb-8 text-center">
          You got {score} out of {total} correct!
        </p>
        {previousResults.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between"
            >
              <span className="text-gray-700">Previous Attempts</span>
              <span className="text-gray-400">
                {showHistory ? '▼' : '▶'}
              </span>
            </button>
            
            {showHistory && (
              <div className="mt-4 space-y-2">
                {previousResults.slice().reverse().map((result, index) => (
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
            )}
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg text-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}