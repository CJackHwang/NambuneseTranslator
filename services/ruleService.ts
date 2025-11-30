
import { TranslationResult } from '../types';
import { getJyutping } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { toShinjitai, initShinjitai } from './shinjitaiService';

/**
 * Pure Phonetic Service (Non-AI)
 * Strategy:
 * 1. Convert Mandarin/Text Input -> Shinjitai (Optional, for consistency)
 * 2. Convert to Jyutping (via LSHK Dictionary)
 * 3. Convert strictly to Kana (Zhengyu Phonetic Script)
 * 
 * This mode does NOT preserve Kanji anchors (unless they are missing from dictionary).
 * It functions as a pure phonetic transcriber.
 */

export const convertRuleBased = async (inputText: string): Promise<TranslationResult> => {
  // Ensure dictionaries are loaded
  await initShinjitai();
  
  const chars = Array.from(inputText);
  let zhengyuStr = "";
  let jyutpingStr = "";
  
  const segments: { text: string, type: 'KANJI' | 'KANA', source?: string }[] = [];

  for (const char of chars) {
    // Check if punctuation/space
    if (/[\s\p{P}]/u.test(char)) {
        zhengyuStr += char;
        jyutpingStr += char + " ";
        segments.push({ text: char, type: 'KANA' }); // Treat punct as Kana layer for style
        continue;
    }

    // Lookup Jyutping
    const jpArray = await getJyutping(char); 
    const jp = jpArray[0]; // Should be single element since we pass single char

    if (jp === char) {
        // Not found in dictionary -> Keep original (Kanji Anchor by default if unknown)
        // Convert to Shinjitai here as well for consistency
        const shin = toShinjitai(char);
        zhengyuStr += shin;
        jyutpingStr += char + " ";
        segments.push({ text: shin, type: 'KANJI' });
    } else {
        // Found -> Convert to Kana
        const kana = convertToKana(jp);
        zhengyuStr += kana;
        jyutpingStr += jp + " ";
        segments.push({ text: kana, type: 'KANA', source: jp });
    }
  }

  return {
    original: inputText,
    cantonese: inputText, // No intermediate translation in Pure Mode
    jyutping: jyutpingStr.trim(),
    zhengyu: zhengyuStr,
    explanation: "Pure Phonetic Mode: Direct Character-to-Kana conversion using LSHK dictionary.",
    engine: 'RULE',
    segments: segments
  };
};
