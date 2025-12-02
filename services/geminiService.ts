import { GoogleGenAI } from "@google/genai";
import { getSettings } from './settingsService';

// Built-in Defaults (SiliconFlow)
const BUILTIN_KEY = "sk-ctqddhrdjhvogmcyvdhoiookeasolhdnhclebxkbnzauswzh";
const BUILTIN_ENDPOINT = "https://api.siliconflow.cn/v1/chat/completions";
const DEFAULT_BUILTIN_MODEL = "Qwen/Qwen3-8B";

// === Prompts ===

// Legacy / Fast Mode Prompt
const PROMPT_ALL = `You are a linguistic expert.
Please extract all **Nouns** (Common & Proper), **Pronouns**, and **Numerals** from the user input.
Output strictly valid JSON with the format: {"keywords": ["term1", "term2", ...]}.
Do NOT extract verbs, adjectives, adverbs, particles, or punctuation.
Example: "张三去香港食咗饭" -> {"keywords": ["张三", "香港", "饭"]}`;

// High Precision Mode Prompts
const PROMPT_NOUNS = `You are a linguistic expert.
Please extract ONLY all **Common Nouns** (e.g. 苹果, 电脑) and **Proper Nouns** (Names, Places, Brands like 张三, 香港) from the user input.
Ignore pronouns and numbers.
Output strictly valid JSON: {"keywords": ["noun1", "noun2", ...]}.`;

const PROMPT_PRONOUNS = `You are a linguistic expert.
Please extract ONLY all **Pronouns** (e.g. 我, 你, 佢, 咱们, 那个, 边个) from the user input.
Ignore nouns and numbers.
Output strictly valid JSON: {"keywords": ["pronoun1", "pronoun2", ...]}.`;

const PROMPT_NUMERALS = `You are a linguistic expert.
Please extract ONLY all **Numerals** (Numbers) and **Quantifiers** (e.g. 一, 三个, 2025年, 第一) from the user input.
Ignore nouns and pronouns.
Output strictly valid JSON: {"keywords": ["num1", "num2", ...]}.`;

// === Helper Logic ===

// Retry Wrapper
const withRetry = async <T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1} failed. Retrying...`, error);
        }
    }
    throw lastError; // Throw final error if all retries fail
};

// === Providers ===

const OpenAIProvider = {
  extract: async (text: string, apiKey: string, endpoint: string, model: string, systemPrompt: string): Promise<string[]> => {
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
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0,
        max_tokens: 512,
        top_p: 1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return parseResponse(content, text);
  }
};

const GeminiProvider = {
  extract: async (text: string, apiKey: string, modelName: string, systemPrompt: string): Promise<string[]> => {
    if (!apiKey) throw new Error("Missing Gemini API Key");

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: modelName || 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0,
        responseMimeType: "application/json"
      }
    });

    return parseResponse(response.text || "", text);
  }
};

// === Shared Utils ===

const parseResponse = (content: string, originalText: string): string[] => {
    content = content.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    try {
        const parsed = JSON.parse(content);
        let keywords: string[] = [];
        if (parsed && Array.isArray(parsed.keywords)) {
            keywords = parsed.keywords;
        } else if (Array.isArray(parsed)) {
            keywords = parsed.filter((k: any) => typeof k === 'string');
        }
        return keywords.filter(k => k && typeof k === 'string' && originalText.includes(k));
    } catch (parseError) {
        console.warn("JSON Parse Failed, attempting regex fallback", parseError);
        const matches = content.match(/"([^"]+)"/g);
        if (matches) {
            return matches.map(m => m.replace(/"/g, '')).filter(k => originalText.includes(k));
        }
    }
    return [];
};

// === Public API ===

export const extractPreservedTerms = async (inputText: string): Promise<string[]> => {
  if (!inputText || !inputText.trim()) return [];

  const settings = getSettings();
  
  // High Precision Logic: Built-in is ALWAYS High Precision. Others depend on flag.
  const isBuiltIn = settings.provider === 'BUILTIN';
  const useHighPrecision = isBuiltIn || settings.highPrecisionMode;

  const performExtraction = async (prompt: string): Promise<string[]> => {
      if (settings.provider === 'GEMINI') {
          return await GeminiProvider.extract(inputText, settings.geminiKey, settings.geminiModel, prompt);
      } else {
          const isCustom = settings.provider === 'OPENAI';
          const apiKey = isCustom ? settings.openaiKey : BUILTIN_KEY;
          const endpoint = isCustom ? settings.openaiBaseUrl : BUILTIN_ENDPOINT;
          const model = isCustom ? settings.openaiModel : (settings.builtinModel || DEFAULT_BUILTIN_MODEL);
          return await OpenAIProvider.extract(inputText, apiKey, endpoint, model, prompt);
      }
  };

  try {
      if (useHighPrecision) {
          // Concurrent 3-Task Execution with Retry
          const tasks = [
              withRetry(() => performExtraction(PROMPT_NOUNS), 2),
              withRetry(() => performExtraction(PROMPT_PRONOUNS), 2),
              withRetry(() => performExtraction(PROMPT_NUMERALS), 2)
          ];

          const results = await Promise.all(tasks);
          
          // Merge results: [nouns[], pronouns[], nums[]] -> single unique array
          const combined = Array.from(new Set(results.flat()));
          return combined;

      } else {
          // Single Pass (Legacy/Fast)
          return await performExtraction(PROMPT_ALL);
      }

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error; // Propagate to UI
  }
};