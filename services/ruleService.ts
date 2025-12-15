
import { TranslationResult } from '../types';
import { getJyutpingBatch, initDictionary } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { toShinjitai, initShinjitai, normalizeJapanesePunctuation } from './shinjitaiService';

/**
 * Pure Phonetic / Text Mode Service (Non-AI)
 * Strategy:
 * 1. Convert Mandarin/Text Input -> Shinjitai
 * 2. Convert to Jyutping (via LSHK Dictionary)
 * 3. Convert strictly to Kana (Nambunese Phonetic Script)
 * 
 * v5.2 Update:
 * This mode serves as both Transliteration and Text Conversion.
 * 'nambunese' field returns the Shinjitai Text (for Main Copy).
 * 'fullKana' field returns the Pure Kana (for Kana Copy/TTS).
 * 'segments' provides the Ruby structure.
 * 
 * v5.2 Performance Update:
 * Uses batch Jyutping lookup for significantly improved performance.
 */

export const convertRuleBased = async (inputText: string): Promise<TranslationResult> => {
  // Ensure dictionaries are loaded
  await Promise.all([initDictionary(), initShinjitai()]);

  // 1. Normalize Punctuation & Shinjitai globally first
  const normalizedInput = normalizeJapanesePunctuation(toShinjitai(inputText));

  const chars = Array.from(normalizedInput);

  // 2. Batch lookup all Jyutping at once (major performance improvement)
  const jyutpingResults = getJyutpingBatch(chars);

  let nambuneseStr = ""; // Holds the Shinjitai Text (Main Copy)
  let jyutpingStr = "";
  let fullKanaStr = "";

  // We use KANJI type with reading to trigger Ruby display in UI
  const segments: { text: string, type: 'KANJI' | 'KANA', reading?: string, source?: string }[] = [];

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const jp = jyutpingResults[i];

    // Check if punctuation/space
    if (/[\s\p{P}]/u.test(char)) {
      nambuneseStr += char;
      jyutpingStr += char + " ";
      fullKanaStr += char;
      segments.push({ text: char, type: 'KANA' });
      continue;
    }

    // Check ASCII/English
    if (/^[\x00-\x7F]$/.test(char)) {
      nambuneseStr += char;
      jyutpingStr += char + " ";
      fullKanaStr += char;
      segments.push({ text: char, type: 'KANJI' }); // No reading -> Render text
      continue;
    }

    if (jp === char) {
      // Not found in dictionary -> Keep original
      nambuneseStr += char;
      jyutpingStr += char + " ";
      fullKanaStr += char;
      segments.push({ text: char, type: 'KANJI' });
    } else {
      // Found -> Convert to Kana
      const kana = convertToKana(jp);
      nambuneseStr += char; // Keep as Text for Main Copy
      jyutpingStr += jp + " ";
      fullKanaStr += kana; // Keep as Kana for Kana Copy

      // UI: Text is Original(Shinjitai), Reading is Kana.
      segments.push({
        text: char,
        type: 'KANJI',
        reading: kana
      });
    }
  }

  return {
    original: inputText,
    cantonese: inputText, // No intermediate translation in Pure Mode
    jyutping: jyutpingStr.trim(),
    nambunese: nambuneseStr, // Main Result is now Text (Shinjitai)
    fullKana: fullKanaStr, // Pure Kana
    explanation: "Transliteration Mode: Character-to-Kana conversion with Ruby display.",
    engine: 'RULE',
    segments: segments
  };
};