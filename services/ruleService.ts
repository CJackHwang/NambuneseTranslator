
import { TranslationResult } from '../types';
import { getJyutping } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { toShinjitai, initShinjitai, normalizeJapanesePunctuation } from './shinjitaiService';

/**
 * Pure Phonetic / Text Mode Service (Non-AI)
 * Strategy:
 * 1. Convert Mandarin/Text Input -> Shinjitai
 * 2. Convert to Jyutping (via LSHK Dictionary)
 * 3. Convert strictly to Kana (Zhengyu Phonetic Script)
 * 
 * V5.1 Update:
 * This mode now serves as both Transliteration and Text Conversion.
 * 'zhengyu' field returns the Shinjitai Text (for Main Copy).
 * 'fullKana' field returns the Pure Kana (for Kana Copy/TTS).
 * 'segments' provides the Ruby structure.
 */

export const convertRuleBased = async (inputText: string): Promise<TranslationResult> => {
  // Ensure dictionaries are loaded
  await initShinjitai();
  
  // 1. Normalize Punctuation & Shinjitai globally first
  const normalizedInput = normalizeJapanesePunctuation(toShinjitai(inputText));

  const chars = Array.from(normalizedInput);
  let zhengyuStr = ""; // Holds the Shinjitai Text (Main Copy)
  let jyutpingStr = "";
  let fullKanaStr = "";
  
  // We use KANJI type with reading to trigger Ruby display in UI
  const segments: { text: string, type: 'KANJI' | 'KANA', reading?: string, source?: string }[] = [];

  for (const char of chars) {
    // Check if punctuation/space
    if (/[\s\p{P}]/u.test(char)) {
        zhengyuStr += char;
        jyutpingStr += char + " ";
        fullKanaStr += char;
        segments.push({ text: char, type: 'KANA' }); 
        continue;
    }

    // Check ASCII/English
    if (/[\x00-\x7F]/.test(char)) {
        zhengyuStr += char;
        jyutpingStr += char + " ";
        fullKanaStr += char;
        segments.push({ text: char, type: 'KANJI' }); // No reading -> Render text
        continue;
    }

    // Lookup Jyutping
    const jpArray = await getJyutping(char); 
    const jp = jpArray[0]; // Should be single element since we pass single char

    if (jp === char) {
        // Not found in dictionary -> Keep original
        zhengyuStr += char;
        jyutpingStr += char + " ";
        fullKanaStr += char;
        segments.push({ text: char, type: 'KANJI' });
    } else {
        // Found -> Convert to Kana
        const kana = convertToKana(jp);
        zhengyuStr += char; // Keep as Text for Main Copy
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
    zhengyu: zhengyuStr, // Main Result is now Text (Shinjitai)
    fullKana: fullKanaStr, // Pure Kana
    explanation: "Transliteration Mode: Character-to-Kana conversion with Ruby display.",
    engine: 'RULE',
    segments: segments
  };
};