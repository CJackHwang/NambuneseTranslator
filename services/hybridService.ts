
import { convertHybridTagging } from './geminiService';
import { toShinjitai, initShinjitai } from './shinjitaiService';
import { getJyutping, initDictionary } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { TranslationResult } from '../types';

export const convertHybrid = async (inputText: string): Promise<TranslationResult> => {
  // Step 0: Ensure Dictionaries are Loaded
  await Promise.all([initDictionary(), initShinjitai()]);

  // === STEP 1: Pre-processing (Normalization) ===
  // Convert Hanzi -> Shinjitai locally
  let preProcessed = toShinjitai(inputText);
  // Map Punctuation: ， -> 、
  preProcessed = preProcessed.replace(/，/g, '、');

  // === STEP 2: AI Tagging ===
  // Send the normalized text to AI for strictly structural tagging
  let taggedText = await convertHybridTagging(preProcessed);

  // === STEP 3: Phonetic Conversion ===
  // Parse tags and convert raw segments to Kana
  
  const regex = /\{([^}]+)\}|\[([^\]]+)\]|([^{}[\]]+)/g;
  let match;
  const segments: { text: string, type: 'KANJI' | 'KANA', source?: string }[] = [];
  
  let fullJyutping = "";
  let fullZhengyu = "";

  while ((match = regex.exec(taggedText)) !== null) {
    if (match[1]) {
      // === KANJI SEGMENT (Inside {}) ===
      // AI marked this as Noun/Anchor. Keep as is.
      const content = match[1];
      
      segments.push({ text: content, type: 'KANJI' });
      fullZhengyu += content;
      
      // Get Jyutping for Kanji parts (for display/reference)
      const jpArray = await getJyutping(content);
      const jp = jpArray.join(' ');
      fullJyutping += jp + " ";

    } else if (match[2]) {
      // === FOREIGN SEGMENT (Inside []) ===
      // AI marked this as Foreign/Katakana. Keep as is.
      const content = match[2];
      
      segments.push({ text: content, type: 'KANA', source: 'Foreign' });
      fullZhengyu += content;
      fullJyutping += content + " ";

    } else if (match[3]) {
      // === RAW SEGMENT (Outside tags) ===
      // AI marked this as Verb/Adj/Function Word. Convert to Kana.
      const content = match[3];
      
      // 1. Convert to Jyutping
      const jpArray = await getJyutping(content);
      
      // 2. Convert to Kana
      let kanaSegment = "";
      let jpSegment = "";
      
      for (let i = 0; i < jpArray.length; i++) {
        const jp = jpArray[i];
        const kana = convertToKana(jp);
        kanaSegment += kana;
        jpSegment += jp + " ";
      }
      
      segments.push({ text: kanaSegment, type: 'KANA', source: jpSegment.trim() });
      fullZhengyu += kanaSegment;
      fullJyutping += jpSegment;
    }
  }

  return {
    original: inputText,
    cantonese: taggedText, // Using this field to store the tagged version
    jyutping: fullJyutping.trim(),
    zhengyu: fullZhengyu,
    explanation: "Hybrid Pipeline v5.1",
    engine: 'HYBRID',
    segments: segments,
    processLog: {
      step1_normalization: preProcessed,
      step2_ai_tagging: taggedText,
      step3_phonetic: fullZhengyu
    }
  };
};
