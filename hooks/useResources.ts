import { useState, useEffect, useCallback } from 'react';
import { initDictionary } from '../services/jyutpingService';
import { initShinjitai } from '../services/shinjitaiService';

export const useResources = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([initDictionary(), initShinjitai()]);
      setIsReady(true);
    } catch (err: any) {
      console.error("Resources initialization failed", err);
      setError("Failed to load dictionaries.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { isReady, error, retry: load };
};