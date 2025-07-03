
"use client";

import { useState, useEffect } from 'react';

// This hook is no longer in use, but is kept to avoid breaking changes if referenced elsewhere.
export function useBreakpoint(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Return false immediately on server
    if (typeof window === 'undefined') {
      return;
    }
    
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
