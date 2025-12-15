import { AISettings } from '../types';

const SETTINGS_KEY = 'nambunese_ai_settings_v1';

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'HANLP',
  openaiBaseUrl: "https://api.siliconflow.cn/v1/chat/completions",
  openaiKey: "",
  openaiModel: "Qwen/Qwen3-8B",
  geminiKey: "",
  geminiModel: "gemini-2.5-flash"
};

export const getSettings = (): AISettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      // Merge with default to ensure new fields exist
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AISettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};