'use client';

interface HintProps {
  isInputFocused: boolean;
}

export default function Hint({ isInputFocused }: HintProps) {
  if (isInputFocused) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 hidden md:block">
      <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-gray-500 text-sm font-normal shadow-sm animate-pulse whitespace-nowrap">
        <span>Use ↓ or → arrow keys to see the next card</span>
      </div>
    </div>
  );
}
