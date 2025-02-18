'use client';

import { Fragment, useRef, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { createPortal } from 'react-dom';
import { getUniqueTags } from '../data/kanjiData';
import type { KanjiCard } from '../data/kanjiData';

type TagFilterProps = {
  selectedTag?: string;
  onTagChange: (tag: string) => void;
  kanjiCards: KanjiCard[];
};

const getDefaultTag = (kanjiCards: KanjiCard[]): string => {
  const tagCounts = new Map<string, number>();
  
  kanjiCards.forEach(card => {
    if (card.tags && card.tags.length > 0) {
      card.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });

  if (tagCounts.size === 0) return 'All';
  
  // Get the tag with highest count
  let maxCount = 0;
  let mostCommonTag = 'All';
  
  tagCounts.forEach((count, tag) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonTag = tag;
    }
  });
  
  return mostCommonTag;
};

export default function TagFilter({ selectedTag, onTagChange, kanjiCards }: TagFilterProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const tags = getUniqueTags(kanjiCards);
  const effectiveTag = selectedTag ?? getDefaultTag(kanjiCards);

  useEffect(() => {
    // If no tag is selected, set the default
    if (!selectedTag) {
      onTagChange(getDefaultTag(kanjiCards));
    }
  }, [selectedTag, kanjiCards, onTagChange]);

  useEffect(() => {
    const updateButtonRect = () => {
      if (buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    };

    updateButtonRect();
    window.addEventListener('resize', updateButtonRect);
    return () => window.removeEventListener('resize', updateButtonRect);
  }, []);

  return (
    <div className="w-full sm:w-[140px]">
      <Listbox value={effectiveTag} onChange={onTagChange}>
        <div className="relative">
          <Listbox.Button ref={buttonRef} className="button-secondary text-xs sm:text-sm py-1 sm:py-1.5 w-full flex items-center">
            <span className="block truncate flex-1 text-left">{effectiveTag}</span>
            <ChevronUpDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
          </Listbox.Button>
          
          {typeof document !== 'undefined' && buttonRect && createPortal(
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options 
                className="absolute z-[200] max-h-60 overflow-auto rounded-lg bg-white py-0.5 sm:py-1 text-xs sm:text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none mt-1"
                style={{
                  position: 'fixed',
                  left: `${Math.max(8, Math.min(buttonRect.left, window.innerWidth - Math.max(buttonRect.width, 120)))}px`,
                  top: `${Math.max(buttonRect.bottom + 8, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top') || '16') + 48)}px`,
                  minWidth: '120px',
                  maxWidth: '200px',
                  maxHeight: `${window.innerHeight - buttonRect.bottom - 16}px`
                }}
              >
                {tags.map((tag) => (
                  <Listbox.Option
                    key={tag}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-1.5 sm:py-2 px-3 sm:px-4 ${
                        active ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                      }`
                    }
                    value={tag}
                  >
                    {({ selected }) => (
                      <div className="flex items-center">
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {tag}
                        </span>
                        {selected && (
                          <span className="ml-auto">
                            <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary-500" />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>,
            document.body
          )}
        </div>
      </Listbox>
    </div>
  );
}
