import { useState, useCallback, useRef, useEffect } from 'react';
import { TranslationResult, ConversionStatus } from '../types';
import { convertHybrid } from '../services/hybridService';
import { convertRuleBased } from '../services/ruleService';
import { addHistory } from '../services/historyService';

export type ConverterMode = 'HYBRID' | 'PURE';

export const useConverter = (resourcesReady: boolean) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [status, setStatus] = useState<ConversionStatus>(ConversionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ConverterMode>('HYBRID');
  const [isRealTime, setIsRealTime] = useState(false);

  const debounceTimeoutRef = useRef<number | null>(null);

  const convert = useCallback(async (text: string, overrideMode?: ConverterMode) => {
    if (!text.trim()) {
      setResult(null);
      setStatus(ConversionStatus.IDLE);
      return;
    }
    if (!resourcesReady) return;

    // Use override mode if provided (for history restore), otherwise use current state
    const effectiveMode = overrideMode ?? mode;

    setStatus(ConversionStatus.LOADING);
    setError(null);

    try {
      let data: TranslationResult;
      switch (effectiveMode) {
        case 'PURE':
          data = await convertRuleBased(text);
          break;
        case 'HYBRID':
        default:
          data = await convertHybrid(text);
          break;
      }
      setResult(data);
      setStatus(ConversionStatus.SUCCESS);

      // Save to history with the effective mode
      addHistory(text, effectiveMode);
    } catch (err: any) {
      setStatus(ConversionStatus.ERROR);
      setError(err?.message || "Unknown error occurred");
      console.error(err);
    }
  }, [mode, resourcesReady]);

  // Real-time Effect
  useEffect(() => {
    if (!isRealTime || mode === 'HYBRID') return;

    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    if (input.trim()) {
      debounceTimeoutRef.current = window.setTimeout(() => {
        convert(input);
      }, 800); // Slightly longer delay for better UX
    } else {
      setResult(null);
      setStatus(ConversionStatus.IDLE);
    }

    return () => {
      if (debounceTimeoutRef.current) window.clearTimeout(debounceTimeoutRef.current);
    };
  }, [input, isRealTime, mode, convert]);

  return {
    input,
    setInput,
    result,
    setResult,
    status,
    error,
    mode,
    setMode,
    isRealTime,
    setIsRealTime,
    convert
  };
};