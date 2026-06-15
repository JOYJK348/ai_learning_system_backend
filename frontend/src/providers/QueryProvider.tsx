'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect, useRef } from 'react';

export const queryClientSingleton = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

export function clearPersistedCache() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PERSIST_KEY);
  } catch { }
  queryClientSingleton.removeQueries();
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const persisted = useRef(false);

  useEffect(() => {
    if (persisted.current) return;
    persisted.current = true;

    const persister = createSyncStoragePersister({
      storage: window.sessionStorage,
      key: PERSIST_KEY,
    });

    persistQueryClient({
      queryClient: queryClientSingleton,
      persister,
      maxAge: 1000 * 60 * 30,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClientSingleton}>
      {children}
    </QueryClientProvider>
  );
}
