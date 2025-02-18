'use client';

import dynamic from 'next/dynamic';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

// Dynamically import KanjiCardContainer to reduce initial bundle size
const KanjiCardContainer = dynamic(
  () => import('@/components/KanjiCardContainer').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    )
  }
);

export default function Home() {
  // Enable performance monitoring
  usePerformanceMonitor();

  return (
    <div className="pt-16">
      <KanjiCardContainer />
    </div>
  );
}
