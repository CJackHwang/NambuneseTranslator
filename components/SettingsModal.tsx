
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../services/settingsService';
import { AISettings, AIProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
      setAvailableModels([]); // Reset models on open
      setFetchError(null);
    }
  }, [isOpen]);

  const handleChange = (field: keyof AISettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveSettings(settings);
    onClose();
  };

  const fetchModels = async () => {
    if (!settings.openaiBaseUrl || !settings.openaiKey) {
        setFetchError("Please enter API URL and Key first.");
        return;
    }

    setIsFetchingModels(true);
    setFetchError(null);
    setAvailableModels([]);

    try {
        // Construct Models Endpoint
        // Common pattern: Base URL ends in /chat/completions? 
        // Try to strip /chat/completions and append /models
        // Or if base url is just host, append /v1/models
        
        let modelsUrl = settings.openaiBaseUrl.trim();
        // Remove trailing slash
        if (modelsUrl.endsWith('/')) modelsUrl = modelsUrl.slice(0, -1);

        if (modelsUrl.endsWith('/chat/completions')) {
            modelsUrl = modelsUrl.replace(/\/chat\/completions$/, '/models');
        } else if (modelsUrl.endsWith('/v1')) {
            modelsUrl = `${modelsUrl}/models`;
        } else if (!modelsUrl.endsWith('/models')) {
            // Heuristic fallback: if it looks like a base URL (e.g. https://api.openai.com/v1), append /models
             modelsUrl = `${modelsUrl}/models`;
        }

        const res = await fetch(modelsUrl, {
            headers: {
                'Authorization': `Bearer ${settings.openaiKey}`
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch models: ${res.status}`);
        }

        const data = await res.json();
        // Standard OpenAI Format: { data: [{ id: "model-id", ... }] }
        if (data && Array.isArray(data.data)) {
            const modelIds = data.data.map((m: any) => m.id).sort();
            setAvailableModels(modelIds);
            if (modelIds.length === 0) setFetchError("No models found.");
        } else {
            setFetchError("Unexpected response format.");
        }
    } catch (e: any) {
        setFetchError(e.message || "Network error");
    } finally {
        setIsFetchingModels(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-bold text-dl-primary">{t('settingsTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          
          {/* Provider Selection */}
          <div className="space-y-3">
             <label className="text-sm font-bold text-dl-textSec uppercase tracking-wide">{t('aiProvider')}</label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['BUILTIN', 'OPENAI', 'GEMINI'] as AIProvider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setSettings(prev => ({ ...prev, provider: p }))}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                      settings.provider === p 
                      ? 'bg-dl-accent/10 border-dl-accent text-dl-accent ring-1 ring-dl-accent' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'BUILTIN' ? t('providerBuiltin') : p === 'OPENAI' ? 'OpenAI' : 'Gemini'}
                  </button>
                ))}
             </div>
             {settings.provider === 'BUILTIN' && (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-100 leading-relaxed">
                   {t('providerBuiltinDesc')}
                </p>
             )}
          </div>

          {/* OpenAI Settings */}
          {settings.provider === 'OPENAI' && (
             <div className="space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
                <div>
                   <label className="block text-sm font-medium text-dl-text mb-1">{t('apiEndpoint')}</label>
                   <input 
                      type="text" 
                      value={settings.openaiBaseUrl}
                      onChange={(e) => handleChange('openaiBaseUrl', e.target.value)}
                      placeholder="https://api.openai.com/v1/chat/completions"
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-dl-text mb-1">{t('apiKey')}</label>
                   <input 
                      type="password" 
                      value={settings.openaiKey}
                      onChange={(e) => handleChange('openaiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
                <div>
                   <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-dl-text">{t('modelName')}</label>
                        <button 
                            type="button"
                            onClick={fetchModels}
                            disabled={isFetchingModels || !settings.openaiKey}
                            className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded transition-colors ${isFetchingModels ? 'text-gray-400' : 'text-dl-accent hover:bg-dl-accent/10'}`}
                        >
                            {isFetchingModels ? 'Loading...' : t('fetchModels')}
                        </button>
                   </div>
                   
                   {/* Model Fetch Error */}
                   {fetchError && <div className="text-xs text-red-500 mb-1">{fetchError}</div>}

                   {/* Model Input/Select Combo */}
                   <div className="space-y-2">
                       <input 
                          type="text" 
                          value={settings.openaiModel}
                          onChange={(e) => handleChange('openaiModel', e.target.value)}
                          placeholder="gpt-4o-mini"
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                       />
                       
                       {availableModels.length > 0 && (
                            <div className="relative">
                                <select
                                    onChange={(e) => handleChange('openaiModel', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 text-sm appearance-none pr-8 cursor-pointer hover:bg-gray-100 transition-colors"
                                    value={availableModels.includes(settings.openaiModel) ? settings.openaiModel : ""}
                                >
                                    <option value="" disabled>-- Select from list ({availableModels.length}) --</option>
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                       )}
                   </div>
                </div>
             </div>
          )}

          {/* Gemini Settings */}
          {settings.provider === 'GEMINI' && (
             <div className="space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
                <div>
                   <label className="block text-sm font-medium text-dl-text mb-1">{t('apiKey')}</label>
                   <input 
                      type="password" 
                      value={settings.geminiKey}
                      onChange={(e) => handleChange('geminiKey', e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-dl-text mb-1">{t('modelName')}</label>
                   <input 
                      type="text" 
                      value={settings.geminiModel}
                      onChange={(e) => handleChange('geminiModel', e.target.value)}
                      placeholder="gemini-2.5-flash"
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
             </div>
          )}

        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
           <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
           >
              {t('cancel')}
           </button>
           <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-bold text-white bg-dl-accent hover:bg-teal-700 rounded-lg shadow-sm transition-all active:scale-95"
           >
              {t('save')}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
