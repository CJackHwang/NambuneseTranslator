
import { GoogleGenAI, Type } from "@google/genai";

// Strict Keyword Extraction Prompt
const KEYWORD_EXTRACTION_INSTRUCTION = `Role: Text Pattern Matcher / Keyword Extractor.

Task:
You will receive a raw input string. 
Your ONLY job is to identify and list specific substrings (Nouns, Pronouns, Anchors) exactly as they appear in the input.

CRITICAL RULES:
1. **NO TRANSLATION**: Do not translate "功能" to "機能". Do not translate "逻辑" to "論理".
2. **NO CORRECTION**: Do not fix typos. Do not convert Traditional/Simplified Chinese.
3. **EXACT SUBSTRING MATCH**: The output keywords MUST exist literally in the input string.
4. **EXCLUSION**: Do NOT include English words, numbers, or punctuation in the list.

Target Patterns to Extract:
1. Nouns (Common & Proper) e.g. "学校", "飯", "香港"
2. Personal Pronouns e.g. "我", "你", "佢"
3. Idioms e.g. "一石二鳥"

Input: "我明日去学校食飯"
Output: ["我", "明日", "学校", "飯"]

Input: "功能强大的逻辑"
Output: ["功能", "逻辑"]
(Do NOT output "機能", Do NOT output "邏輯")
`;

export const extractPreservedTerms = async (inputText: string): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Input Text: "${inputText}"`, // Send RAW text
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

  // Basic cleanup
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
    return []; 
  }
};
