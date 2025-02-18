'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTouchInteraction } from '@/hooks/useTouchInteraction';
import { useVirtualization } from '@/hooks/useVirtualization';
import { useAnimationWorker } from '@/hooks/useAnimationWorker';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import '@/styles/performance.css';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Hint from './Hint';
import KanjiCard from './KanjiCard';
import ResetButton from './ResetButton';
import TagFilter from './TagFilter';
import CompletionModal from './CompletionModal';
import { loadKanjiCards, KanjiCard as KanjiCardType } from '../data/kanjiData';
import { shuffleArray } from '@/utils/arrayUtils';
import { serializeProgress, deserializeProgress } from '../utils/progressUtils';
import '@/app/globals.css';

// Memoize spring configs
const CARD_SPRING = {
  type: "spring",
  stiffness: 400, // Increased stiffness
  damping: 35,    // Adjusted damping
  mass: 1,        // Added mass property
  restDelta: 0.01 // Added rest delta for smoother finish
};

const KanjiCardContainer = () => {
  // Move state declarations to top and group related states
  const [uiState, setUiState] = useState({
    isInputFocused: false,
    showMeaning: true,
    showReading: false,
    showSentence: false,
    isLoading: true,
    windowHeight: 0
  });

  const [dragState, setDragState] = useState({
    isManualDragging: false,
    dragStart: 0,
    manualDragOffset: 0,
    dragVelocity: 0,
    lastDragTime: 0
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState('JLPT N5');
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  
  type ProgressType = {
    answeredCards: Set<number>;
    swipedCards: Set<number>;
    cardQueue: KanjiCardType[];
  };

  type ProgressByTagType = Record<string, ProgressType>;

  const [progressByTag, setProgressByTag] = useState<ProgressByTagType>(() => ({
    'JLPT N5': {
      answeredCards: new Set<number>(),
      swipedCards: new Set<number>(),
      cardQueue: []
    }
  }));

  // Memoize expensive computations
  const getCurrentProgress = useMemo(() => {
    const progress = progressByTag[selectedTag];
    if (!progress) {
      return {
        answeredCards: new Set<number>(),
        swipedCards: new Set<number>(),
        cardQueue: []
      };
    }
    return progress;
  }, [progressByTag, selectedTag]);

  const [kanjiCards, setKanjiCards] = useState<KanjiCardType[]>([]);

  // Add state for completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Load kanji cards
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const cards = await loadKanjiCards();
        if (isMounted) {
          // When updating cards, preserve the existing queue order if possible
          setKanjiCards(prevCards => {
            // If we had cards before, try to maintain their order
            if (prevCards.length > 0) {
              const cardMap = new Map(cards.map(card => [card.id, card]));
              // First, keep existing cards in their current order
              const preservedCards = prevCards
                .map(oldCard => cardMap.get(oldCard.id))
                .filter((card): card is KanjiCardType => card !== undefined);
              
              // Then add any new cards that weren't in the old list
              const newCards = cards.filter(card => !prevCards.some(old => old.id === card.id));
              
              return [...preservedCards, ...newCards];
            }
            return cards;
          });
        }
      } catch (error) {
        console.error('Error loading kanji cards:', error);
      } finally {
        if (isMounted) {
          setUiState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update progress when tag changes or cards load
  useEffect(() => {
    if (!kanjiCards.length) return;

    // Filter cards by selected tag
    const filteredCards = kanjiCards.filter(card => card.tags.includes(selectedTag));
    
    // Initialize or update progress for the current tag
    setProgressByTag(prev => {
      // Get existing progress for the tag
      const existingProgress = prev[selectedTag];

      // If we have existing progress, preserve it
      if (existingProgress) {
        // Only update if we don't have these cards in queue
        const hasAllCards = filteredCards.every(card => 
          existingProgress.cardQueue.some(qCard => qCard.id === card.id)
        );

        if (hasAllCards) {
          return prev;
        }

        // If cards have changed, update queue while preserving order of existing cards
        return {
          ...prev,
          [selectedTag]: {
            ...existingProgress,
            cardQueue: [...existingProgress.cardQueue, 
              ...filteredCards.filter(card => 
                !existingProgress.cardQueue.some(qCard => qCard.id === card.id)
              )]
          }
        };
      }

      // Initialize new progress for the tag with ordered cards
      return {
        ...prev,
        [selectedTag]: {
          answeredCards: new Set<number>(),
          swipedCards: new Set<number>(),
          cardQueue: filteredCards
        }
      };
    });
  }, [selectedTag, kanjiCards]);

  // Reset drag state when tag changes
  useEffect(() => {
    setDragState({
      isManualDragging: false,
      dragStart: 0,
      manualDragOffset: 0,
      dragVelocity: 0,
      lastDragTime: 0
    });
  }, [selectedTag]);

  const handleSwipe = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      setCurrentIndex(prev => prev + 1);
    }
  }, []);

  useTouchInteraction({
    threshold: 0.15,
    disabled: uiState.isInputFocused,
    onSwipe: handleSwipe
  });

  // Ensure progress is loaded only once and properly initialized
  useEffect(() => {
    let mounted = true;

    // Move loadPersistedState inside useEffect to avoid exhaustive deps warning
    const loadPersistedState = async () => {
      try {
        const savedTag = localStorage.getItem('selectedTag') || 'JLPT N5';
        const savedProgressByTag = localStorage.getItem('progressByTag');
        const savedSessionId = localStorage.getItem('sessionId');
        const cards = await loadKanjiCards();
        
        let progress: Record<string, {
          answeredCards: Set<number>;
          swipedCards: Set<number>;
          cardQueue: KanjiCardType[];
        }> = {};

        const isNewSession = savedSessionId !== sessionId;
        localStorage.setItem('sessionId', sessionId);

        if (savedProgressByTag) {
          const parsed = JSON.parse(savedProgressByTag);
          const cardsMap = new Map(cards.map(card => [card.id, card]));
          progress = deserializeProgress(parsed, cardsMap);
          
          // If this is a new session, shuffle all card queues
          if (isNewSession) {
            Object.keys(progress).forEach(tag => {
              const filteredCards = cards.filter(card => card.tags.includes(tag));
              progress[tag] = {
                ...progress[tag],
                cardQueue: shuffleArray(filteredCards)
              };
            });
          }
        }

        // Ensure all JLPT levels have initialized progress
        ['JLPT N5', 'JLPT N4', 'JLPT N3', 'JLPT N2', 'JLPT N1'].forEach(tag => {
          if (!progress[tag]) {
            const filteredCards = cards.filter(card => card.tags.includes(tag));
            progress[tag] = {
              answeredCards: new Set<number>(),
              swipedCards: new Set<number>(),
              cardQueue: shuffleArray(filteredCards)
            };
          }
        });
        
        // Ensure the progress is immediately saved after initialization
        localStorage.setItem('progressByTag', JSON.stringify(serializeProgress(progress)));
        
        return { progressByTag: progress, selectedTag: savedTag };
      } catch (error) {
        console.error('Error loading persisted state:', error);
        const cards = await loadKanjiCards();
        return {
          progressByTag: {
            'JLPT N5': {
              answeredCards: new Set<number>(),
              swipedCards: new Set<number>(),
              cardQueue: shuffleArray(cards.filter(card => card.tags.includes('JLPT N5')))
            }
          },
          selectedTag: 'JLPT N5'
        };
      }
    };

    const initializeProgress = async () => {
      try {
        const state = await loadPersistedState();
        if (!mounted) return;

        // First set the tag to ensure proper card filtering
        setSelectedTag(state.selectedTag);
        
        // Then set the progress state
        setProgressByTag(state.progressByTag);
        
        setUiState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error initializing progress:', error);
        if (!mounted) return;
        setUiState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeProgress();

    return () => {
      mounted = false;
    };
  }, [sessionId]); // Add sessionId to dependency array

  // Save states to localStorage
  useEffect(() => {
    if (Object.keys(progressByTag).length > 0) {
      try {
        // Save the selected tag separately
        localStorage.setItem('selectedTag', selectedTag);

        // Prepare progress data for serialization
        const serializedProgress = Object.fromEntries(
          Object.entries(progressByTag).map(([tag, progress]) => {
            // Convert Set objects to arrays
            const answeredCards = Array.from(progress.answeredCards);
            const swipedCards = Array.from(progress.swipedCards);
            
            return [
              tag,
              {
                answeredCards,
                swipedCards,
                // Store minimal card data to prevent circular references
                cardQueue: progress.cardQueue.map(card => ({
                  id: card.id,
                  word: card.word,
                  meaning: card.meaning,
                  answer: card.answer,
                  tags: card.tags
                }))
              }
            ];
          })
        );

        localStorage.setItem('progressByTag', JSON.stringify(serializedProgress));
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  }, [progressByTag, selectedTag]);

  // Get current progress for selected tag
  const { cardQueue, swipedCards, answeredCards } = getCurrentProgress;

  // Filter out answered and swiped cards
  const filteredCards = useMemo(() => {
    return cardQueue.filter(card => !swipedCards.has(card.id));
  }, [cardQueue, swipedCards]);

  // Handle tag change
  useEffect(() => {
    localStorage.setItem('selectedTag', selectedTag);
    setCurrentIndex(0);
  }, [selectedTag]);

  // Debug card states
  useEffect(() => {
    const waterCard = cardQueue.find(card => card.word === '水');
    if (waterCard) {
      console.log('Water card state:', {
        id: waterCard.id,
        isAnswered: answeredCards.has(waterCard.id),
        isSwiped: swipedCards.has(waterCard.id),
        isVisible: filteredCards.some(card => card.id === waterCard.id)
      });
    }
  }, [cardQueue, answeredCards, swipedCards, filteredCards]);

  // Find the first non-swiped card index
  const findFirstNonSwipedIndex = useCallback(() => {
    const firstNonSwiped = filteredCards.findIndex(card => !swipedCards.has(card.id));
    return firstNonSwiped >= 0 ? firstNonSwiped : 0;
  }, [filteredCards, swipedCards]); // These dependencies are required as they're used in the callback

  const { calculateCardPositions } = useAnimationWorker();
  const metrics = usePerformanceMonitor();

  // Use virtualization to render only visible cards
  const { visibleIndices } = useVirtualization({
    itemCount: filteredCards.length,
    visibleItems: 2,
    currentIndex
  });

  // Optimize card style calculation with worker
  const [cardStyles, setCardStyles] = useState<Map<number, { zIndex: number; y: number }>>(new Map());

  useEffect(() => {
    const updateStyles = async () => {
      if (typeof window === 'undefined') return;
      
      const positions = await calculateCardPositions(
        currentIndex,
        uiState.windowHeight,
        dragState.manualDragOffset,
        dragState.isManualDragging
      );

      setCardStyles(positions);
    };

    updateStyles();
  }, [currentIndex, dragState.manualDragOffset, dragState.isManualDragging, uiState.windowHeight, calculateCardPositions]);

  const getCardStyle = useCallback((index: number) => {
    const position = cardStyles.get(index);
    if (!position) {
      return {
        zIndex: 0,
        y: index < currentIndex ? -uiState.windowHeight : uiState.windowHeight
      };
    }
    return position;
  }, [cardStyles, currentIndex, uiState.windowHeight]);

  // Debug performance metrics
  useEffect(() => {
    if (metrics.jank > 5) {
      console.warn('Performance degradation detected:', metrics);
    }
  }, [metrics]);

  // Event handlers
  const handleManualDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (window.getSelection()?.toString() || uiState.isInputFocused) return;
  
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragState(prev => ({
      ...prev,
      isManualDragging: true,
      dragStart: startY,
      manualDragOffset: 0, // Reset offset on drag start
      lastDragTime: Date.now(),
      dragVelocity: 0
    }));
  }, [uiState.isInputFocused]);
  
  const handleManualDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.isManualDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging
  
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const offset = dragState.dragStart - currentY;
    const now = Date.now();
    const timeDiff = now - dragState.lastDragTime;
  
    let velocity = dragState.dragVelocity;
    if (timeDiff > 0) {
      // Calculate velocity with more weight on recent movement
      velocity = 0.7 * (offset - dragState.manualDragOffset) / timeDiff + 0.3 * dragState.dragVelocity;
    }
  
    setDragState(prev => ({
      ...prev,
      dragVelocity: velocity,
      lastDragTime: now,
      manualDragOffset: offset
    }));
  }, [dragState.isManualDragging, dragState.dragStart, dragState.lastDragTime, dragState.manualDragOffset, dragState.dragVelocity]);
  
  const handleManualDragEnd = useCallback(() => {
    if (!dragState.isManualDragging) return;
  
    const velocityThreshold = 0.15; // Lower threshold for more responsive swipes
    const minSwipeDistance = window.innerHeight * 0.15; // 15% of screen height
    
    const isSwipe = Math.abs(dragState.manualDragOffset) > minSwipeDistance || 
                   Math.abs(dragState.dragVelocity) > velocityThreshold;
  
    if (isSwipe) {
      const currentCard = filteredCards[currentIndex];
      if (dragState.manualDragOffset > 0) {
        // Swipe up - make it more decisive
        const nextIndex = currentIndex + 1;
        if (nextIndex >= filteredCards.length) {
          setCurrentIndex(findFirstNonSwipedIndex());
        } else {
          setCurrentIndex(nextIndex);
          if (currentCard && answeredCards.has(currentCard.id)) {
            // Immediately update the swiped cards to prevent stuck state
            setProgressByTag(prev => ({
              ...prev,
              [selectedTag]: {
                ...prev[selectedTag],
                swipedCards: new Set([...prev[selectedTag].swipedCards, currentCard.id])
              }
            }));
          }
        }
      } else if (dragState.manualDragOffset < 0 && currentIndex > 0) {
        // Swipe down
        const prevIndex = currentIndex - 1;
        const prevCard = filteredCards[prevIndex];
        if (prevCard) {
          setCurrentIndex(prevIndex);
        }
      }
    } else {
      // If not a swipe, animate back to original position
      setDragState(prev => ({
        ...prev,
        manualDragOffset: 0
      }));
    }
  
    // Reset drag state with a small delay to ensure smooth transition
    setTimeout(() => {
      setDragState({
        isManualDragging: false,
        dragStart: 0,
        manualDragOffset: 0,
        dragVelocity: 0,
        lastDragTime: 0
      });
    }, 50);
  }, [dragState.isManualDragging, dragState.manualDragOffset, dragState.dragVelocity, filteredCards, currentIndex, findFirstNonSwipedIndex, answeredCards, selectedTag]);

  // Effects - keep all useEffect hooks together
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      try {
        if (e.deltaY > 0) {
          const nextIndex = currentIndex + 1;
          const currentCard = filteredCards[currentIndex];
          if (nextIndex >= filteredCards.length) {
            // Loop back to first non-swiped card
            const firstNonSwiped = filteredCards.findIndex(card => !swipedCards.has(card.id));
            setCurrentIndex(firstNonSwiped >= 0 ? firstNonSwiped : 0);
            // No need to manage focus
          } else {
            setCurrentIndex(nextIndex);
            if (currentCard && answeredCards.has(currentCard.id)) {
              setProgressByTag(prev => ({
                ...prev,
                [selectedTag]: {
                  ...prev[selectedTag],
                  swipedCards: new Set([...prev[selectedTag].swipedCards, currentCard.id])
                }
              }));
            }
          }
        } else if (e.deltaY < 0 && currentIndex > 0) {
          // Only allow scrolling up if previous card exists and isn't swiped
          const prevIndex = currentIndex - 1;
          const prevCard = filteredCards[prevIndex];
          if (prevCard) {
            setCurrentIndex(prevIndex);
          }
        }
      } catch (error) {
        console.error('Error in handleWheel:', error);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [filteredCards, currentIndex, answeredCards, swipedCards, uiState.isInputFocused, selectedTag]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle tab key for toggling input focus
      if (e.key === 'Tab') {
        e.preventDefault(); // Prevent default tab behavior
        if (e.target instanceof HTMLInputElement) {
          // If we're in an input and tab is pressed, remove focus
          (e.target as HTMLInputElement).blur();
          setUiState(prev => ({ ...prev, isInputFocused: false }));
        } else {
          // If we're not in an input, set focus to true to allow focusing the input
          setUiState(prev => ({ ...prev, isInputFocused: !prev.isInputFocused }));
        }
        return;
      }
      
      // Skip other keyboard handling if typing in input
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          // Only allow going up if previous card exists and isn't swiped
          const prevIndex = currentIndex - 1;
          const prevCard = filteredCards[prevIndex];
          if (prevCard) {
            setCurrentIndex(prevIndex);
          }
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const nextIndex = currentIndex + 1;
        const currentCard = filteredCards[currentIndex];
        if (nextIndex >= filteredCards.length) {
          // Loop back to first non-swiped card
          const firstNonSwiped = filteredCards.findIndex(card => !swipedCards.has(card.id));
          setCurrentIndex(firstNonSwiped >= 0 ? firstNonSwiped : 0);
          setUiState(prev => ({ ...prev, isInputFocused: false }));
        } else {
          setCurrentIndex(nextIndex);
          if (currentCard && answeredCards.has(currentCard.id)) {
            setProgressByTag(prev => ({
              ...prev,
              [selectedTag]: {
                ...prev[selectedTag],
                swipedCards: new Set([...prev[selectedTag].swipedCards, currentCard.id])
              }
            }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCards, currentIndex, answeredCards, swipedCards, uiState.isInputFocused, selectedTag]);

  // Handle window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUiState(prev => ({ ...prev, windowHeight: window.innerHeight }));
      const handleResize = () => setUiState(prev => ({ ...prev, windowHeight: window.innerHeight }));
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Remove check for all cards being answered since we don't use modal anymore
  const handleCorrectAnswer = useCallback((cardId: number) => {
    setProgressByTag(prev => ({
      ...prev,
      [selectedTag]: {
        ...prev[selectedTag],
        answeredCards: new Set([...prev[selectedTag].answeredCards, cardId]),
        swipedCards: new Set([...prev[selectedTag].swipedCards, cardId])
      }
    }));
  }, [selectedTag]);

  // Calculate visible cards - only show current and next card
  const visibleCards = useMemo(() => {
    if (filteredCards.length === 0) return [];
    
    // Only show current and next card
    const cards = filteredCards.slice(currentIndex, currentIndex + 2);
    
    return cards;
  }, [currentIndex, filteredCards]);

  // Adjust currentIndex and input focus
  useEffect(() => {
    const length = filteredCards.length;
    if (length === 0) return;
    
    // Check if all cards in the current tag are answered
    const allCardsAnswered = cardQueue.every(card => answeredCards.has(card.id));
    
    if (allCardsAnswered) {
      setShowCompletionModal(true);
    }
    
    if (currentIndex >= length) {
      setCurrentIndex(0);
      setUiState(prev => ({ ...prev, isInputFocused: false })); // Ensure input is not focused when looping
    }
  }, [currentIndex, filteredCards.length, cardQueue, answeredCards]);

  // Debug effect
  useEffect(() => {
    console.log('Current state:', {
      totalCards: cardQueue.length,
      filteredCards: filteredCards.length,
      currentIndex,
      answeredCards: answeredCards.size,
      swipedCards: swipedCards.size,
      visibleCards: visibleCards.length,
      lastVisibleCard: visibleCards[visibleCards.length - 1]?.word
    });
  }, [filteredCards.length, currentIndex, answeredCards, swipedCards, visibleCards, cardQueue.length]);

  if (uiState.isLoading || uiState.windowHeight === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600 flex justify-center items-center h-screen">Loading...</div>
      </div>
    );
  }

  return (
    <main 
      className="fixed inset-x-0 top-0 w-full h-[var(--vvh)] flex items-center justify-center bg-background swipe-container overscroll-none"
      style={{ 
        contain: 'size layout',
        isolation: 'isolate',
        touchAction: 'none' // Prevent default touch behaviors
      }}
      onMouseDown={handleManualDragStart}
      onMouseMove={handleManualDragMove}
      onMouseUp={handleManualDragEnd}
      onMouseLeave={handleManualDragEnd}
      onTouchStart={handleManualDragStart}
      onTouchMove={handleManualDragMove}
      onTouchEnd={handleManualDragEnd}
      onTouchCancel={handleManualDragEnd}
    >
      <CompletionModal 
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
      />
      
      <div className="relative w-full h-full max-w-[28rem] sm:max-w-lg mx-auto">
        {/* Controls container */}
        <div className="fixed inset-x-0 px-2 sm:px-8 flex justify-between items-start z-[60]" style={{ 
          top: 'calc(var(--safe-top, 16px) + 2.5rem)',
          minHeight: 'var(--controls-min-height, 64px)',
          paddingBottom: '0.5rem'
        }}>
          {/* Left controls */}
          <div className="flex flex-col gap-1.5 sm:gap-2 items-start">
            <ResetButton />
            <TagFilter 
              selectedTag={selectedTag} 
              onTagChange={setSelectedTag} 
              kanjiCards={kanjiCards}
            />
          </div>
          
          {/* Right controls */}
          <div className="flex flex-col items-end gap-1.5 sm:gap-2">
            <div className="button-secondary text-xs sm:text-sm py-1 sm:py-1.5 font-mono flex items-center gap-1">
              <span>{answeredCards.size}/{cardQueue.length}</span>
              <CheckCircleIcon className="w-3 sm:w-4 h-3 sm:h-4" style={{ color: 'var(--color-green-500)' }} />
            </div>
            <div className="flex flex-col gap-1 sm:gap-2 min-w-[120px]">
              <button 
                onClick={() => setUiState(prev => ({ ...prev, showMeaning: !prev.showMeaning }))}
                className={`button-secondary text-xs sm:text-sm py-0.5 sm:py-1.5 px-1.5 sm:px-3 truncate ${
                  uiState.showMeaning && 'bg-primary-50 text-primary-700 border-primary-200'
                }`}
              >
                {uiState.showMeaning ? 'Hide Meaning' : 'Show Meaning'}
              </button>
              <button 
                onClick={() => setUiState(prev => ({ ...prev, showReading: !prev.showReading }))}
                className={`button-secondary text-xs sm:text-sm py-0.5 sm:py-1.5 px-1.5 sm:px-3 truncate ${
                  uiState.showReading && 'bg-primary-50 text-primary-700 border-primary-200'
                }`}
              >
                {uiState.showReading ? 'Hide Answer' : 'Show Answer'}
              </button>
              <button 
                onClick={() => setUiState(prev => ({ ...prev, showSentence: !prev.showSentence }))}
                className={`button-secondary text-xs sm:text-sm py-0.5 sm:py-1.5 px-1.5 sm:px-3 truncate ${
                  uiState.showSentence && 'bg-primary-50 text-primary-700 border-primary-200'
                }`}
              >
                {uiState.showSentence ? 'Hide Sentence' : 'Show Sentence'}
              </button>
            </div>
          </div>
        </div>
        <Hint isInputFocused={uiState.isInputFocused} />
        <AnimatePresence initial={false} mode="popLayout">
          {visibleIndices.map((index) => {
            const card = filteredCards[index];
            if (!card) return null;

            return (
              <motion.div
                key={card.id}
                initial={false}
                animate={getCardStyle(index)}
                transition={CARD_SPRING}
                className="absolute inset-0 flex items-center justify-center p-4 optimize-gpu shared-card-spring animate-card"
                style={{
                  contain: 'layout style paint',
                  willChange: 'transform'
                }}
              >
                <KanjiCard
                  card={card}
                  isActive={index === currentIndex}
                  onCorrectAnswer={() => handleCorrectAnswer(card.id)}
                  isInputFocused={uiState.isInputFocused}
                  isAnswered={answeredCards.has(card.id)}
                  onInputFocus={(focused) => setUiState(prev => ({ ...prev, isInputFocused: focused }))}
                  showMeaning={uiState.showMeaning}
                  showReading={uiState.showReading}
                  showSentence={uiState.showSentence}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </main>
  );
};

// Add display name for better debugging
KanjiCardContainer.displayName = 'KanjiCardContainer';

export default memo(KanjiCardContainer);
