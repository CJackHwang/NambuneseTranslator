
import { extractPreservedTerms } from './geminiService';
import { toShinjitai, initShinjitai } from './shinjitaiService';
import { getJyutping, initDictionary } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { TranslationResult } from '../types';

export const convertHybrid = async (inputText: string): Promise<TranslationResult> => {
  // Step 0: Ensure Dictionaries are Loaded
  await Promise.all([initDictionary(), initShinjitai()]);

  // === PARALLEL PROCESSING ===
  
  // Path A: Normalization
  // Convert original Input -> Shinjitai
  let normalizedText = toShinjitai(inputText);
  // Map Punctuation: ， -> 、 (Standardize punctuation)
  normalizedText = normalizedText.replace(/，/g, '、');

  // Path B: AI Extraction (On Original Text)
  // We send the ORIGINAL text to AI to ensure it sees the context correctly.
  let rawKeywords: string[] = [];
  try {
    rawKeywords = await extractPreservedTerms(inputText);
  } catch (error) {
    console.error("AI Extraction failed", error);
    rawKeywords = [];
  }

  // === UNIFICATION ===
  // Convert the AI-extracted keywords to Shinjitai as well.
  // This ensures that if Input "功能" -> Shinjitai "功能"
  // And AI extracts "功能" -> Shinjitai "功能"
  // They match.
  // Even if Input "逻辑" -> Shinjitai "論理" (hypothetically, if dictionary does that)
  // AI extracts "逻辑" -> Shinjitai "論理"
  // They match.
  const normalizedKeywords = rawKeywords.map(k => toShinjitai(k));

  // Sort keywords by length (descending) to ensure greedy matching
  normalizedKeywords.sort((a, b) => b.length - a.length);

  // === SEGMENTATION & CONVERSION ===
  
  const segments: { text: string, type: 'KANJI' | 'KANA', reading?: string, source?: string }[] = [];
  let fullJyutping = "";
  let fullZhengyu = "";
  let fullKanaStr = "";

  let i = 0;
  const len = normalizedText.length;

  while (i < len) {
    let match: string | null = null;

    // A. Check for Keyword Match (using normalized arrays)
    for (const keyword of normalizedKeywords) {
      if (normalizedText.startsWith(keyword, i)) {
        match = keyword;
        break; // Found longest match
      }
    }

    if (match) {
      // === KANJI SEGMENT (Matched Anchor) ===
      
      // Get Jyutping for reference (of the normalized term)
      const jpArray = await getJyutping(match);
      const jpString = jpArray.join(' ');
      fullJyutping += jpString + " ";

      // Generate Reading for Ruby
      let reading = "";
      for(const p of jpArray) {
        reading += convertToKana(p);
      }

      segments.push({ 
        text: match, 
        type: 'KANJI', 
        reading: reading 
      });
      fullZhengyu += match;
      fullKanaStr += reading;

      i += match.length;
    } else {
      // No keyword match
      const char = normalizedText[i];
      
      // B. Check for Latin/ASCII/Numbers (English Protection)
      if (/[a-zA-Z0-9]/.test(char)) {
         segments.push({ text: char, type: 'KANJI' }); // No reading
         fullZhengyu += char;
         fullJyutping += char; 
         fullKanaStr += char;
         i++;
         continue;
      }

      // C. Punctuation
      if (/[\s\p{P}]/u.test(char)) {
        segments.push({ text: char, type: 'KANA' });
        fullZhengyu += char;
        fullJyutping += char + " ";
        fullKanaStr += char;
        i++;
        continue;
      }

      // D. Fallback: Convert to Kana (Verbs, Adjectives, etc.)
      const jpArray = await getJyutping(char);
      const jp = jpArray[0];
      
      const kana = convertToKana(jp);
      
      segments.push({ text: kana, type: 'KANA', source: jp });
      fullZhengyu += kana;
      fullJyutping += jp + " ";
      fullKanaStr += kana;
      
      i++;
    }
  }

  return {
    original: inputText,
    cantonese: JSON.stringify(rawKeywords),
    jyutping: fullJyutping.trim(),
    zhengyu: fullZhengyu,
    fullKana: fullKanaStr,
    explanation: "Hybrid Pipeline v5.1 (Raw AI Extraction + Unified Shinjitai Matching)",
    engine: 'HYBRID',
    segments: segments,
    processLog: {
      step1_raw_input: inputText,
      step2_ai_extraction: JSON.stringify(rawKeywords),
      step3_normalization_text: normalizedText,
      step4_normalization_keywords: JSON.stringify(normalizedKeywords),
      step5_segmentation: fullZhengyu
    }
  };
};
