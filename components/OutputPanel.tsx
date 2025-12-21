import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationResult, ConversionStatus } from '../types';
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
  showDetails,
  setShowDetails
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col relative h-full w-full font-mono overflow-hidden">

      {/* Content Area */}
      <div className="flex-1 p-6 relative overflow-y-auto bg-crt-base shadow-inner">
        {status === ConversionStatus.LOADING && mode === 'HYBRID' ? (
          <div className="flex flex-col items-center justify-center h-full text-dl-accent opacity-50 gap-2">
            <div className="animate-pulse">PROCESSING_DATA...</div>
            <div className="w-full max-w-[100px] h-1 bg-dl-border relative overflow-hidden">
              <div className="absolute inset-0 bg-dl-accent animate-[shimmer_1s_infinite]"></div>
            </div>
          </div>
        ) : status === ConversionStatus.ERROR ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 text-center animate-fade-in font-mono">
            <p className="font-bold text-sm mb-2 uppercase">!! SYSTEM ERROR !!</p>
            <p className="text-xs opacity-70 border border-red-500/50 p-2">{error}</p>
          </div>
        ) : result ? (
          <div className="animate-fade-in pb-4">
            {result.aiError && (
              <div className="mb-4 border-l-2 border-red-500 pl-2 text-red-400 font-mono text-xs">
                <p className="font-bold uppercase">[WARNING] {t('aiWarningDesc')}</p>
                <p>{result.aiError}</p>
              </div>
            )}

            <div className="text-xl sm:text-2xl leading-loose font-retro-cjk text-stone-300 break-words">
              {/* Render Segments for both Hybrid and Pure modes to support Ruby */}
              {result.segments ? (
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2">
                  {result.segments.map((seg, idx) => {
                    if (seg.type === 'KANJI' && seg.reading) {
                      return (
                        <ruby key={idx} className="mr-0.5 group cursor-help select-all">
                          {seg.text}
                          <rt className="text-[0.6em] text-teal-500/70 font-mono font-normal select-none group-hover:text-teal-400 transition-colors">{seg.reading}</rt>
                        </ruby>
                      );
                    }
                    return <span key={idx}>{seg.text}</span>;
                  })}
                </div>
              ) : (
                <span>{result.nambunese}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-dl-textSec/30">
            <span className="text-xs uppercase tracking-widest">AWAITING_INPUT...</span>
          </div>
        )}
      </div>

      {mode === 'HYBRID' && result && (
        <div className="absolute bottom-2 right-2 z-30">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-[9px] uppercase hover:text-dl-primary ${showDetails ? 'text-dl-primary' : 'text-dl-textSec opacity-50'}`}
          >
            [LOGS]
          </button>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;