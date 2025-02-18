'use client';

import { useEffect } from 'react';

interface ViewportHandlerProps {
  children?: React.ReactNode;
}

export default function ViewportHandler({ children }: ViewportHandlerProps) {
  useEffect(() => {
    function handleVisualViewport() {
      if (!window.visualViewport) return;
      
      const viewport = window.visualViewport;
      const root = document.documentElement;
      
      // Set the visual viewport height
      root.style.setProperty('--vvh', `${viewport.height}px`);
      
      // Calculate and set the offset from the top of the page
      const offsetTop = viewport.offsetTop;
      root.style.setProperty('--vv-offset', `${offsetTop}px`);
      
      // Set scale and safe area
      root.style.setProperty('--vv-scale', `${viewport.scale}`);
      
      // Add safe area padding for mobile devices
      const safeTop = Math.max(viewport.offsetTop, 16);
      root.style.setProperty('--safe-top', `${safeTop}px`);
      
      // Ensure controls don't get clipped on small screens
      const minControlsHeight = Math.min(viewport.height * 0.15, 64);
      root.style.setProperty('--controls-min-height', `${minControlsHeight}px`);
    }

    // Initial setup
    handleVisualViewport();

    // Add event listeners if Visual Viewport API is available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewport);
      window.visualViewport.addEventListener('scroll', handleVisualViewport);
    }

    // Fallback for browsers without Visual Viewport API
    window.addEventListener('resize', handleVisualViewport);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewport);
        window.visualViewport.removeEventListener('scroll', handleVisualViewport);
      }
      window.removeEventListener('resize', handleVisualViewport);
    };
  }, []);

  return children ? <>{children}</> : null;
}
