import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConverterContext } from '../contexts/ConverterContext';
import InputPanel from './InputPanel';
import OutputPanel from './OutputPanel';
import ProcessDetails from './ProcessDetails';
import HistoryPanel from './HistoryPanel';

const Converter: React.FC = () => {
  const { t } = useLanguage();
  const {
    input, setInput,
    result, setResult,
    status, error: convertError,
    mode, setMode,
    isRealTime, setIsRealTime,
    convert,
    resourcesReady,
    resourcesError: dictError,
    retryResources: retry,
    restoreHistory,
    isHistoryVisible,
    setHistoryVisible
  } = useConverterContext();

  const [showDetails, setShowDetails] = useState(false);

  const handleManualConvert = () => convert(input);
  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  return (
    <div className="w-full h-full p-4 flex flex-col md:flex-row gap-4 relative overflow-hidden bg-[#0d0d0f]">
      {/* Background Grid Line Decoration */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Resource Loading Errors */}
      {dictError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-red-900/80 border border-red-500 text-red-200 text-xs font-mono rounded shadow flex items-center gap-2">
          <span>{dictError}</span>
          <button onClick={retry} className="px-2 py-0.5 bg-red-800 hover:bg-red-700 border border-red-400 uppercase">[RETRY]</button>
        </div>
      )}

      {/* Left Panel (Input) */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 border-r-0 border-b md:border-b-0 md:border-r border-stone-800/50 pb-4 md:pb-0 md:pr-2">
        <div className="flex items-center justify-between mb-2 px-2 border-b border-stone-800 pb-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">INPUT_BUFFER</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div>
          </div>
        </div>
        <div className="flex-1 min-h-0 relative group overflow-hidden">
          <div className="absolute inset-0 bg-[#151517] rounded border border-stone-800 shadow-inner group-hover:border-stone-700 transition-colors"></div>
          <div className="relative h-full p-2 crt-flicker overflow-y-auto">
            <InputPanel
              input={input}
              setInput={setInput}
              onConvert={handleManualConvert}
              onClear={handleClear}
              status={status}
              resourcesReady={resourcesReady}
              resourcesError={dictError}
              mode={mode}
              isRealTime={isRealTime}
            />
          </div>
        </div>
      </div>

      {/* Center Divider/Decoration (Desktop only) */}
      <div className="hidden md:flex flex-col items-center justify-center w-4 gap-2 opacity-50">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-stone-700 to-transparent"></div>
      </div>

      {/* Right Panel (Output) */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 md:pl-2">
        <div className="flex items-center justify-between mb-2 px-2 border-b border-stone-800 pb-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">OUTPUT_STREAM</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-900/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></div>
          </div>
        </div>
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#08090b] rounded border border-stone-800 shadow-inner"></div>
          <div className="relative h-full p-2 overflow-y-auto">
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
      </div>

      {/* History Panel Overlay - Rendered at root level for proper z-index */}
      <HistoryPanel
        isOpen={isHistoryVisible}
        onClose={() => setHistoryVisible(false)}
        onRestore={restoreHistory}
      />

      {/* Expanded Details Panel Overlay */}
      {mode === 'HYBRID' && result && showDetails && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm p-4 overflow-y-auto font-mono text-xs">
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-2 right-4 text-stone-500 hover:text-white"
          >
            [CLOSE_LOG]
          </button>
          <ProcessDetails processLog={result.processLog} aiError={result.aiError} />
        </div>
      )}
    </div>
  );
};

export default Converter;