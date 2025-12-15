import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSettings } from './settingsService';

// === Cache ===

/** LRU Cache for keyword extraction results to reduce API calls */
const CACHE_MAX_SIZE = 100;
const extractionCache = new Map<string, { keywords: string[], timestamp: number }>();

/**
 * Get cache key for the extraction request
 * Includes provider info to invalidate cache when provider changes
 */
const getCacheKey = (text: string, provider: string): string => {
  return `${provider}:${text}`;
};

/**
 * Get cached extraction result if available
 */
const getCachedResult = (key: string): string[] | null => {
  const cached = extractionCache.get(key);
  if (cached) {
    // Move to end (most recently used)
    extractionCache.delete(key);
    extractionCache.set(key, cached);
    console.log('Cache HIT for keyword extraction');
    return cached.keywords;
  }
  return null;
};

/**
 * Store extraction result in cache
 */
const setCacheResult = (key: string, keywords: string[]): void => {
  // Evict oldest entries if cache is full (LRU)
  if (extractionCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = extractionCache.keys().next().value;
    if (oldestKey) extractionCache.delete(oldestKey);
  }
  extractionCache.set(key, { keywords, timestamp: Date.now() });
};

/**
 * Clear the extraction cache (call when settings change)
 */
export const clearExtractionCache = (): void => {
  extractionCache.clear();
  console.log('Extraction cache cleared');
};

// === Prompt ===

const PROMPT_ALL = `You are a linguistic expert.
Please extract all **Nouns** (Common & Proper), **Pronouns**, and **Numerals** from the user input.
Output strictly valid JSON with the format: {"keywords": ["term1", "term2", ...]}.
Do NOT extract verbs, adjectives, adverbs, particles, or punctuation.
Example: "张三去香港食咗饭" -> {"keywords": ["张三", "香港", "饭"]}`;

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
  throw lastError;
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName || 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(text);
    const response = await result.response;
    return parseResponse(response.text() || "", text);
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
  const cacheKey = getCacheKey(inputText.trim(), settings.provider);

  // Check cache first
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult !== null) {
    return cachedResult;
  }

  // HanLP Provider - 使用专门的词性标注服务（推荐，默认）
  if (settings.provider === 'HANLP') {
    const { analyzeTextWithHanLP } = await import('./hanlpService');
    const analysis = await analyzeTextWithHanLP(inputText);
    setCacheResult(cacheKey, analysis.preservedTerms);
    return analysis.preservedTerms;
  }

  // AI Providers - 使用单次调用完成提取
  const performExtraction = async (): Promise<string[]> => {
    if (settings.provider === 'GEMINI') {
      return await GeminiProvider.extract(inputText, settings.geminiKey, settings.geminiModel, PROMPT_ALL);
    } else {
      // OPENAI provider
      return await OpenAIProvider.extract(inputText, settings.openaiKey, settings.openaiBaseUrl, settings.openaiModel, PROMPT_ALL);
    }
  };

  try {
    const result = await withRetry(performExtraction, 2);
    setCacheResult(cacheKey, result);
    return result;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};