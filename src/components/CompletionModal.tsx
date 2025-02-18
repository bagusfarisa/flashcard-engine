'use client';

import Modal from './Modal';
import Link from 'next/link';

type CompletionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CompletionModal({ isOpen, onClose }: CompletionModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
    >
      <div className="w-full">
        <h2 className="text-xl font-bold text-neutral-800 mb-3">Awesome Progress! 🎉</h2>
        <p className="text-sm text-neutral-600 mb-3">
          You&apos;ve mastered all the cards in this set. Ready to take your learning to the next level?
        </p>
        <p className="text-sm text-neutral-600 mb-5">
          Try Flash Mode for rapid-fire practice and test your quick recognition skills!
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="button-secondary text-sm py-1.5"
          >
            Keep Practicing
          </button>
          <Link
            href="/flash"
            className="button-primary text-sm py-1.5 flex items-center gap-1"
            onClick={onClose}
          >
            Try Flash Mode
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </Modal>
  );
}