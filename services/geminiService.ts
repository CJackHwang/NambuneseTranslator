
import { GoogleGenAI } from "@google/genai";
import { getSettings } from './settingsService';

// Built-in Defaults (SiliconFlow)
const BUILTIN_KEY = "sk-ctqddhrdjhvogmcyvdhoiookeasolhdnhclebxkbnzauswzh";
const BUILTIN_ENDPOINT = "https://api.siliconflow.cn/v1/chat/completions";
// BUILTIN_MODEL is now dynamic based on settings, but we keep a fallback constant
const DEFAULT_BUILTIN_MODEL = "Qwen/Qwen3-8B";

const SYSTEM_PROMPT = `You are a linguistic expert.
Please extract all **Nouns** (Common & Proper), **Pronouns**, and **Numerals** from the user input.
Output strictly valid JSON with the format: {"keywords": ["term1", "term2", ...]}.
Do NOT extract verbs, adjectives, adverbs, particles, or punctuation.

Example Input: "这是一个非常棒的UI改进方向"
Output: {"keywords": ["这", "一", "UI", "改进", "方向"]}

Example Input: "张三去香港食咗饭"
Output: {"keywords": ["张三", "香港", "饭"]}`;

export const extractPreservedTerms = async (inputText: string): Promise<string[]> => {
  // If input is empty, return empty
  if (!inputText || !inputText.trim()) return [];

  const settings = getSettings();

  try {
    if (settings.provider === 'GEMINI') {
      return await extractWithGemini(inputText, settings.geminiKey, settings.geminiModel);
    } else {
      // OpenAI Compatible (Built-in or Custom)
      const isCustom = settings.provider === 'OPENAI';
      const apiKey = isCustom ? settings.openaiKey : BUILTIN_KEY;
      const endpoint = isCustom ? settings.openaiBaseUrl : BUILTIN_ENDPOINT;
      const model = isCustom ? settings.openaiModel : (settings.builtinModel || DEFAULT_BUILTIN_MODEL);

      return await extractWithOpenAI(inputText, apiKey, endpoint, model);
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    return [];
  }
};

const parseResponse = (content: string, originalText: string): string[] => {
    // Clean up content (remove markdown backticks if present)
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.keywords)) {
            return parsed.keywords.filter((k: string) => originalText.includes(k));
        } else if (Array.isArray(parsed)) {
            return parsed.filter((k: any) => typeof k === 'string' && originalText.includes(k));
        }
    } catch (parseError) {
        console.warn("JSON Parse Failed, trying simplified extraction", parseError, content);
        const matches = content.match(/"([^"]+)"/g);
        if (matches) {
            return matches.map(m => m.replace(/"/g, '')).filter(k => originalText.includes(k));
        }
    }
    return [];
};

const extractWithOpenAI = async (text: string, apiKey: string, endpoint: string, model: string): Promise<string[]> => {
    if (!apiKey) throw new Error("Missing API Key");

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text }
        ],
        temperature: 0, // Set to 0 for maximum stability
        max_tokens: 512,
        top_p: 1, // Standard for deterministic results
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return parseResponse(content, text);
};

const extractWithGemini = async (text: string, apiKey: string, modelName: string): Promise<string[]> => {
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const ai = new GoogleGenAI({ apiKey });
    const model = ai.models.generateContent; 
    
    // Note: To match strict generic structure, we use generic generateContent
    // but we need to create the client with the model in context or just call generic method
    // The instructions say: ai.models.generateContent({ model: '...', contents: '...' })
    
    const response = await ai.models.generateContent({
        model: modelName || 'gemini-2.5-flash',
        contents: text,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0, // Set to 0 for maximum stability
            responseMimeType: "application/json"
        }
    });

    return parseResponse(response.text || "", text);
};
