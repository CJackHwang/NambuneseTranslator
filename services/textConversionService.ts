
import { TranslationResult } from '../types';
import { toShinjitai, initShinjitai, normalizeJapanesePunctuation } from './shinjitaiService';

/**
 * Text Conversion Service
 * Converts Hanzi to Shinjitai and maps punctuation.
 */

export const convertTextMode = async (inputText: string): Promise<TranslationResult> => {
  // Ensure Shinjitai dictionary is loaded
  await initShinjitai();

  // 1. Convert to Shinjitai
  let converted = toShinjitai(inputText);

  // 2. Apply Punctuation Rules (Global Japanese Style)
  converted = normalizeJapanesePunctuation(converted);

  return {
    original: inputText,
    cantonese: inputText,
    jyutping: "", // No phonetic transcription for this mode
    nambunese: converted,
    fullKana: "", // Not applicable
    explanation: "Text Conversion Mode: Chinese Hanzi to Japanese Shinjitai + Punctuation mapping (，→、).",
    engine: 'RULE',
    segments: [{ text: converted, type: 'KANJI' }]
  };
};
