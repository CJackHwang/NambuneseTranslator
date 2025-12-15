

import { extractPreservedTerms } from './geminiService';
import { getSettings } from './settingsService';
import { toShinjitai, initShinjitai, normalizeJapanesePunctuation } from './shinjitaiService';
import { getJyutpingBatch, getJyutpingSync, initDictionary } from './jyutpingService';
import { convertToKana } from './kanaConverter';
import { TranslationResult } from '../types';

export const convertHybrid = async (inputText: string): Promise<TranslationResult> => {
  // Step 0: Ensure Dictionaries are Loaded
  await Promise.all([initDictionary(), initShinjitai()]);

  // === PARALLEL PROCESSING ===

  // Path A: Normalization
  // Convert original Input -> Shinjitai
  let normalizedText = toShinjitai(inputText);
  // Apply Punctuation Rules (Global Japanese Style)
  normalizedText = normalizeJapanesePunctuation(normalizedText);

  // Path B: AI/HanLP Analysis (On Original Text)
  // We send the ORIGINAL text to AI/HanLP to ensure it sees the context correctly.
  let preservedTerms: string[] = [];
  let particles = new Set<string>();
  let aiErrorMsg: string | undefined = undefined;

  try {
    const settings = getSettings();

    if (settings.provider === 'HANLP') {
      const { analyzeTextWithHanLP } = await import('./hanlpService');
      const analysis = await analyzeTextWithHanLP(inputText);
      preservedTerms = analysis.preservedTerms;
      particles = analysis.particles;
    } else {
      preservedTerms = await extractPreservedTerms(inputText);
    }
  } catch (error: any) {
    console.error("AI/HanLP Analysis failed", error);
    // Capture the error message to display in UI
    aiErrorMsg = error.message || "Unknown AI Service Error";
    preservedTerms = [];
    particles = new Set();
  }

  // === UNIFICATION ===
  // Convert the extracted preserved terms to Shinjitai as well.
  const normalizedKeywords = preservedTerms.map(k => normalizeJapanesePunctuation(toShinjitai(k)));

  // Sort keywords by length (descending) to ensure greedy matching
  normalizedKeywords.sort((a, b) => b.length - a.length);

  // Normalize particles for matching on normalizedText
  const normalizedParticleTerms = Array.from(particles).map(p => normalizeJapanesePunctuation(toShinjitai(p)));
  normalizedParticleTerms.sort((a, b) => b.length - a.length);

  // === SEGMENTATION & CONVERSION ===

  const segments: { text: string, type: 'KANJI' | 'KANA', reading?: string, source?: string }[] = [];
  let fullJyutping = "";
  let fullNambunese = "";
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
      // === Keyword Segment Found ===

      // CRITICAL BUG FIX:
      // If the matched keyword is pure ASCII/English (e.g., "Nano", "AI", "Suno"), 
      // treat it as Text/Kanji segment WITHOUT reading to prevent Kana conversion.
      // This overrides AI tagging mistakes where English is tagged as a noun.
      if (/^[\x00-\x7F]+$/.test(match)) {
        segments.push({ text: match, type: 'KANJI' }); // No reading
        fullNambunese += match;
        fullJyutping += match + " ";
        fullKanaStr += match;
        i += match.length;
        continue;
      }

      // === KANJI SEGMENT (Matched Anchor) ===

      // Get Jyutping for reference (of the normalized term) - using sync batch lookup
      const matchChars = Array.from(match);
      const jpArray = getJyutpingBatch(matchChars);
      const jpString = jpArray.join(' ');
      fullJyutping += jpString + " ";

      // Generate Reading for Ruby
      const reading = jpArray.map(p => convertToKana(p)).join('');

      segments.push({
        text: match,
        type: 'KANJI',
        reading: reading
      });
      fullNambunese += match;
      fullKanaStr += reading;

      i += match.length;
    } else {
      // No keyword match

      // B. Check for Particle Match (HanLP only)
      let particleMatch: string | null = null;
      for (const particle of normalizedParticleTerms) {
        if (normalizedText.startsWith(particle, i)) {
          particleMatch = particle;
          break;
        }
      }

      if (particleMatch) {
        const particleChars = Array.from(particleMatch);
        const jpArray = getJyutpingBatch(particleChars);
        const jpString = jpArray.join(' ');
        const kana = jpArray.map(p => convertToKana(p, true)).join('');

        segments.push({ text: kana, type: 'KANA', source: jpString });
        fullNambunese += kana;
        fullJyutping += jpString + " ";
        fullKanaStr += kana;

        i += particleMatch.length;
        continue;
      }

      const char = normalizedText[i];

      // C. Check for Latin/ASCII/Numbers (English Protection)
      if (/[a-zA-Z0-9]/.test(char)) {
        segments.push({ text: char, type: 'KANJI' }); // No reading
        fullNambunese += char;
        fullJyutping += char;
        fullKanaStr += char;
        i++;
        continue;
      }

      // C. Punctuation
      if (/[\s\p{P}]/u.test(char)) {
        segments.push({ text: char, type: 'KANA' });
        fullNambunese += char;
        fullJyutping += char + " ";
        fullKanaStr += char;
        i++;
        continue;
      }

      // D. Fallback: Convert to Kana (Verbs, Adjectives, etc.) - using sync lookup
      const jp = getJyutpingSync(char);

      const kana = convertToKana(jp);

      segments.push({ text: kana, type: 'KANA', source: jp });
      fullNambunese += kana;
      fullJyutping += jp + " ";
      fullKanaStr += kana;

      i++;
    }
  }

  return {
    original: inputText,
    cantonese: JSON.stringify(preservedTerms),
    jyutping: fullJyutping.trim(),
    nambunese: fullNambunese,
    fullKana: fullKanaStr,
    explanation: "Hybrid Pipeline v5.2 (AI/HanLP Analysis + Unified Shinjitai Matching)",
    engine: 'HYBRID',
    aiError: aiErrorMsg,
    segments: segments,
    processLog: {
      step1_raw_input: inputText,
      step2_ai_extraction: aiErrorMsg
        ? `ERROR: ${aiErrorMsg}`
        : JSON.stringify({ preservedTerms, particles: Array.from(particles) }),
      step3_normalization_text: normalizedText,
      step4_normalization_keywords: JSON.stringify(normalizedKeywords),
      step5_segmentation: fullNambunese,
      step6_jyutping_generation: fullJyutping.trim(),
      step7_full_kana_generation: fullKanaStr
    }
  };
};