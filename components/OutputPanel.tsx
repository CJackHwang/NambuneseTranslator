import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationResult, ConversionStatus } from '../types';
import { useTTS } from '../hooks/useTTS';
import { ConverterMode } from '../hooks/useConverter';

interface OutputPanelProps {
  result: TranslationResult | null;
  status: ConversionStatus;
  error: string | null;
  mode: ConverterMode;
  setMode: (m: ConverterMode) => void;
  isRealTime: boolean;
  setIsRealTime: (v: boolean) => void;
  showDetails: boolean;
  setShowDetails: (v: boolean) => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  result,
  status,
  error,
  mode,
  setMode,
  isRealTime,
  setIsRealTime,
  showDetails,
  setShowDetails
}) => {
  const { t } = useLanguage();
  const { isLoading: ttsLoading, audioUrl, loadAudio, download: downloadAudio } = useTTS(result?.fullKana);
  const [showCopyFeedback, setShowCopyFeedback] = useState<string | null>(null);

  const handleCopy = (text: string, type: 'MAIN' | 'KANA') => {
    navigator.clipboard.writeText(text);
    setShowCopyFeedback(type);
    setTimeout(() => setShowCopyFeedback(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-dl-output dark:bg-dl-dark-surface relative h-full min-h-[300px] max-h-[60vh] md:max-h-full md:min-h-auto border-t md:border-t-0 md:border-l border-dl-border dark:border-dl-dark-border transition-colors">
      {/* Toolbar */}
      <div className="h-12 border-b border-dl-border dark:border-dl-dark-border flex items-center justify-between px-2 bg-dl-output md:bg-dl-output/50 dark:bg-dl-dark-surface md:dark:bg-dl-dark-surface/50 shrink-0 transition-colors">
        <div className="flex items-center gap-1">
          {(['HYBRID', 'PURE'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setIsRealTime(false); }}
              className={`
                px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap
                ${mode === m
                  ? 'text-dl-accent bg-white shadow-sm ring-1 ring-black/5 dark:bg-gray-700 dark:text-teal-300 dark:ring-white/5'
                  : 'text-dl-textSec dark:text-dl-dark-textSec hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:text-dl-text dark:hover:text-gray-200'}
              `}
            >
              {m === 'HYBRID' ? t('modeHybrid') : t('modePure')}
            </button>
          ))}
        </div>

        {mode !== 'HYBRID' && (
          <label className="flex items-center gap-2 cursor-pointer select-none px-2 group">
            <span className="text-xs font-medium text-dl-textSec dark:text-dl-dark-textSec group-hover:text-dl-text dark:group-hover:text-gray-200">{t('instant')}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isRealTime ? 'bg-dl-accent dark:bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isRealTime ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <input type="checkbox" checked={isRealTime} onChange={(e) => setIsRealTime(e.target.checked)} className="hidden" />
          </label>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 relative overflow-y-auto">
        {status === ConversionStatus.LOADING && mode === 'HYBRID' ? (
          <div className="flex flex-col items-center justify-center h-full text-dl-accent dark:text-teal-400 opacity-50 gap-3">
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">{t('loading')}</span>
          </div>
        ) : status === ConversionStatus.ERROR ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 text-center animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-30"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="font-bold text-sm mb-2">{t('errorTitle')}</p>
            <p className="text-xs text-gray-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded border border-red-100 dark:border-red-900/30 break-all max-w-[90%]">{error}</p>
          </div>
        ) : result ? (
          <div className="animate-fade-in pb-4">
            {result.aiError && (
              <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-3 flex gap-3 text-orange-800 dark:text-orange-200 rounded-r-md shadow-sm">
                 <svg className="w-5 h-5 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                 <div>
                   <p className="text-xs font-bold uppercase mb-0.5">{t('aiWarningTitle')}</p>
                   <p className="text-xs opacity-90">{t('aiWarningDesc')}: <span className="font-mono">{result.aiError}</span></p>
                 </div>
              </div>
            )}

            <div className="text-xl sm:text-2xl leading-loose font-jp text-dl-text dark:text-gray-100 break-words">
              {/* Render Segments for both Hybrid and Pure modes to support Ruby */}
              {result.segments ? (
                <div className="flex flex-wrap items-baseline gap-y-2">
                  {result.segments.map((seg, idx) => {
                    if (seg.type === 'KANJI' && seg.reading) {
                      return (
                        <ruby key={idx} className="mr-0.5 group cursor-help select-all">
                          {seg.text}
                          <rt className="text-[0.6em] text-dl-textSec/80 dark:text-gray-400 font-normal select-none group-hover:text-dl-accent dark:group-hover:text-teal-400 transition-colors">{seg.reading}</rt>
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
          <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <span className="text-sm">{t('waiting')}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`border-t border-dl-border dark:border-dl-dark-border bg-dl-output dark:bg-dl-dark-surface px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-h-[3.5rem] transition-all shrink-0`}>
        
        {/* Audio Player */}
        {result?.fullKana && audioUrl && (
          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[280px] order-1 sm:order-none animate-fade-in">
            <audio controls autoPlay src={audioUrl} className="w-full h-8 block" style={{ minWidth: '200px' }} />
          </div>
        )}

        <div className={`flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto ${audioUrl ? 'order-2 sm:order-none' : ''}`}>
          <div className="flex items-center gap-2">
            {mode === 'HYBRID' && result && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`p-2 rounded-md transition-colors ${showDetails ? 'bg-gray-200 dark:bg-gray-700 text-dl-text dark:text-gray-100' : 'text-dl-textSec dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title={t('processDetails')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h5"/><path d="M22 12h-5"/><path d="M7 12l2-6h6l2 6"/><path d="M7 12l-2 6h14l-2-6"/></svg>
              </button>
            )}

            {result?.fullKana && (
              <>
                {mode === 'HYBRID' && <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"></div>}
                
                {!audioUrl && (
                  <button
                    onClick={loadAudio}
                    disabled={ttsLoading}
                    className={`p-2 rounded-md transition-colors flex items-center gap-2 ${ttsLoading ? 'text-dl-accent dark:text-teal-400 cursor-wait' : 'text-dl-textSec dark:text-gray-400 hover:text-dl-primary dark:hover:text-white hover:bg-white dark:hover:bg-gray-700'}`}
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
                  onClick={downloadAudio}
                  disabled={ttsLoading}
                  className="p-2 rounded-md transition-colors text-dl-textSec dark:text-gray-400 hover:text-dl-primary dark:hover:text-white hover:bg-white dark:hover:bg-gray-700"
                  title={t('downloadAudio')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {result?.fullKana && (
              <button
                onClick={() => handleCopy(result.fullKana || '', 'KANA')}
                className="p-2 text-dl-textSec dark:text-gray-400 hover:text-dl-primary dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all flex items-center gap-1.5"
                title={t('copyKana')}
              >
                {showCopyFeedback === 'KANA' ? (
                  <svg className="text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <span className="text-xs font-bold border border-current rounded px-1 opacity-70">あ</span>
                )}
              </button>
            )}

            <button
              onClick={() => result && handleCopy(result.zhengyu, 'MAIN')}
              disabled={!result}
              className={`p-2 rounded-md transition-all flex items-center gap-1.5 ${!result ? 'text-gray-300 dark:text-gray-600' : 'text-dl-textSec dark:text-gray-400 hover:text-dl-primary dark:hover:text-white hover:bg-white dark:hover:bg-gray-700'}`}
              title={t('copy')}
            >
              {showCopyFeedback === 'MAIN' ? (
                <svg className="text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;