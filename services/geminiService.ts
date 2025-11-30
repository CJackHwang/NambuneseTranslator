import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult } from "../types";

// Simplified Prompt for Hybrid Pipeline - v5.1 Spec
// The AI only handles semantic anchoring. Phonetics are handled by the rule engine.
const HYBRID_SYSTEM_INSTRUCTION = `Role: Nambu Official Nambunese (Zhengyu) Semantic Tagger.

Task:
1. Translate the input text (any language) into colloquial Hong Kong Cantonese.
2. Apply "Noun Anchor" tagging tags to the Cantonese text based on the grammatical category of each word.

Tagging Rules:
A. KEEP AS KANJI (Wrap in { }):
   - Nouns (Common & Proper)
   - Personal Pronouns (我, 你, 佢, 我哋, etc.)
   - Numerals (一, 二, 十, etc.)
   - Time Nouns (今日, 聽日, 今年)
   - Place Names & Organizations

B. CONVERT TO KANA (Leave as RAW text - DO NOT TAG):
   - Verbs (食, 去, 係, 有)
   - Adjectives (好, 大, 靚)
   - Adverbs (都, 仲, 先)
   - Particles (咗, 緊, 嘅, 啊)
   - Quantifiers/Classifiers (個, 隻)
   - Conjunctions (同, 因為)
   - Demonstratives & Question Words (呢個, 嗰度, 邊個 - Informal/Spoken style)

C. FOREIGN TERMS:
   - Convert foreign proper nouns directly to Japanese Katakana and wrap in [ ].

Examples:
- Input: "我明天去学校吃饭"
  Cantonese: "{我}{聽日}去{學校}食{飯}" 
  (Note: '去' and '食' are verbs -> raw; '學校' and '飯' are nouns -> tagged)

- Input: "这个很好看"
  Cantonese: "呢個好睇"
  (Note: '呢個' is demonstrative, '好' is adverb, '睇' is adj/verb -> all raw)

- Input: "他是谁"
  Cantonese: "{佢}係邊個"
  (Note: '佢' is pronoun -> tagged; '係' is verb, '邊個' is Q-word -> raw)
`;

export const convertHybridTagging = async (inputText: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Process this input: "${inputText}"`,
    config: {
      systemInstruction: HYBRID_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tagged_cantonese: { type: Type.STRING }
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
    if (!data || typeof data.tagged_cantonese !== 'string') {
        throw new Error("Invalid JSON structure");
    }
    return data.tagged_cantonese;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw Text:", jsonText);
    throw new Error("Failed to parse AI response: " + (e as Error).message);
  }
};

// Keep the old full AI function for comparison or fallback
export const convertToZhengyu = async (inputText: string): Promise<TranslationResult> => {
   return { original: inputText, cantonese: "", jyutping: "", zhengyu: "", engine: 'AI' };
};
