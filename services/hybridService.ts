import { extractPreservedTerms } from './geminiService';
import { toShinjitai, initShinjitai } from './shinjitaiService';
import { getJyutping, initDictionary } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { TranslationResult } from '../types';

export const convertHybrid = async (inputText: string): Promise<TranslationResult> => {
  // Step 0: Ensure Dictionaries are Loaded
  await Promise.all([initDictionary(), initShinjitai()]);

  // === STEP 1: Pre-processing (Normalization) ===
  // Convert Hanzi -> Shinjitai locally FIRST.
  let preProcessed = toShinjitai(inputText);
  // Map Punctuation: ， -> 、
  preProcessed = preProcessed.replace(/，/g, '、');

  // === STEP 2: AI Keyword Extraction ===
  // Get a list of words to KEEP as Kanji (Nouns, Pronouns, etc.)
  let preservedKeywords: string[] = [];
  try {
    preservedKeywords = await extractPreservedTerms(preProcessed);
  } catch (error) {
    console.error("AI Extraction failed, falling back to full phonetization", error);
    preservedKeywords = [];
  }

  // Sort keywords by length (descending) to ensure greedy matching
  // This prevents short words from matching inside longer preserved terms.
  preservedKeywords.sort((a, b) => b.length - a.length);

  // === STEP 3: Segmentation & Phonetic Conversion ===
  // Scan the text. Prioritize: 
  // 1. AI Preserved Keywords
  // 2. English/Latin/Numbers (Force Preserve)
  // 3. Punctuation (Keep)
  // 4. Everything else -> Kana
  
  const segments: { text: string, type: 'KANJI' | 'KANA', reading?: string, source?: string }[] = [];
  let fullJyutping = "";
  let fullZhengyu = "";
  let fullKanaStr = ""; // Accumulator for the pure phonetic version

  let i = 0;
  const len = preProcessed.length;

  while (i < len) {
    let match: string | null = null;

    // A. Check for AI Preserved Keyword Match
    for (const keyword of preservedKeywords) {
      if (preProcessed.startsWith(keyword, i)) {
        match = keyword;
        break; // Found longest match due to sort
      }
    }

    if (match) {
      // === KANJI SEGMENT (Matched Keyword) ===
      
      // Get Jyutping for reference 
      const jpArray = await getJyutping(match);
      const jpString = jpArray.join(' ');
      fullJyutping += jpString + " ";

      // Generate Reading for Ruby (Convert the Jyutping of the Kanji to Kana)
      // We need to convert word-by-word or char-by-char for the reading
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
      fullKanaStr += reading; // For Full Kana copy

      // Advance index by length of match
      i += match.length;
    } else {
      // No keyword match found. Check individual character.
      const char = preProcessed[i];
      
      // B. Check for Latin/ASCII/Numbers (English Protection)
      // If valid ASCII (letters, numbers), preserve it. 
      // Do NOT send 'a' to kana converter, or it becomes 'あ'.
      // Range: 0-9, A-Z, a-z. 
      if (/[a-zA-Z0-9]/.test(char)) {
         segments.push({ text: char, type: 'KANJI' }); // No reading provided for ASCII
         fullZhengyu += char;
         fullJyutping += char; 
         fullKanaStr += char; // Keep English as is in Full Kana mode too
         i++;
         continue;
      }

      // C. Punctuation/Space
      if (/[\s\p{P}]/u.test(char)) {
        segments.push({ text: char, type: 'KANA' });
        fullZhengyu += char;
        fullJyutping += char + " ";
        fullKanaStr += char;
        i++;
        continue;
      }

      // D. Fallback: Convert to Kana (Verbs, Adjectives, Particles, unmatched terms)
      // Convert single char to Jyutping
      const jpArray = await getJyutping(char);
      const jp = jpArray[0]; // Single char input
      
      // Convert to Kana
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
    cantonese: JSON.stringify(preservedKeywords), // Log the keywords found
    jyutping: fullJyutping.trim(),
    zhengyu: fullZhengyu,
    fullKana: fullKanaStr,
    explanation: "Hybrid Pipeline v5.1 (Keyword List + Ruby Rendering)",
    engine: 'HYBRID',
    segments: segments,
    processLog: {
      step1_normalization: preProcessed,
      step2_ai_tagging: JSON.stringify(preservedKeywords, null, 2),
      step3_phonetic: fullZhengyu
    }
  };
};