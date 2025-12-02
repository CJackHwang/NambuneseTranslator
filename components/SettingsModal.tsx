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

  const handleChange = (field: keyof AISettings, value: any) => {
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
            throw new Error(`Failed to fetch models: ${res.status}`);
        }

        const data = await res.json();
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 transition-opacity">
      <div className="bg-white dark:bg-dl-dark-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90dvh] border border-gray-100 dark:border-gray-700">
        
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
          <h2 className="text-lg font-bold text-dl-primary dark:text-white">{t('settingsTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 text-dl-text dark:text-dl-dark-text">
          
          {/* Provider Selection */}
          <div className="space-y-3">
             <label className="text-sm font-bold text-dl-textSec dark:text-dl-dark-textSec uppercase tracking-wide">{t('aiProvider')}</label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['BUILTIN', 'OPENAI', 'GEMINI'] as AIProvider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setSettings(prev => ({ ...prev, provider: p }))}
                    className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                      settings.provider === p 
                      ? 'bg-dl-accent/10 border-dl-accent text-dl-accent ring-1 ring-dl-accent dark:bg-teal-900/30 dark:border-teal-500 dark:text-teal-400' 
                      : 'bg-white dark:bg-dl-dark-bg border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p === 'BUILTIN' ? t('providerBuiltin') : p === 'OPENAI' ? 'OpenAI' : 'Gemini'}
                  </button>
                ))}
             </div>
             {settings.provider === 'BUILTIN' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700 leading-relaxed">
                   {t('providerBuiltinDesc')}
                </p>
             )}
          </div>

          {/* High Precision Mode Toggle (For Custom Providers) */}
          {settings.provider !== 'BUILTIN' && (
             <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center h-5">
                   <input
                      id="highPrecision"
                      type="checkbox"
                      checked={settings.highPrecisionMode}
                      onChange={(e) => handleChange('highPrecisionMode', e.target.checked)}
                      className="w-4 h-4 text-dl-accent border-gray-300 rounded focus:ring-dl-accent bg-white dark:bg-gray-700 dark:border-gray-600"
                   />
                </div>
                <div className="ml-1 text-sm">
                   <label htmlFor="highPrecision" className="font-medium text-dl-text dark:text-dl-dark-text">{t('highPrecision')}</label>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('highPrecisionDesc')}</p>
                </div>
             </div>
          )}

          {/* OpenAI Settings */}
          {settings.provider === 'OPENAI' && (
             <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4 animate-fade-in">
                <div>
                   <label className="block text-sm font-medium mb-1">{t('apiEndpoint')}</label>
                   <input 
                      type="text" 
                      value={settings.openaiBaseUrl}
                      onChange={(e) => handleChange('openaiBaseUrl', e.target.value)}
                      placeholder="https://api.openai.com/v1/chat/completions"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">{t('apiKey')}</label>
                   <input 
                      type="password" 
                      value={settings.openaiKey}
                      onChange={(e) => handleChange('openaiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
                <div>
                   <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium">{t('modelName')}</label>
                        <button 
                            type="button"
                            onClick={fetchModels}
                            disabled={isFetchingModels || !settings.openaiKey}
                            className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded transition-colors ${isFetchingModels ? 'text-gray-400' : 'text-dl-accent dark:text-teal-400 hover:bg-dl-accent/10 dark:hover:bg-teal-900/30'}`}
                        >
                            {isFetchingModels ? 'Loading...' : t('fetchModels')}
                        </button>
                   </div>
                   
                   {fetchError && <div className="text-xs text-red-500 mb-1">{fetchError}</div>}

                   <div className="space-y-2">
                       <input 
                          type="text" 
                          value={settings.openaiModel}
                          onChange={(e) => handleChange('openaiModel', e.target.value)}
                          placeholder="gpt-4o-mini"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                       />
                       
                       {availableModels.length > 0 && (
                            <div className="relative">
                                <select
                                    onChange={(e) => handleChange('openaiModel', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 text-sm appearance-none pr-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    value={availableModels.includes(settings.openaiModel) ? settings.openaiModel : ""}
                                >
                                    <option value="" disabled>-- Select from list ({availableModels.length}) --</option>
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                       )}
                   </div>
                </div>
             </div>
          )}

          {/* Gemini Settings */}
          {settings.provider === 'GEMINI' && (
             <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4 animate-fade-in">
                <div>
                   <label className="block text-sm font-medium mb-1">{t('apiKey')}</label>
                   <input 
                      type="password" 
                      value={settings.geminiKey}
                      onChange={(e) => handleChange('geminiKey', e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">{t('modelName')}</label>
                   <input 
                      type="text" 
                      value={settings.geminiModel}
                      onChange={(e) => handleChange('geminiModel', e.target.value)}
                      placeholder="gemini-2.5-flash"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-dl-accent/20 focus:border-dl-accent text-sm"
                   />
                </div>
             </div>
          )}

        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 shrink-0">
           <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
           >
              {t('cancel')}
           </button>
           <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-bold text-white bg-dl-accent hover:bg-teal-700 dark:hover:bg-teal-600 rounded-lg shadow-sm transition-all active:scale-95"
           >
              {t('save')}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;