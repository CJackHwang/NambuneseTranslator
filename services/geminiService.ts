
import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult } from "../types";

// Strict Semantic Tagger Prompt
// The input is ALREADY processed into Shinjitai.
// The AI must NOT translate or change content.
const HYBRID_SYSTEM_INSTRUCTION = `Role: Nambunese (Zhengyu) Semantic Tagger.

Task:
You will receive input text (which has already been normalized to Japanese Shinjitai).
Your ONLY job is to add semantic tags to the text based on Nambunese grammar rules.

STRICT RULES:
1. DO NOT TRANSLATE. Output the exact same characters as the input, just with tags added.
2. DO NOT CHANGE PUNCTUATION.
3. DO NOT ADD OR REMOVE WORDS.

Tagging Logic:
A. Noun Anchors -> Wrap in { }
   - Common Nouns (e.g. {学校}, {飯}, {時間})
   - Proper Nouns (e.g. {香港}, {田中})
   - Personal Pronouns (e.g. {我}, {你}, {佢})
   - Numerals & Quantities (e.g. {一}, {十}, {百})

B. Foreign Terms -> Wrap in [ ]
   - If the text contains purely latin script or katakana words that shouldn't be converted to Kana phonetically, wrap them in [ ].

C. Kana Conversion Targets -> Leave as RAW text
   - Verbs (e.g. 食, 去, 有, 係)
   - Adjectives (e.g. 好, 大, 靚)
   - Adverbs (e.g. 都, 仲, 先)
   - Particles (e.g. 咗, 緊, 嘅, 啊)
   - Function words, conjunctions, etc.

Examples:
- Input: "我明日去学校食飯"
  Output: "{我}{明日}去{学校}食{飯}"

- Input: "这个很好看"
  Output: "这个很{好}看" 
  (Note: In this specific pipeline, if the user input Mandarin, you tag based on the Mandarin text provided. '这个' is demonstrative -> raw. '很' is adverb -> raw. '好' is adj -> raw. '看' is verb -> raw.)

- Input: "佢係边个"
  Output: "{佢}係边个"
`;

export const convertHybridTagging = async (inputText: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Tag this text: "${inputText}"`,
    config: {
      systemInstruction: HYBRID_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tagged_text: { type: Type.STRING }
        }
      }
    }
  });

  let jsonText = response.text;
  
  // Handle empty response
  if (!jsonText) throw new Error("Empty AI response received");

  // Sanitize: Remove Markdown code blocks if present
  jsonText = jsonText.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json/, "").replace(/```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```/, "").replace(/```$/, "");
  }
  
  // Remove any leading/trailing whitespace again after cleanup
  jsonText = jsonText.trim();

  if (!jsonText) throw new Error("Response text is empty after cleanup");

  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data.tagged_text !== 'string') {
        throw new Error("Invalid JSON structure");
    }
    return data.tagged_text;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw Text:", jsonText);
    throw new Error("Failed to parse AI response: " + (e as Error).message);
  }
};

// Keep the old full AI function for comparison or fallback
export const convertToZhengyu = async (inputText: string): Promise<TranslationResult> => {
   return { original: inputText, cantonese: "", jyutping: "", zhengyu: "", engine: 'AI' };
};
