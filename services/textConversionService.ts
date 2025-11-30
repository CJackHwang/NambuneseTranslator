
import { TranslationResult } from '../types';
import { toShinjitai, initShinjitai } from './shinjitaiService';

/**
 * Text Conversion Service
 * Converts Hanzi to Shinjitai and maps punctuation.
 */

export const convertTextMode = async (inputText: string): Promise<TranslationResult> => {
  // Ensure Shinjitai dictionary is loaded
  await initShinjitai();

  // 1. Convert to Shinjitai
  let converted = toShinjitai(inputText);

  // 2. Apply Punctuation Rules
  // Chinese Comma (U+FF0C) -> Japanese Comma (U+3001)
  converted = converted.replace(/，/g, '、');

  return {
    original: inputText,
    cantonese: inputText,
    jyutping: "", // No phonetic transcription for this mode
    zhengyu: converted,
    explanation: "Text Conversion Mode: Chinese Hanzi to Japanese Shinjitai + Punctuation mapping (，→、).",
    engine: 'RULE',
    segments: [{ text: converted, type: 'KANJI' }]
  };
};
