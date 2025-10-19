import { useStore } from '@/store/useStore';

/**
 * Invalidates the allBoardsData cache, forcing a refresh on the next data load
 * Call this after any mutation (create, update, delete) to Trello cards
 */
export const invalidateAllBoardsCache = () => {
  const store = useStore.getState();
  store.setAllBoardsData(null);
  console.log('Cache invalidated - next load will fetch fresh data');
};

/**
 * Force refresh all boards data
 * Useful for manual refresh buttons or after mutations
 */
export const refreshAllBoardsData = async () => {
  invalidateAllBoardsCache();
  // The next component that needs the data will automatically fetch it
};

