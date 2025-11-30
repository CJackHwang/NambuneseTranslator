
import { convertHybridTagging } from './geminiService';
import { toShinjitai } from './shinjitaiService';
import { getJyutping, initDictionary } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { TranslationResult } from '../types';

export const convertHybrid = async (inputText: string): Promise<TranslationResult> => {
  // Step 0: Ensure Dictionary is Loaded
  const dictPromise = initDictionary();

  // Step 1: AI Tagging (Mandarin -> Marked Cantonese)
  const aiPromise = convertHybridTagging(inputText);

  // Wait for both
  const [_, taggedText] = await Promise.all([dictPromise, aiPromise]);
  
  // Step 2: Parse and Process
  // Regex matches: {Kanji} OR [Katakana] OR Text
  // Group 1: {Kanji}
  // Group 2: [Katakana]
  // Group 3: Other Text
  const regex = /\{([^}]+)\}|\[([^\]]+)\]|([^{}[\]]+)/g;
  let match;
  const segments: { text: string, type: 'KANJI' | 'KANA', source?: string }[] = [];
  
  let fullJyutping = "";
  let fullZhengyu = "";

  while ((match = regex.exec(taggedText)) !== null) {
    if (match[1]) {
      // === KANJI SEGMENT (Inside {}) ===
      const content = match[1];
      const shinjitai = toShinjitai(content);
      
      segments.push({ text: shinjitai, type: 'KANJI' });
      
      fullZhengyu += shinjitai;
      
      // Get Jyutping for Kanji parts (for display purposes)
      const jpArray = await getJyutping(content);
      const jp = jpArray.join(' ');
      fullJyutping += jp + " ";

    } else if (match[2]) {
      // === KATAKANA SEGMENT (Inside []) ===
      // AI already converted this to Katakana, e.g. [アップル]
      const content = match[2];
      
      segments.push({ text: content, type: 'KANA', source: 'Foreign' });
      
      fullZhengyu += content;
      fullJyutping += content + " "; // No Jyutping for raw Katakana

    } else if (match[3]) {
      // === KANA SEGMENT (Normal Cantonese to convert) ===
      const content = match[3];
      
      // 1. Convert to Jyutping (Async)
      const jpArray = await getJyutping(content); // e.g. ['heoi3']
      
      // 2. Convert each char's Jyutping to Kana
      let kanaSegment = "";
      let jpSegment = "";
      
      for (let i = 0; i < jpArray.length; i++) {
        const jp = jpArray[i];
        // If jp is still a chinese char (lookup failed), convertToKana will just return it
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
    cantonese: taggedText, 
    jyutping: fullJyutping.trim(),
    zhengyu: fullZhengyu,
    explanation: "Hybrid Process v5.1: AI handles Noun Anchors and English-to-Katakana conversion. Real-time dictionary handles Phonetic Kana.",
    engine: 'HYBRID',
    segments: segments
  };
};
