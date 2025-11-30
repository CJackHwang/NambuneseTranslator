import { GoogleGenAI, Type } from "@google/genai";

// Strict Keyword Extraction Prompt
// The AI must ONLY identify words that should be preserved as Kanji (Anchors).
const KEYWORD_EXTRACTION_INSTRUCTION = `Role: Nambunese (Zhengyu) Keyword Extractor.

Task:
You will receive input text (already normalized to Japanese Shinjitai).
Your job is to extract a list of specific words that act as "Semantic Anchors" (Nouns).
These words will be PRESERVED as Kanji. All other words (verbs, adjectives, particles) will be automatically converted to Kana by a separate algorithm.

Extraction Rules (Add these to the list):
1. Common Nouns (e.g. 学校, 飯, 時間, 世界)
2. Proper Nouns (e.g. 香港, 田中) - Chinese/Japanese names only.
3. Personal Pronouns (e.g. 我, 你, 佢, 咱们)
4. Numerals & Quantities (e.g. 一, 十, 百, 2025年)
5. Idioms/Chengyu acting as nouns (e.g. 一石二鳥)

Exclusion Rules (DO NOT add these):
1. Verbs (e.g. 食, 去, 有, 係, 跑) - Unless used as a noun.
2. Adjectives (e.g. 好, 大, 靚, 快乐)
3. Adverbs (e.g. 都, 仲, 先, 非常)
4. Particles (e.g. 咗, 緊, 嘅, 啊, 的, 了)
5. Punctuation.
6. **English/Latin Words** (e.g. Apple, iPhone, Bus) - Do NOT extract these. They must be handled physically by the system to prevent transliteration errors.

Example 1:
Input: "我明日去学校食飯"
Output: ["我", "明日", "学校", "飯"]

Example 2:
Input: "这个很好看"
Output: ["这个"]

Example 3:
Input: "I love Hong Kong"
Output: ["Hong Kong"] 
(Note: "I" and "love" are English, so they are excluded)
`;

export const extractPreservedTerms = async (inputText: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract keywords from: "${inputText}"`,
    config: {
      systemInstruction: KEYWORD_EXTRACTION_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  let jsonText = response.text;
  
  if (!jsonText) throw new Error("Empty AI response received");

  // Basic cleanup just in case
  jsonText = jsonText.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json/, "").replace(/```$/, "");
  }

  try {
    const data = JSON.parse(jsonText);
    if (!data || !Array.isArray(data.keywords)) {
        return [];
    }
    return data.keywords;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw Text:", jsonText);
    return []; // Fail safe: return empty list means everything converts to Kana (safe fallback)
  }
};