import { AISettings } from '../types';

const SETTINGS_KEY = 'zhengyu_ai_settings_v1';

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'BUILTIN',
  builtinModel: "Qwen/Qwen3-8B",
  openaiBaseUrl: "https://api.siliconflow.cn/v1/chat/completions",
  openaiKey: "",
  openaiModel: "Qwen/Qwen3-8B",
  geminiKey: "",
  geminiModel: "gemini-2.5-flash",
  highPrecisionMode: false
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