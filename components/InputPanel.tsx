import React, { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ConversionStatus } from '../types';

interface InputPanelProps {
  input: string;
  setInput: (val: string) => void;
  onConvert: () => void;
  onClear: () => void;
  status: ConversionStatus;
  resourcesReady: boolean;
  resourcesError: string | null;
  mode: string;
  isRealTime: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
  input,
  setInput,
  onConvert,
  onClear,
  status,
  resourcesReady,
  resourcesError,
  mode,
  isRealTime
}) => {
  const { t } = useLanguage();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onConvert();
    }
  };

  const isLoading = status === ConversionStatus.LOADING;
  const canConvert = input.trim() && resourcesReady && !isLoading;
  const showManualButton = !isRealTime || mode === 'HYBRID';

  return (
    <div className="flex-1 flex flex-col relative h-full min-h-[300px] max-h-[50vh] md:max-h-full md:min-h-auto">
      {/* Toolbar */}
      <div className="h-12 border-b border-dl-border dark:border-dl-dark-border flex items-center px-4 bg-white dark:bg-dl-dark-surface shrink-0 justify-between transition-colors">
        <span className="text-sm font-bold text-dl-accent dark:text-teal-400 uppercase tracking-wide">{t('inputLabel')}</span>
        <div className="flex items-center gap-2">
          {!resourcesReady && !resourcesError && (
            <div className="flex items-center gap-2 text-xs text-dl-textSec dark:text-dl-dark-textSec animate-pulse">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>{t('resourcesLoading')}</span>
            </div>
          )}
          {input && (
            <button
              onClick={() => { onClear(); textAreaRef.current?.focus(); }}
              className="p-1.5 text-dl-textSec dark:text-dl-dark-textSec hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Clear"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Text Area Container */}
      <div className="flex-1 relative bg-white dark:bg-dl-dark-surface transition-colors">
        <textarea
          ref={textAreaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          className="absolute inset-0 w-full h-full p-6 text-xl sm:text-2xl bg-transparent border-none outline-none resize-none font-sans text-dl-text dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 leading-relaxed"
          spellCheck="false"
        />
      </div>

      {/* Footer */}
      <div className="h-14 border-t border-dl-border dark:border-dl-dark-border flex items-center justify-between px-4 bg-gray-50/30 dark:bg-gray-800/30 shrink-0 transition-colors">
        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {input.length} {t('chars')}
        </div>
        <div className="hidden md:block">
          {showManualButton && (
            <button
              onClick={onConvert}
              disabled={!canConvert}
              className={`
                px-6 py-1.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2
                ${!canConvert
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 cursor-not-allowed'
                  : 'bg-dl-accent text-white hover:bg-teal-800 dark:hover:bg-teal-600'}
              `}
            >
              {isLoading && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
              {isLoading ? t('loading') : t('convert')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputPanel;