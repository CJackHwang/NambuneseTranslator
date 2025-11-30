
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { convertHybrid } from '../services/hybridService';
import { convertRuleBased } from '../services/ruleService';
import { convertTextMode } from '../services/textConversionService';
import { initDictionary } from '../services/jyutpingService';
import { initShinjitai } from '../services/shinjitaiService';
import { TranslationResult, ConversionStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Converter: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [status, setStatus] = useState<ConversionStatus>(ConversionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'HYBRID' | 'PURE' | 'TEXT'>('HYBRID');
  const [isRealTime, setIsRealTime] = useState(false);
  const [areResourcesReady, setAreResourcesReady] = useState(false);
  const [dictLoadingError, setDictLoadingError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const debounceTimeoutRef = useRef<number | null>(null);

  // Initialize Dictionaries on Mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        await Promise.all([initDictionary(), initShinjitai()]);
        setAreResourcesReady(true);
      } catch (err: any) {
        console.error("Resources initialization failed", err);
        setDictLoadingError("Failed to load dictionaries.");
      }
    };
    loadResources();
  }, []);

  const handleConvert = useCallback(async (textToConvert: string) => {
    if (!textToConvert.trim()) {
        setResult(null);
        setStatus(ConversionStatus.IDLE);
        return;
    }
    if (!areResourcesReady) return;
    
    setStatus(ConversionStatus.LOADING);
    setError(null);
    
    try {
      let data: TranslationResult;
      
      if (mode === 'HYBRID') {
        data = await convertHybrid(textToConvert);
      } else if (mode === 'PURE') {
        data = await convertRuleBased(textToConvert);
      } else {
        data = await convertTextMode(textToConvert);
      }
      
      setResult(data);
      setStatus(ConversionStatus.SUCCESS);
    } catch (err: any) {
      setStatus(ConversionStatus.ERROR);
      console.error(err);
      let msg = err?.message || "Unknown error occurred";
      setError(msg);
    }
  }, [mode, areResourcesReady]);

  // Real-time Translation Effect
  useEffect(() => {
    if (!isRealTime || mode === 'HYBRID') return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      handleConvert(input);
    }, 600); // 600ms debounce

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [input, isRealTime, mode, handleConvert]);

  // Manual Trigger
  const onManualConvert = () => {
      handleConvert(input);
  };

  const retryDictLoad = async () => {
      setDictLoadingError(null);
      try {
          await Promise.all([initDictionary(), initShinjitai()]);
          setAreResourcesReady(true);
      } catch (e) {
          setDictLoadingError("Retry failed.");
      }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 pb-12 pt-6 w-full overflow-visible">
      
      {/* Dictionary Status */}
      {!areResourcesReady && !dictLoadingError && (
        <div className="mb-6 p-3 bg-md-secondaryContainer text-md-onSecondaryContainer rounded-xl flex items-center justify-center gap-3 text-sm font-medium animate-pulse border border-md-secondaryContainer">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            {t('resourcesLoading')}
        </div>
      )}

      {dictLoadingError && (
        <div className="mb-6 p-4 bg-md-error/10 text-md-error rounded-xl flex items-center justify-between border border-md-error/20">
            <span className="text-sm font-medium">{dictLoadingError}</span>
            <button onClick={retryDictLoad} className="px-4 py-1 bg-white rounded-full text-xs font-bold uppercase tracking-wider border border-md-error/20 hover:bg-md-error/5 transition-colors">{t('retry')}</button>
        </div>
      )}

      {/* Main Translation Card - FLAT STYLE */}
      <div className="bg-transparent overflow-visible flex flex-col md:flex-row min-h-[480px] relative z-0">
        
        {/* Left Side: Input */}
        <div className="flex-1 flex flex-col border border-md-outlineVariant relative z-10 bg-white rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px]">
           {/* Input Toolbar */}
           <div className="px-6 py-4 border-b border-md-outlineVariant/30 flex justify-between items-center bg-white rounded-t-[28px] md:rounded-tr-none">
              <span className="text-xs font-bold text-md-primary tracking-wider uppercase">{t('inputLabel')}</span>
              {input && (
                  <button 
                    onClick={() => { setInput(''); setResult(null); }}
                    className="text-md-outline hover:text-md-error transition-colors p-1 rounded-full hover:bg-md-surface2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
              )}
           </div>

           <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    onManualConvert();
                }
            }}
            placeholder={t('inputPlaceholder')}
            className="flex-1 w-full p-6 text-2xl sm:text-3xl bg-transparent border-none outline-none resize-none font-sans placeholder:text-md-outline/30 leading-normal rounded-bl-[28px] md:rounded-bl-none"
            spellCheck="false"
           />
           
           <div className="px-6 py-4 flex justify-between items-center text-xs text-md-outline/60 border-t border-transparent">
              <span>{input.length} {t('chars')}</span>
           </div>
        </div>

        {/* Right Side: Output */}
        <div className="flex-1 flex flex-col bg-md-surface2 relative z-10 rounded-b-[28px] md:rounded-bl-none md:rounded-r-[28px] border-x border-b border-md-outlineVariant md:border-t md:border-l-0">
            {/* Output Toolbar (Mode Selector) */}
           <div className="px-4 sm:px-6 py-3 border-b border-md-outlineVariant/30 flex flex-wrap gap-y-2 justify-between items-center bg-md-surface2 md:rounded-tr-[28px]">
              <div className="flex gap-1 bg-md-outlineVariant/10 p-1 rounded-xl border border-md-outlineVariant/20 overflow-x-auto max-w-full">
                  <button 
                    onClick={() => { setMode('HYBRID'); setIsRealTime(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                        mode === 'HYBRID' 
                        ? 'bg-white text-md-primary shadow-sm ring-1 ring-black/5' 
                        : 'text-md-outline hover:text-md-onSurfaceVariant hover:bg-white/50'
                    }`}
                  >
                    {t('modeHybrid')}
                  </button>
                  <button 
                    onClick={() => setMode('PURE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                        mode === 'PURE' 
                        ? 'bg-white text-md-primary shadow-sm ring-1 ring-black/5' 
                        : 'text-md-outline hover:text-md-onSurfaceVariant hover:bg-white/50'
                    }`}
                  >
                    {t('modePure')}
                  </button>
                  <button 
                    onClick={() => setMode('TEXT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                        mode === 'TEXT' 
                        ? 'bg-white text-md-primary shadow-sm ring-1 ring-black/5' 
                        : 'text-md-outline hover:text-md-onSurfaceVariant hover:bg-white/50'
                    }`}
                  >
                    {t('modeText')}
                  </button>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                 {mode !== 'HYBRID' && (
                     <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-black/5 rounded-lg transition-colors group select-none">
                        <span className="text-xs font-bold text-md-outline group-hover:text-md-onSurface transition-colors">{t('instant')}</span>
                        {/* Custom Switch */}
                        <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ease-out border ${isRealTime ? 'bg-md-primary border-md-primary' : 'bg-md-outlineVariant/40 border-transparent'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${isRealTime ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <input type="checkbox" checked={isRealTime} onChange={(e) => setIsRealTime(e.target.checked)} className="hidden" />
                     </label>
                 )}
              </div>
           </div>

           {/* Result Display */}
           <div className="flex-1 p-6 sm:p-8 flex flex-col relative min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xs font-bold text-md-primary tracking-wider uppercase">{t('resultLabel')}</h3>
              </div>

              {status === ConversionStatus.LOADING ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-md-surface2/50 z-20 backdrop-blur-[2px] rounded-b-[28px] md:rounded-bl-none md:rounded-br-[28px]">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-md-primary/20 border-t-md-primary rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-md-primary animate-pulse">{t('loading')}</span>
                      </div>
                  </div>
              ) : result ? (
                  <div className="flex-1 flex flex-col gap-6 animate-fade-in-up">
                      <div>
                        <p className="text-3xl sm:text-4xl leading-normal font-jp font-medium text-md-onSurface break-words">
                            {result.zhengyu}
                        </p>
                      </div>
                      
                      {/* Secondary Info - Hide in Text Mode if Jyutping is empty */}
                      {mode !== 'TEXT' && (
                          <div className="mt-auto pt-6 border-t border-md-outlineVariant/20">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                <div>
                                    <p className="text-sm font-mono text-md-secondary mb-1 tracking-tight">{result.jyutping}</p>
                                    <p className="text-[10px] sm:text-xs text-md-outline/60 uppercase tracking-wide">
                                        {mode === 'HYBRID' ? 'Nambu Standard v5.1 (AI)' : 'Transliteration Mode'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(result.zhengyu);
                                    }}
                                    className="self-end sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-bold text-md-primary bg-md-primary/5 hover:bg-md-primary/10 border border-md-primary/10 rounded-full transition-colors group"
                                >
                                    <span>{t('copy')}</span>
                                    <svg className="group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                </button>
                            </div>
                          </div>
                      )}
                      
                      {mode === 'TEXT' && (
                          <div className="mt-auto pt-6 border-t border-md-outlineVariant/20 flex justify-end">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(result.zhengyu);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-md-primary bg-md-primary/5 hover:bg-md-primary/10 border border-md-primary/10 rounded-full transition-colors group"
                                >
                                    <span>{t('copy')}</span>
                                    <svg className="group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                </button>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-md-outline/30 select-none">
                      <span className="text-lg font-medium">{t('waiting')}</span>
                  </div>
              )}
              
              {error && (
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-md-error/10 text-md-error text-sm rounded-xl border border-md-error/20 shadow-sm">
                    <span className="font-bold">Error:</span> {error}
                </div>
              )}
           </div>
        </div>
        
        {/* Floating Action Button */}
        {(!isRealTime || mode === 'HYBRID') && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 md:block hidden">
            {/* Matte background to prevent transparency line bleed */}
            <div className="absolute inset-1 bg-white rounded-full"></div>
            <button 
                onClick={() => onManualConvert()}
                disabled={status === ConversionStatus.LOADING || !input.trim() || !areResourcesReady}
                className={`
                    relative group h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 isolate
                    ${status === ConversionStatus.LOADING || !input.trim()
                        ? 'bg-md-surfaceVariant border-[6px] border-white shadow-sm cursor-not-allowed' 
                        : 'bg-md-primary border-[6px] border-white shadow-xl hover:scale-110 hover:bg-[#005454] active:scale-95 active:shadow-sm'}
                `}
                title={t('convert')}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="28" 
                    height="28" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-colors ${status === ConversionStatus.LOADING || !input.trim() ? 'text-md-outline' : 'text-white'}`}
                >
                    <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {(!isRealTime || mode === 'HYBRID') && (
          <div className="flex justify-center -mt-7 relative z-30 md:hidden">
             {/* Matte */}
            <div className="absolute w-14 h-14 bg-white rounded-full"></div>
            <button 
                onClick={() => onManualConvert()}
                disabled={status === ConversionStatus.LOADING || !input.trim() || !areResourcesReady}
                className={`
                    relative h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ring-4 ring-white
                    ${status === ConversionStatus.LOADING || !input.trim()
                        ? 'bg-md-surfaceVariant text-md-outline cursor-not-allowed' 
                        : 'bg-md-primary text-white hover:scale-105 active:scale-95'}
                `}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
            </button>
          </div>
      )}

      {/* Process Details - Expander (Only for Hybrid Mode when result exists) */}
      {mode === 'HYBRID' && result && result.processLog && (
        <div className="mt-8">
            <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs font-bold text-md-primary uppercase tracking-wider hover:opacity-70 transition-opacity mb-4"
            >
                {showDetails ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                )}
                {t('processDetails')}
            </button>
            
            {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-md-outlineVariant rounded-xl p-4 shadow-sm animate-fade-in-up">
                    <div className="p-3 bg-md-surface2 rounded-lg border border-md-outlineVariant/10">
                        <div className="text-[10px] font-bold text-md-outline uppercase mb-2">{t('step1')}</div>
                        <div className="text-sm font-jp break-words whitespace-pre-wrap text-md-onSurface">{result.processLog.step1_normalization}</div>
                    </div>
                    <div className="p-3 bg-md-surface2 rounded-lg border border-md-outlineVariant/10">
                        <div className="text-[10px] font-bold text-md-outline uppercase mb-2">{t('step2')}</div>
                        <div className="text-sm font-mono break-words whitespace-pre-wrap text-md-secondary">{result.processLog.step2_ai_tagging}</div>
                    </div>
                    <div className="p-3 bg-md-surface2 rounded-lg border border-md-outlineVariant/10">
                        <div className="text-[10px] font-bold text-md-outline uppercase mb-2">{t('step3')}</div>
                        <div className="text-sm font-jp break-words whitespace-pre-wrap text-md-primary font-medium">{result.processLog.step3_phonetic}</div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Informational Footer */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-md-outline/80">
         {/* Show different cards based on mode or general info */}
         {mode === 'TEXT' ? (
             <div className="md:col-span-3 p-5 rounded-2xl bg-white border border-md-outlineVariant shadow-none flex flex-col md:flex-row gap-6">
                 <div className="flex-1">
                    <h4 className="font-bold mb-2 text-md-primary">{t('textConversionTitle')}</h4>
                    <p className="text-xs leading-relaxed">{t('textConversionDesc')}</p>
                 </div>
                 <div className="flex-1 border-t md:border-t-0 md:border-l border-md-outlineVariant/20 pt-4 md:pt-0 md:pl-6">
                     <p className="text-xs leading-relaxed opacity-70">
                         {t('inputLabel')}: 简体/繁体中文<br/>
                         {t('resultLabel')}: 日本新字体 (Shinjitai)<br/>
                         Punctuation: ，→ 、
                     </p>
                 </div>
             </div>
         ) : (
            <>
                <div className="p-5 rounded-2xl bg-white border border-md-outlineVariant shadow-none">
                    <h4 className="font-bold mb-2 text-md-primary">{t('nounAnchorTitle')}</h4>
                    <p className="text-xs leading-relaxed">{t('nounAnchorDesc')}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-md-outlineVariant shadow-none">
                    <h4 className="font-bold mb-2 text-md-primary">{t('phoneticKanaTitle')}</h4>
                    <p className="text-xs leading-relaxed">{t('phoneticKanaDesc')}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-md-outlineVariant shadow-none">
                    <h4 className="font-bold mb-2 text-md-primary">{t('transliterationTitle')}</h4>
                    <p className="text-xs leading-relaxed">{t('transliterationDesc')}</p>
                </div>
            </>
         )}
      </div>

    </main>
  );
};

export default Converter;
