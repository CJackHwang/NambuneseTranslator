import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useResources } from '../hooks/useResources';
import { useConverter } from '../hooks/useConverter';
import InputPanel from './InputPanel';
import OutputPanel from './OutputPanel';
import ProcessDetails from './ProcessDetails';
import { ConversionStatus } from '../types';

const Converter: React.FC = () => {
  const { t } = useLanguage();
  const { isReady, error: dictError, retry } = useResources();
  const { 
    input, setInput, 
    result, setResult,
    status, error: convertError,
    mode, setMode,
    isRealTime, setIsRealTime,
    convert
  } = useConverter(isReady);
  
  const [showDetails, setShowDetails] = useState(false);

  const handleManualConvert = () => convert(input);
  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Resource Loading Errors */}
      {dictError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center justify-between border border-red-200 dark:border-red-900/30 shadow-sm animate-fade-in">
          <span className="text-sm font-medium">{dictError}</span>
          <button onClick={retry} className="px-4 py-1.5 bg-white dark:bg-gray-800 rounded shadow-sm text-xs font-bold uppercase hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/20">{t('retry')}</button>
        </div>
      )}

      {/* Main Interface */}
      <div className="bg-white dark:bg-dl-dark-surface rounded-xl shadow-card border border-dl-border dark:border-dl-dark-border flex flex-col md:flex-row min-h-[500px] md:h-[600px] overflow-hidden relative transition-colors">
        <div className="w-full md:w-1/2 h-full flex flex-col">
          <InputPanel
            input={input}
            setInput={setInput}
            onConvert={handleManualConvert}
            onClear={handleClear}
            status={status}
            resourcesReady={isReady}
            resourcesError={dictError}
            mode={mode}
            isRealTime={isRealTime}
          />
        </div>
        
        {/* Mobile Convert Button (Only when not realtime) */}
        {(!isRealTime || mode === 'HYBRID') && (
          <div className="md:hidden p-4 bg-white dark:bg-dl-dark-surface border-y border-dl-border dark:border-dl-dark-border flex justify-center sticky bottom-0 z-20 transition-colors">
             <button
                onClick={handleManualConvert}
                disabled={status === ConversionStatus.LOADING || !input.trim() || !isReady}
                className={`
                    w-full py-3 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2
                    ${status === ConversionStatus.LOADING || !input.trim() 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
                        : 'bg-dl-accent text-white active:scale-98 hover:bg-teal-700 dark:hover:bg-teal-600'}
                `}
             >
                 {status === ConversionStatus.LOADING ? (
                   <>
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    {t('loading')}
                   </>
                 ) : t('convert')}
             </button>
          </div>
        )}

        <div className="w-full md:w-1/2 h-full flex flex-col">
          <OutputPanel
            result={result}
            status={status}
            error={convertError}
            mode={mode}
            setMode={setMode}
            isRealTime={isRealTime}
            setIsRealTime={setIsRealTime}
            showDetails={showDetails}
            setShowDetails={setShowDetails}
          />
        </div>
      </div>

      {/* Expanded Details Panel */}
      {mode === 'HYBRID' && result && showDetails && (
        <ProcessDetails processLog={result.processLog} aiError={result.aiError} />
      )}

      {/* Footer Info Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-white dark:bg-dl-dark-surface rounded-xl border border-dl-border dark:border-dl-dark-border shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-dl-primary dark:text-gray-100 mb-2 text-sm">{t('nounAnchorTitle')}</h4>
            <p className="text-xs text-dl-textSec dark:text-gray-400 leading-relaxed">{t('nounAnchorDesc')}</p>
         </div>
         <div className="p-6 bg-white dark:bg-dl-dark-surface rounded-xl border border-dl-border dark:border-dl-dark-border shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-dl-primary dark:text-gray-100 mb-2 text-sm">{t('phoneticKanaTitle')}</h4>
            <p className="text-xs text-dl-textSec dark:text-gray-400 leading-relaxed">{t('phoneticKanaDesc')}</p>
         </div>
         <div className="p-6 bg-white dark:bg-dl-dark-surface rounded-xl border border-dl-border dark:border-dl-dark-border shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-dl-primary dark:text-gray-100 mb-2 text-sm">{t('transliterationTitle')}</h4>
            <p className="text-xs text-dl-textSec dark:text-gray-400 leading-relaxed">{t('transliterationDesc')}</p>
         </div>
      </div>
    </main>
  );
};

export default Converter;