import { useState } from 'react';
import { motion } from 'framer-motion';
import { KanjiCard as KanjiCardType } from '../data/kanjiData';
import { updateKanjiStats } from '@/utils/statisticsUtils';

interface QuizCardProps {
  card: KanjiCardType;
  options: string[];
  onAnswer: (isCorrect: boolean) => void;
}

const QuizCard = ({ card, options: initialOptions, onAnswer }: QuizCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [options] = useState(initialOptions);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    const isCorrect = option === card.answer;
    setSelectedAnswer(option);
    setIsAnswered(true);
    updateKanjiStats(card, isCorrect);
    onAnswer(isCorrect);
  };

  const toggleSentenceMeaning = () => {
    setShowMeaning(prev => !prev);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 mb-8"
    >
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{card.word}</div>
        {/* Debug check */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400">
            Debug: {card.sentence_example ? 'Has example' : 'No example'}
          </div>
        )}
        {/* Example sentence section with improved visibility */}
        {card.sentence_example && (
          <div className="mt-4 block">
            <button 
              onClick={toggleSentenceMeaning}
              className="group w-full text-lg text-gray-700 hover:text-blue-600 transition-colors p-4 rounded-lg bg-gray-50 block"
            >
              <div className="font-medium mb-1">{card.sentence_example}</div>
              {showMeaning && card.sentence_meaning && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base text-gray-600 mt-2 border-t border-gray-200 pt-2"
                >
                  {card.sentence_meaning}
                </motion.div>
              )}
              <div className="text-xs text-blue-400 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                Tap to {showMeaning ? 'hide' : 'see'} translation
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Answer options section */}
      <div className="grid grid-cols-2 gap-4">
        {options.map(option => {
          const isCorrectAnswer = option === card.answer;
          const wasSelected = option === selectedAnswer;
          
          return (
            <motion.button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={isAnswered}
              className={`p-4 text-lg rounded-lg transition-colors duration-200 ${
                isAnswered
                  ? isCorrectAnswer
                    ? 'bg-green-500 text-white'
                    : wasSelected
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
              animate={isAnswered ? {
                scale: isCorrectAnswer || wasSelected ? [1, 1.05, 1] : 1,
                transition: { duration: 0.3 }
              } : {}}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuizCard;
