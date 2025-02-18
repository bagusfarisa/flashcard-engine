'use client';

import { useState } from 'react';
import { updateKanjiData } from '../data/kanjiData';
import Modal from './Modal';

export default function ResetButton() {
  const [showModal, setShowModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const handleUpdate = async () => {
    setIsUpdating(true);
    const result = await updateKanjiData();
    setUpdateMessage(result.message);
    setTimeout(() => {
      setShowModal(false);
      setIsUpdating(false);
      setUpdateMessage('');
      if (result.success) {
        window.location.reload();
      }
    }, 2000);
  };

  const handleClearCache = () => {
    // Clear only progress-related data
    const progressKeys = ['progress', 'stats', 'lastSeen', 'completed', 'scores'];
    progressKeys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowClearCacheModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-1.5 rounded-full transition-colors"
        >
          Reset Progress
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="button-secondary text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-1.5"
        >
          Update Dataset
        </button>
      </div>

      <Modal 
        isOpen={showClearCacheModal} 
        onClose={() => setShowClearCacheModal(false)}
      >
        <div className="w-full">
          <h2 className="text-xl font-bold text-neutral-800 mb-3">Reset All Progress?</h2>
          <p className="text-sm text-neutral-600 mb-5">
            This will reset all your learning progress, statistics, and saved data. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClearCacheModal(false)}
              className="button-secondary text-sm py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleClearCache}
              className="bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 px-4 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showModal} 
        onClose={() => !isUpdating && setShowModal(false)}
        isBlocking={isUpdating}
      >
        <div className="w-full">
          <h2 className="text-xl font-bold text-neutral-800 mb-3">Update Kanji Data?</h2>
          <p className="text-sm text-neutral-600 mb-5">
            This will update your kanji data with the latest version while preserving your progress. Your current session and progress will not be reset.
          </p>
          {updateMessage ? (
            <div className="text-center text-sm text-neutral-600 mb-4">
              {updateMessage}
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isUpdating}
                className="button-secondary text-sm py-1.5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="button-primary text-sm py-1.5 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
