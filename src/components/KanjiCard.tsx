import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanjiCard as KanjiCardType } from '../data/kanjiData';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { debounce } from '@/utils/debounce';
import { useKanjiWorker } from '@/hooks/useKanjiWorker';
import '@/styles/performance.css';

interface KanjiCardProps {
  card: KanjiCardType;
  isActive: boolean;
  onCorrectAnswer: () => void;
  isAnswered: boolean;
  showMeaning: boolean;
  showReading: boolean;
  showSentence: boolean;
}

// Memoize spring animations
const CARD_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 25
};

const BACKGROUND_TRANSITION = {
  duration: 0.6,
  times: [0, 0.1, 0.6, 1],
  ease: 'easeInOut'
};

const INPUT_TRANSITION = { duration: 0.2 };

function KanjiCard({ 
  card, 
  isActive, 
  onCorrectAnswer, 
  isAnswered, 
  showMeaning, 
  showReading,
  showSentence,
  onInputFocus, 
  isInputFocused 
}: KanjiCardProps & { 
  onInputFocus: (focused: boolean) => void, 
  isInputFocused: boolean 
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | undefined>(undefined);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const { checkAnswer } = useKanjiWorker();
  
  // Memoize input handler
  const debouncedSetUserInput = useMemo(
    () => debounce(setUserInput, 150),
    []
  );

  const resetState = useCallback(() => {
    setUserInput('');
    setIsCorrect(undefined);
    setShowAnswer(false);
  }, []);

  useEffect(() => {
    if (!isActive) {
      resetState();
    }
  }, [isActive, resetState]);

  // Handle input focus with passive event listener
  useEffect(() => {
    if (isInputFocused && isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputFocused, isActive]);

  // Memoize card style
  const cardStyle = useMemo(() => ({
    scale: isActive ? 1 : 0.9,
    opacity: isActive ? 1 : 0.5,
    backgroundColor: isCorrect ? ['#ffffff', '#4ade80', '#4ade80', '#ffffff'] : '#ffffff'
  }), [isActive, isCorrect]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!card?.answer || !userInput.trim()) return;
    
    try {
      const isAnswerCorrect = await checkAnswer(userInput.trim(), card.answer);
      setIsCorrect(isAnswerCorrect);
      
      if (isAnswerCorrect) {
        onCorrectAnswer();
        onInputFocus(false);
        setTimeout(() => setShowAnswer(true), 700);
      } else {
        setTimeout(() => setIsCorrect(undefined), 1500);
        setUserInput('');
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      setIsCorrect(false);
      setTimeout(() => setIsCorrect(undefined), 1500);
    }
  }, [card, userInput, checkAnswer, onCorrectAnswer, onInputFocus]);

  if (!card) return null;

  const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

  return (
    <motion.div
      className={`kanji-card w-full h-[80vh] min-h-[400px] max-h-[600px] relative p-2 sm:p-8 flex flex-col overflow-hidden bg-white ${
        isAnswered ? 'border-l-4 border-green-500' : ''
      } ${isActive ? 'opacity-100' : 'opacity-50'}`}
      style={{ 
        height: 'var(--vvh)',
        contain: 'layout style paint',
        willChange: 'transform, opacity'
      }}
      initial={false}
      animate={cardStyle}
      transition={{ 
        ...CARD_SPRING,
        backgroundColor: BACKGROUND_TRANSITION
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center sm:justify-start sm:mt-24 space-y-3 sm:space-y-6 py-0 sm:py-6 z-10">
        <motion.div 
          className="text-5xl sm:text-6xl font-semibold mb-0 sm:mb-3 select-text"
          initial={false}
          animate={{ scale: isActive ? 1 : 0.9 }}
          transition={CARD_SPRING}
        >
          {card.word}
        </motion.div>
        
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {showMeaning && (
              <motion.div 
                key="meaning"
                className="text-lg sm:text-xl font-medium text-gray-700 select-text text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: isActive ? 1 : 0, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={INPUT_TRANSITION}
              >
                {card.meaning}
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {showReading && (
              <motion.div 
                key="answer"
                className="text-lg sm:text-lg font-medium text-blue-600 select-text text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: isActive ? 1 : 0, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={INPUT_TRANSITION}
              >
                {card.answer}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add sentence examples when showing meaning */}
          <AnimatePresence mode="wait">
            {showSentence && card.sentence_example && (
              <motion.div 
                key="sentence"
                className="mt-4 space-y-2 text-sm sm:text-base text-gray-600 select-text text-center max-w-lg mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: isActive ? 1 : 0, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={INPUT_TRANSITION}
              >
                <div className="font-medium">{card.sentence_example}</div>
                {card.sentence_meaning && (
                  <div className="text-gray-500 italic">{card.sentence_meaning}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed sm:relative bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none px-2 sm:px-2 pb-2 sm:pb-safe pt-2 sm:pt-12 sm:p-0 border-t border-gray-200 sm:border-t-0 shadow-sm sm:shadow-none z-20">
        <AnimatePresence mode="wait">
          {!showAnswer ? (
            <motion.form
              key="input-form"
              className="w-full max-w-md mx-auto"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={INPUT_TRANSITION}
            >
              {DEBUG_MODE && isActive && (
                <div className="text-xs text-gray-500 mb-2 text-center">
                  <div>Input: {userInput}</div>
                  <div>Expected: {card.answer}</div>
                </div>
              )}
              <div className="relative flex space-x-2 w-full mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => debouncedSetUserInput(e.target.value)}
                  onFocus={() => onInputFocus(true)}
                  onBlur={() => onInputFocus(false)}
                  className={`flex-1 w-full px-3 py-2 text-base sm:text-lg border-2 rounded-lg outline-none transition-colors duration-200 ${
                    isCorrect === true
                      ? 'border-green-500 bg-green-50'
                      : isCorrect === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Type the answer"
                  disabled={!isActive}
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  type="submit"
                  disabled={!isActive || !userInput.trim()}
                  className={`shrink-0 px-3 sm:px-4 py-2 text-white text-base sm:text-base font-medium rounded-lg transition-all duration-200 ${
                    !isActive || !userInput.trim() 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  Check
                </button>
                <AnimatePresence>
                  {isCorrect !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={INPUT_TRANSITION}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {isCorrect ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="answer-display"
              className="text-center text-lg font-medium text-green-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={INPUT_TRANSITION}
            >
              Correct! 🎉
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Add display name and memoize the component
KanjiCard.displayName = 'KanjiCard';
export default memo(KanjiCard);
