import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { trelloService } from '@/services/trelloService';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Single source of truth for all boards data
 * This hook ensures we NEVER make duplicate API calls
 * All pages use the same cached data
 */
export function useAllBoardsData() {
  const { allBoardsData, allBoardsDataTimestamp, setAllBoardsData } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      // Check if cache is valid
      const now = Date.now();
      const isCacheValid = allBoardsData && 
                          allBoardsDataTimestamp && 
                          (now - allBoardsDataTimestamp < CACHE_DURATION);

      if (isCacheValid) {
        console.log('✅ Using cached data');
        setLoading(false);
        return;
      }

      // Only fetch if not already loading
      if (loading) {
        console.log('⏳ Already loading, skipping...');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('📡 Fetching from Trello API...');
        const data = await trelloService.getAllBoardsData();
        
        if (!cancelled) {
          setAllBoardsData(data);
          setLoading(false);
          console.log('✅ Data cached successfully');
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('❌ Error fetching data:', err);
          setError(err?.response?.status === 429 
            ? 'Too many requests. Please wait a moment and try again.' 
            : 'Failed to load data. Please try again.');
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [allBoardsData, allBoardsDataTimestamp]); // Only depends on cache state

  return {
    data: allBoardsData,
    loading,
    error,
    invalidateCache: () => setAllBoardsData(null)
  };
}

