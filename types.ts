

export interface TranslationResult {
  original: string;
  cantonese: string; // The AI generated intermediate step (keyword list or raw text)
  jyutping: string;
  nambunese: string;
  fullKana?: string; // The full phonetic representation (Pure Kana)
  explanation?: string;
  engine?: 'RULE' | 'AI' | 'HYBRID';
  aiError?: string; // Captures non-fatal AI errors (fallback mode triggered)
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
    step6_jyutping_generation: string; // The intermediate phonetic sequence
    step7_full_kana_generation: string; // The pure kana calculation (for ruby/fallback)
  };
}

export enum ConversionStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type TranslationEngine = 'RULE' | 'AI' | 'HYBRID';

export type AIProvider = 'HANLP' | 'OPENAI' | 'GEMINI';

export interface AISettings {
  provider: AIProvider;
  // OpenAI Compatible
  openaiBaseUrl: string;
  openaiKey: string;
  openaiModel: string;
  // Gemini
  geminiKey: string;
  geminiModel: string;
}