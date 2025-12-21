import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../services/settingsService';
import { clearExtractionCache } from '../services/geminiService';
import { AIProvider, AISettings } from '../types';

interface SettingsScreenProps {
    onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        setSettings(getSettings());
        setAvailableModels([]);
        setFetchError(null);
    }, []);

    const handleChange = (field: keyof AISettings, value: any) => {
        setSettings((prev: AISettings) => {
            const newSettings = { ...prev, [field]: value };
            saveSettings(newSettings); // Auto-save on every change
            if (field === 'provider' && value !== 'HANLP') {
                // Clear cache if switching away from HanLP? Or maybe just keep it simple.
                // The original logic only cleared extraction cache on explicit save.
                clearExtractionCache();
            }
            return newSettings;
        });
    };

    const fetchModels = async () => {
        if (!settings.openaiBaseUrl || !settings.openaiKey) {
            setFetchError("URL & KEY REQ.");
            return;
        }

        setIsFetchingModels(true);
        setFetchError(null);
        setAvailableModels([]);

        try {
            let modelsUrl = settings.openaiBaseUrl.trim();
            if (modelsUrl.endsWith('/')) modelsUrl = modelsUrl.slice(0, -1);

            if (modelsUrl.endsWith('/chat/completions')) {
                modelsUrl = modelsUrl.replace(/\/chat\/completions$/, '/models');
            } else if (modelsUrl.endsWith('/v1')) {
                modelsUrl = `${modelsUrl}/models`;
            } else if (!modelsUrl.endsWith('/models')) {
                modelsUrl = `${modelsUrl}/models`;
            }

            const res = await fetch(modelsUrl, {
                headers: {
                    'Authorization': `Bearer ${settings.openaiKey}`
                }
            });

            if (!res.ok) {
                throw new Error(`ERR:${res.status}`);
            }

            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                const modelIds = data.data.map((m: any) => m.id).sort();
                setAvailableModels(modelIds);
                if (modelIds.length === 0) setFetchError("NO_MODELS_FOUND");
            } else {
                setFetchError("BAD_FORMAT");
            }
        } catch (e: any) {
            setFetchError(e.message || "NET_ERR");
        } finally {
            setIsFetchingModels(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#151515] text-stone-300 font-mono relative overflow-hidden">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20 opacity-20"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1c] border-b border-stone-700 shadow-md z-30 shrink-0">
                <div className="flex items-center gap-2 text-stone-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <h2 className="text-sm font-bold uppercase tracking-widest">{t('settingsTitle')}</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-300 relative z-10 custom-scrollbar">
                {/* Provider Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest border-b border-stone-800 pb-1 block">{t('aiProvider')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['HANLP', 'OPENAI', 'GEMINI'] as AIProvider[]).map(p => (
                            <button
                                key={p}
                                onClick={() => handleChange('provider', p)}
                                className={`px-3 py-2 border font-bold uppercase text-[10px] tracking-wider transition-all ${settings.provider === p
                                    ? 'bg-stone-700 text-stone-200 border-stone-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                                    : 'bg-black/20 border-stone-800 text-stone-600 hover:border-stone-600 hover:text-stone-400'
                                    }`}
                            >
                                {p === 'HANLP' ? 'HanLP' : p === 'OPENAI' ? 'OpenAI' : 'Gemini'}
                            </button>
                        ))}
                    </div>
                    {settings.provider === 'HANLP' && (
                        <div className="text-[10px] text-stone-400 bg-stone-900/50 p-3 border-l-2 border-stone-500 leading-relaxed font-mono">
                            <span className="font-bold text-stone-300">INFO:</span> {t('hanlpInfo')}
                        </div>
                    )}
                </div>

                {/* OpenAI Settings */}
                {settings.provider === 'OPENAI' && (
                    <div className="space-y-4 pt-2 animate-fade-in">
                        <div>
                            <label className="block text-[10px] font-bold mb-1 uppercase text-stone-500 tracking-wider">ENDPOINT_URL</label>
                            <input
                                type="text"
                                value={settings.openaiBaseUrl}
                                onChange={(e) => handleChange('openaiBaseUrl', e.target.value)}
                                placeholder="https://api.openai.com/v1/chat/completions"
                                className="w-full px-3 py-2 bg-black/40 text-stone-300 border border-stone-700 focus:border-stone-500 focus:outline-none placeholder:text-stone-800 text-xs font-mono transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold mb-1 uppercase text-stone-500 tracking-wider">API_KEY (SECRET)</label>
                            <input
                                type="password"
                                value={settings.openaiKey}
                                onChange={(e) => handleChange('openaiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-3 py-2 bg-black/40 text-stone-300 border border-stone-700 focus:border-stone-500 focus:outline-none placeholder:text-stone-800 text-xs font-mono transition-colors"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-[10px] font-bold uppercase text-stone-500 tracking-wider">MODEL_ID</label>
                                <button
                                    type="button"
                                    onClick={fetchModels}
                                    disabled={isFetchingModels || !settings.openaiKey}
                                    className={`text-[10px] font-bold uppercase tracking-wide px-1 border border-transparent hover:border-stone-600 ${isFetchingModels ? 'text-stone-700' : 'text-stone-400 hover:text-stone-200'}`}
                                >
                                    {isFetchingModels ? 'SCANNING...' : '[ FETCH_MODELS ]'}
                                </button>
                            </div>

                            {fetchError && <div className="text-[10px] text-red-800/80 mb-1 font-bold">{fetchError}</div>}

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={settings.openaiModel}
                                    onChange={(e) => handleChange('openaiModel', e.target.value)}
                                    placeholder="gpt-4o-mini"
                                    className="w-full px-3 py-2 bg-black/40 text-stone-300 border border-stone-700 focus:border-stone-500 focus:outline-none placeholder:text-stone-800 text-xs font-mono transition-colors"
                                />

                                {availableModels.length > 0 && (
                                    <div className="relative">
                                        <select
                                            onChange={(e) => handleChange('openaiModel', e.target.value)}
                                            className="w-full px-3 py-2 bg-black/40 text-stone-300 border border-stone-700 focus:border-stone-500 focus:outline-none text-xs font-mono appearance-none uppercase"
                                            value={availableModels.includes(settings.openaiModel) ? settings.openaiModel : ""}
                                        >
                                            <option value="" disabled>-- SELECT MODEL --</option>
                                            {availableModels.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-2.5 pointer-events-none text-stone-600">▼</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gemini Settings */}
                {settings.provider === 'GEMINI' && (
                    <div className="space-y-4 pt-2 animate-fade-in">
                        <div>
                            <label className="block text-[10px] font-bold mb-1 uppercase text-stone-500 tracking-wider">API_KEY</label>
                            <input
                                type="password"
                                value={settings.geminiKey}
                                onChange={(e) => handleChange('geminiKey', e.target.value)}
                                placeholder="AIza..."
                                className="w-full px-3 py-2 bg-black/40 text-stone-300 border border-stone-700 focus:border-stone-500 focus:outline-none placeholder:text-stone-800 text-xs font-mono transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold mb-1 uppercase text-stone-500 tracking-wider">MODEL_ID</label>
                            <input
                                type="text"
                                value={settings.geminiModel}
                                onChange={(e) => handleChange('geminiModel', e.target.value)}
                                placeholder="gemini-2.5-flash"
                                className="w-full px-3 py-2 bg-black/40 text-stone-300 border border-stone-700 focus:border-stone-500 focus:outline-none placeholder:text-stone-800 text-xs font-mono transition-colors"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Status Line */}
            <div className="px-3 py-1 bg-[#1a1a1c] border-t border-stone-700 text-[10px] text-stone-600 flex justify-between uppercase tracking-wider z-30 shrink-0">
                <span>CONFIG_MODE</span>
                <span>SYSTEM_RDY</span>
            </div>
        </div>
    );
};

export default SettingsScreen;
