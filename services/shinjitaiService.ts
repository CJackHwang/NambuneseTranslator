
/**
 * Shinjitai (New Font) Converter Service
 * 
 * Fetches and uses the dictionary from 'Hanzi2Kanji' project.
 * Source: https://github.com/Huifusu/Hanzi2Kanji
 * Dictionary: https://cdn.jsdelivr.net/gh/Huifusu/Hanzi2Kanji/loadDictionary.js
 * 
 * Logic:
 * 1. Checks if character is already in Shift-JIS Level 1 (Common Japanese).
 * 2. If yes, check for preferred variants.
 * 3. If no, check dictionary for conversion.
 */

const DICT_URL = 'https://cdn.jsdelivr.net/gh/Huifusu/Hanzi2Kanji/loadDictionary.js';

let dictionary: Record<string, string[]> | null = null;
let shiftjis1List: string | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Initialize the Shinjitai dictionary from the remote CDN.
 */
export const initShinjitai = async (): Promise<void> => {
  if (dictionary && shiftjis1List) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      console.log(`Loading Shinjitai dictionary from: ${DICT_URL}`);
      const response = await fetch(DICT_URL);
      if (!response.ok) {
        throw new Error(`Failed to load Shinjitai dictionary: ${response.status}`);
      }
      const script = await response.text();

      // The script assigns to window.shiftjis1List and window.dictionary.
      // We simulate a window object to capture these assignments.
      const mockWindow: any = {};
      
      // Execute the script content within a function scope passing mockWindow as 'window'
      const fn = new Function('window', script);
      fn(mockWindow);

      if (!mockWindow.dictionary || !mockWindow.shiftjis1List) {
         throw new Error('Dictionary script did not return expected data structure');
      }

      dictionary = mockWindow.dictionary;
      shiftjis1List = mockWindow.shiftjis1List;
      
      console.log("Shinjitai dictionary loaded successfully.");
    } catch (e) {
      console.error("Shinjitai dictionary load failed:", e);
      dictionary = null;
      shiftjis1List = null;
      loadPromise = null;
      throw e;
    }
  })();

  return loadPromise;
};

export const isShinjitaiLoaded = () => !!dictionary && !!shiftjis1List;

/**
 * Convert text to Japanese Shinjitai using the loaded dictionary.
 * Falls back to original text if dictionary is not loaded.
 */
export const toShinjitai = (text: string): string => {
  if (!dictionary || !shiftjis1List) {
    // If not loaded, return original text. 
    // In a production app, we might want to warn or ensure this isn't called before init.
    return text;
  }

  // Conversion logic adapted from Hanzi2Kanji original script
  return text.split('').map(char => {
      // 1. Is it a Shift-JIS Level 1 character? (Common Japanese Kanji)
      if (shiftjis1List!.indexOf(char) > -1) {
          // If it is, check if it has a preferred variant in the dictionary
          // The dictionary structure: key -> [Preferred, ...others]
          if (dictionary![char] && dictionary![char].length > 1) {
              return dictionary![char][0];
          }
          // Otherwise, it's already a good Japanese char
          return char;
      } 
      // 2. Not in Shift-JIS L1, is it in the dictionary?
      else if (dictionary![char]) {
          return dictionary![char][0];
      }
      
      // 3. Not found, keep original
      return char;
  }).join('');
};

/**
 * Normalize Punctuation to Japanese Style
 * e.g. ，-> 、 | “ -> 「 | ” -> 」
 */
export const normalizeJapanesePunctuation = (text: string): string => {
  return text
    .replace(/,/g, '、')
    .replace(/，/g, '、')
    .replace(/“/g, '「')
    .replace(/”/g, '」')
    .replace(/‘/g, '『')
    .replace(/’/g, '』')
    .replace(/\(/g, '（')
    .replace(/\)/g, '）')
    .replace(/!/g, '！')
    .replace(/\?/g, '？')
    .replace(/:/g, '：')
    .replace(/;/g, '；');
};
