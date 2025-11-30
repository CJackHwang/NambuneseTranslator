
export interface TranslationResult {
  original: string;
  cantonese: string; // The AI generated intermediate step (with markers)
  jyutping: string;
  zhengyu: string;
  explanation?: string;
  engine?: 'RULE' | 'AI' | 'HYBRID';
  segments?: {
    text: string;
    type: 'KANJI' | 'KANA';
    source?: string; // jyutping source
  }[];
  processLog?: {
    step1_normalization: string;
    step2_ai_tagging: string;
    step3_phonetic: string;
  };
}

export enum ConversionStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type TranslationEngine = 'RULE' | 'AI' | 'HYBRID';
