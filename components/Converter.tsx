

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { convertHybrid } from '../services/hybridService';
import { convertRuleBased } from '../services/ruleService';
import { convertTextMode } from '../services/textConversionService';
import { initDictionary } from '../services/jyutpingService';
import { initShinjitai } from '../services/shinjitaiService';
import { generateAudio, downloadBlob } from '../services/ttsService';
import { TranslationResult, ConversionStatus, AIProvider } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getSettings, saveSettings } from '../services/settingsService';

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
  const [showCopyFeedback, setShowCopyFeedback] = useState<string | null>(null);
  
  // Settings State for Quick Switcher
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('BUILTIN');
  
  // TTS States
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<number | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
    
    // Load Settings
    const s = getSettings();
    setCurrentProvider(s.provider);
  }, []);

  useEffect(() => {
      const load = () => {
          const s = getSettings();
          setCurrentProvider(s.provider);
      };
      window.addEventListener('focus', load);
      return () => window.removeEventListener('focus', load);
  }, []);

  // Reset Audio when result changes
  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [result]);

  // Cleanup Audio on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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

  const handleCopy = (text: string, type: 'MAIN' | 'KANA') => {
      navigator.clipboard.writeText(text);
      setShowCopyFeedback(type);
      setTimeout(() => setShowCopyFeedback(null), 2000);
  };

  const handleLoadAudio = async () => {
      if (!result?.fullKana) return;
      if (audioUrl) return; // Already loaded

      setTtsLoading(true);
      try {
          const blob = await generateAudio(result.fullKana);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
      } catch (e) {
          alert(t('ttsError'));
      } finally {
          setTtsLoading(false);
      }
  };

  const handleDownloadAudio = async () => {
      if (!result?.fullKana) return;
      setTtsLoading(true);
      try {
          // If we have a URL, fetch it back to blob (or use service again which hits cache)
          // Simplest is just call service, it hits cache.
          const blob = await generateAudio(result.fullKana);
          downloadBlob(blob, `nambu_audio_${Date.now()}.mp3`);
      } catch (e) {
          alert(t('ttsError'));
      } finally {
          setTtsLoading(false);
      }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-8">
      
      {/* Resource Loading Errors */}
      {dictLoadingError && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-between border border-red-200">
            <span className="text-sm font-medium">{dictLoadingError}</span>
            <button onClick={retryDictLoad} className="px-4 py-1 bg-white rounded shadow-sm text-xs font-bold uppercase hover:bg-red-50">{t('retry')}</button>
        </div>
      )}

      {/* MAIN TRANSLATOR INTERFACE */}
      <div className="bg-white rounded-xl shadow-card border border-dl-border flex flex-col md:flex-row min-h-[500px] overflow-hidden relative">
        
        {/* === LEFT SIDE: INPUT === */}
        <div className="flex-1 flex flex-col relative group">
           {/* Left Toolbar */}
           <div className="h-12 border-b border-dl-border flex items-center px-4 bg-white">
              <span className="text-sm font-bold text-dl-accent uppercase tracking-wide">{t('inputLabel')}</span>
              
              <div className="ml-auto flex items-center gap-2">
                 {!areResourcesReady && !dictLoadingError && (
                    <div className="flex items-center gap-2 text-xs text-dl-textSec">
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                    </div>
                 )}
                 {input && (
                    <button 
                        onClick={() => { setInput(''); setResult(null); textAreaRef.current?.focus(); }}
                        className="p-1.5 text-dl-textSec hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Clear"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                 )}
              </div>
           </div>

           {/* Input Text Area */}
           <div className="flex-1 relative">
                <textarea
                    ref={textAreaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            onManualConvert();
                        }
                    }}
                    placeholder={t('inputPlaceholder')}
                    className="w-full h-full p-6 text-xl sm:text-2xl bg-transparent border-none outline-none resize-none font-sans text-dl-text placeholder:text-gray-300 leading-relaxed"
                    spellCheck="false"
                />
           </div>
           
           {/* Left Footer (Char count) */}
           <div className="h-12 border-t border-dl-border/50 flex items-center justify-between px-4 text-xs text-gray-400">
               <div></div> {/* Spacer */}
               <div className="flex items-center">
                   {input.length} {t('chars')}
               </div>
           </div>
        </div>

        {/* Divider & Convert Button */}
        <div className="w-[1px] h-auto bg-dl-border hidden md:block relative z-10">
             {(!isRealTime || mode === 'HYBRID') && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                     <button
                        onClick={onManualConvert}
                        disabled={status === ConversionStatus.LOADING || !input.trim() || !areResourcesReady}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap
                            ${status === ConversionStatus.LOADING || !input.trim() 
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                                : 'bg-dl-accent text-white hover:bg-teal-800'}
                        `}
                     >
                        {status === ConversionStatus.LOADING ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                        )}
                        <span>{t('convert')}</span>
                     </button>
                 </div>
             )}
        </div>
        
        {/* Mobile Convert Button */}
        {(!isRealTime || mode === 'HYBRID') && (
            <div className="md:hidden p-4 bg-white border-y border-dl-border flex justify-center">
                 <button
                    onClick={onManualConvert}
                    disabled={status === ConversionStatus.LOADING || !input.trim() || !areResourcesReady}
                    className={`
                        w-full py-3 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2
                        ${status === ConversionStatus.LOADING || !input.trim() 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-dl-accent text-white'}
                    `}
                 >
                     {status === ConversionStatus.LOADING ? t('loading') : t('convert')}
                 </button>
            </div>
        )}

        {/* === RIGHT SIDE: OUTPUT === */}
        <div className="flex-1 flex flex-col bg-dl-output relative">
           
           {/* Right Toolbar */}
           <div className="h-12 border-b border-dl-border flex items-center justify-between px-2 bg-dl-output md:bg-dl-output/50">
               <div className="flex items-center gap-1">
                  {(['HYBRID', 'PURE', 'TEXT'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); setIsRealTime(false); }}
                        className={`
                            px-3 py-1.5 text-xs font-bold rounded-md transition-all
                            ${mode === m 
                                ? 'text-dl-accent bg-white shadow-sm ring-1 ring-black/5' 
                                : 'text-dl-textSec hover:bg-gray-200/50 hover:text-dl-text'}
                        `}
                      >
                          {m === 'HYBRID' && t('modeHybrid')}
                          {m === 'PURE' && t('modePure')}
                          {m === 'TEXT' && t('modeText')}
                      </button>
                  ))}
               </div>
               
               {/* Instant Toggle */}
               {mode !== 'HYBRID' && (
                 <label className="flex items-center gap-2 cursor-pointer select-none px-2">
                    <span className="text-xs font-medium text-dl-textSec">{t('instant')}</span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isRealTime ? 'bg-dl-accent' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isRealTime ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <input type="checkbox" checked={isRealTime} onChange={(e) => setIsRealTime(e.target.checked)} className="hidden" />
                 </label>
               )}
           </div>

           {/* Output Content */}
           <div className="flex-1 p-6 relative overflow-y-auto">
               {status === ConversionStatus.LOADING && mode === 'HYBRID' ? (
                   <div className="flex flex-col items-center justify-center h-full text-dl-accent opacity-50 gap-3">
                       <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                       <span className="text-sm font-medium">{t('loading')}</span>
                   </div>
               ) : status === ConversionStatus.ERROR ? (
                   <div className="h-full flex flex-col items-center justify-center text-red-500 p-6 text-center animate-fade-in">
                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                       <p className="font-bold text-lg mb-2">{t('errorTitle')}</p>
                       <p className="text-sm text-gray-500 bg-red-50 p-3 rounded border border-red-100 break-all max-w-full">{error}</p>
                   </div>
               ) : result ? (
                   <div className="animate-fade-in">
                        {/* WARNING BANNER if AI failed in Hybrid mode */}
                        {result.aiError && (
                            <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 p-3 flex gap-3 text-orange-800 rounded-r-md shadow-sm">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                <div>
                                    <p className="text-xs font-bold uppercase mb-0.5">{t('aiWarningTitle')}</p>
                                    <p className="text-xs opacity-90">{t('aiWarningDesc')}: <span className="font-mono">{result.aiError}</span></p>
                                </div>
                            </div>
                        )}

                        <div className="text-xl sm:text-2xl leading-loose font-jp text-dl-text break-words">
                            {mode === 'HYBRID' && result.segments ? (
                                <div className="flex flex-wrap items-baseline gap-y-2">
                                    {result.segments.map((seg, idx) => {
                                        if (seg.type === 'KANJI' && seg.reading) {
                                            return (
                                                <ruby key={idx} className="mr-0.5 group cursor-help select-all">
                                                    {seg.text}
                                                    <rt className="text-[0.6em] text-dl-textSec/80 font-normal select-none group-hover:text-dl-accent transition-colors">{seg.reading}</rt>
                                                </ruby>
                                            );
                                        }
                                        return <span key={idx}>{seg.text}</span>;
                                    })}
                                </div>
                            ) : (
                                <span>{result.zhengyu}</span>
                            )}
                        </div>
                   </div>
               ) : (
                   <div className="h-full flex items-center justify-center text-gray-300">
                       <span className="text-sm">{t('waiting')}</span>
                   </div>
               )}
           </div>

           {/* Right Footer */}
           <div className={`border-t border-dl-border bg-dl-output px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-h-[3.5rem] transition-all`}>
               
               {/* 1. Audio Player */}
               {result?.fullKana && audioUrl && (
                   <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[280px] order-1 sm:order-none animate-fade-in">
                        <audio 
                            controls 
                            autoPlay 
                            src={audioUrl} 
                            className="w-full h-8 block"
                            style={{ minWidth: '200px' }} 
                        />
                   </div>
               )}
   
               {/* 2. Control Buttons */}
               <div className={`flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto ${audioUrl ? 'order-2 sm:order-none' : ''}`}>
                   
                   {/* Left Group */}
                   <div className="flex items-center gap-2">
                        {mode === 'HYBRID' && result && (
                            <button 
                               onClick={() => setShowDetails(!showDetails)}
                               className={`p-2 rounded-md transition-colors ${showDetails ? 'bg-gray-200 text-dl-text' : 'text-dl-textSec hover:bg-gray-200'}`}
                               title={t('processDetails')}
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h5"/><path d="M22 12h-5"/><path d="M7 12l2-6h6l2 6"/><path d="M7 12l-2 6h14l-2-6"/></svg>
                            </button>
                        )}
                        
                        {result?.fullKana && (
                           <>
                              {mode === 'HYBRID' && <div className="w-[1px] h-4 bg-gray-300 mx-1 hidden sm:block"></div>}
                              
                              {!audioUrl && (
                                  <button
                                     onClick={handleLoadAudio}
                                     disabled={ttsLoading}
                                     className={`p-2 rounded-md transition-colors flex items-center gap-2 ${ttsLoading ? 'text-dl-accent cursor-wait' : 'text-dl-textSec hover:text-dl-primary hover:bg-white'}`}
                                     title={t('playAudio')}
                                  >
                                      {ttsLoading ? (
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                      )}
                                      <span className="text-xs font-medium hidden sm:inline">{t('playAudio')}</span>
                                  </button>
                              )}
   
                              <button
                                 onClick={handleDownloadAudio}
                                 disabled={ttsLoading}
                                 className="p-2 rounded-md transition-colors text-dl-textSec hover:text-dl-primary hover:bg-white"
                                 title={t('downloadAudio')}
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                              </button>
                           </>
                        )}
                   </div>
   
                   {/* Right Group */}
                   <div className="flex items-center gap-2 ml-auto sm:ml-0">
                       {result?.fullKana && mode === 'HYBRID' && (
                           <button 
                               onClick={() => handleCopy(result.fullKana || '', 'KANA')}
                               className="p-2 text-dl-textSec hover:text-dl-primary hover:bg-white rounded-md transition-all flex items-center gap-1.5"
                               title={t('copyKana')}
                           >
                                {showCopyFeedback === 'KANA' ? (
                                   <svg className="text-green-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                ) : (
                                   <span className="text-xs font-bold border border-current rounded px-1 opacity-70">あ</span>
                                )}
                           </button>
                       )}
   
                       <button 
                           onClick={() => result && handleCopy(result.zhengyu, 'MAIN')}
                           disabled={!result}
                           className={`p-2 rounded-md transition-all flex items-center gap-1.5 ${!result ? 'text-gray-300' : 'text-dl-textSec hover:text-dl-primary hover:bg-white'}`}
                           title={t('copy')}
                       >
                           {showCopyFeedback === 'MAIN' ? (
                               <svg className="text-green-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                           ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                           )}
                       </button>
                   </div>
               </div>
           </div>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {mode === 'HYBRID' && result && showDetails && result.processLog && (
        <div className="mt-4 bg-white rounded-xl shadow-card border border-dl-border p-6 animate-fade-in-up">
            <h4 className="text-sm font-bold text-dl-text uppercase mb-4 tracking-wide border-b border-dl-border pb-2">{t('processDetails')}</h4>
            <div className="space-y-4">
                
                {/* Step 1: Raw Input & AI Extraction (Parallel) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Raw Input</div>
                       <div className="text-sm bg-gray-50 p-2 rounded border border-gray-100 font-sans text-dl-text truncate" title={result.processLog.step1_raw_input}>{result.processLog.step1_raw_input}</div>
                   </div>
                   <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">AI Extracted (Raw Keywords)</div>
                       <div className={`text-sm p-2 rounded border font-mono text-xs break-all ${result.aiError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-dl-primary'}`}>
                           {result.processLog.step2_ai_extraction}
                       </div>
                   </div>
                </div>

                {/* Arrow Divider */}
                <div className="flex justify-center">
                    <svg className="text-gray-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                </div>

                {/* Step 2: Normalization (Unification) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Normalized Text (Shinjitai)</div>
                       <div className="text-sm bg-gray-50 p-2 rounded border border-gray-100 font-jp text-dl-text truncate">{result.processLog.step3_normalization_text}</div>
                   </div>
                   <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Normalized Keywords</div>
                       <div className="text-sm bg-teal-50 p-2 rounded border border-teal-100 font-mono text-teal-800 text-xs break-all">{result.processLog.step4_normalization_keywords}</div>
                   </div>
                </div>

                {/* Arrow Divider */}
                <div className="flex justify-center">
                    <svg className="text-gray-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                </div>

                {/* Step 3: Phonetic Processing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Intermediate Jyutping</div>
                       <div className="text-sm bg-purple-50 p-2 rounded border border-purple-100 font-mono text-purple-800 text-xs break-all">{result.processLog.step6_jyutping_generation}</div>
                   </div>
                   <div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Full Kana Output</div>
                       <div className="text-sm bg-indigo-50 p-2 rounded border border-indigo-100 font-jp text-indigo-800 text-xs break-all">{result.processLog.step7_full_kana_generation}</div>
                   </div>
                </div>

            </div>
        </div>
      )}

      {/* Footer Info Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-white rounded-xl border border-dl-border shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-dl-primary mb-2 text-sm">{t('nounAnchorTitle')}</h4>
            <p className="text-xs text-dl-textSec leading-relaxed">{t('nounAnchorDesc')}</p>
         </div>
         <div className="p-6 bg-white rounded-xl border border-dl-border shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-dl-primary mb-2 text-sm">{t('phoneticKanaTitle')}</h4>
            <p className="text-xs text-dl-textSec leading-relaxed">{t('phoneticKanaDesc')}</p>
         </div>
         <div className="p-6 bg-white rounded-xl border border-dl-border shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-dl-primary mb-2 text-sm">{t('transliterationTitle')}</h4>
            <p className="text-xs text-dl-textSec leading-relaxed">{t('transliterationDesc')}</p>
         </div>
      </div>

    </main>
  );
};

export default Converter;