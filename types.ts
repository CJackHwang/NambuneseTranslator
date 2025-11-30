
export interface TranslationResult {
  original: string;
  cantonese: string; // The AI generated intermediate step (keyword list or raw text)
  jyutping: string;
  zhengyu: string;
  fullKana?: string; // The full phonetic representation (Pure Kana)
  explanation?: string;
  engine?: 'RULE' | 'AI' | 'HYBRID';
  segments?: {
    text: string;
    type: 'KANJI' | 'KANA';
    reading?: string; // The Kana reading for Ruby display (only for KANJI type)
    source?: string; // jyutping source
  }[];
  processLog?: {
    step1_raw_input: string;      // The original input
    step2_ai_extraction: string;  // What AI extracted (Raw Keywords)
    step3_normalization_text: string; // Input converted to Shinjitai
    step4_normalization_keywords: string; // AI Keywords converted to Shinjitai
    step5_segmentation: string;   // Final matching result preview
  };
}

export enum ConversionStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type TranslationEngine = 'RULE' | 'AI' | 'HYBRID';
