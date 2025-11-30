
/**
 * Jyutping Conversion Service
 * Fetches the official LSHK Cantonese-Jyutping table from CDN.
 * Source: https://github.com/lshk-org/jyutping-table
 */

const DICTIONARY_SOURCE = 'https://cdn.jsdelivr.net/gh/lshk-org/jyutping-table/list.tsv';

let dictCache: Map<string, string> | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Parse TSV data from LSHK
 * Format: CH	UCODE	JP	INIT	FINL	TONE	DESC	DESC_JP
 */
const parseDictionaryData = (text: string): Map<string, string> => {
  if (!text) return new Map();

  const map = new Map<string, string>();
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('CH\t')) continue;
    
    const parts = trimmed.split('\t');
    // Index 0: Character, Index 2: Jyutping
    if (parts.length >= 3) {
      const char = parts[0];
      const jp = parts[2];
      
      // LSHK table may contain multiple entries for polyphones.
      // We currently take the first one encountered as the default reading.
      if (char && jp && !map.has(char)) {
        map.set(char, jp);
      }
    }
  }
  
  return map;
};

const fetchDictionary = async (): Promise<Map<string, string>> => {
  try {
    console.log(`Loading Jyutping dictionary from: ${DICTIONARY_SOURCE}`);
    const response = await fetch(DICTIONARY_SOURCE);
    
    if (!response.ok) {
      throw new Error(`Dictionary load failed: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text) {
        throw new Error("Dictionary response body is empty");
    }

    const parsedMap = parseDictionaryData(text);
    
    if (parsedMap.size === 0) {
      throw new Error("Dictionary is empty after parsing");
    }

    console.log(`Dictionary loaded: ${parsedMap.size} characters`);
    return parsedMap;
  } catch (err) {
    console.error("Failed to fetch dictionary:", err);
    throw err;
  }
};

/**
 * Initialize the dictionary.
 * Returns the promise so UI can wait.
 */
export const initDictionary = async (): Promise<void> => {
  if (dictCache) return;
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      const newMap = await fetchDictionary();
      dictCache = newMap;
    } catch (err) {
      dictCache = null;
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
};

export const isDictionaryLoaded = (): boolean => {
  return !!dictCache;
};

/**
 * Convert text to Jyutping array using the loaded dictionary.
 * Returns original char if not found.
 */
export const getJyutping = async (text: string): Promise<string[]> => {
  if (!dictCache) {
    await initDictionary();
  }

  const result: string[] = [];
  const chars = Array.from(text); // Array.from handles surrogate pairs correctly

  for (const char of chars) {
    // Skip non-Chinese/Punctuation lookup optimization (ASCII range)
    // But keeping punctuation is handled by caller usually.
    if (/[\u0000-\u007F]/.test(char)) {
        result.push(char);
        continue;
    }

    const jp = dictCache?.get(char);
    result.push(jp || char);
  }
  return result;
};
