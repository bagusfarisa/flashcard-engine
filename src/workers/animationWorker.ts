/// <reference lib="webworker" />

type AnimationCalcRequest = {
  type: 'CALCULATE_CARD_POSITIONS';
  payload: {
    currentIndex: number;
    windowHeight: number;
    manualDragOffset: number;
    isManualDragging: boolean;
  };
};

type AnimationWorkerMessage = AnimationCalcRequest;

// Calculate card positions in a separate thread
function calculateCardPositions(
  currentIndex: number,
  windowHeight: number,
  manualDragOffset: number,
  isManualDragging: boolean
) {
  const positions = new Map<number, { y: number; zIndex: number }>();
  
  // Current card
  positions.set(currentIndex, {
    y: isManualDragging ? -manualDragOffset : 0,
    zIndex: 2
  });

  // Next card
  positions.set(currentIndex + 1, {
    y: isManualDragging ? Math.max(windowHeight - manualDragOffset, 0) : windowHeight,
    zIndex: 1
  });

  return positions;
}

self.onmessage = (event: MessageEvent<AnimationWorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CALCULATE_CARD_POSITIONS':
      const positions = calculateCardPositions(
        payload.currentIndex,
        payload.windowHeight,
        payload.manualDragOffset,
        payload.isManualDragging
      );
      
      self.postMessage({
        type: 'CARD_POSITIONS_CALCULATED',
        payload: Array.from(positions.entries())
      });
      break;
      
    default:
      console.error('Unknown message type:', type);
  }
};