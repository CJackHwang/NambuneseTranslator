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
  const isOverLimit = input.length > 3500;

  return (
    <div className="flex-1 flex flex-col relative h-full w-full font-mono overflow-hidden">
      {/* Toolbar */}
      <div className="h-8 border-b border-[#333] flex items-center px-4 shrink-0 justify-between bg-[#111] relative z-20">
        <span className="text-xs font-bold text-[#888] uppercase tracking-widest">{t('inputLabel')}_BUFFER</span>
        <div className="flex items-center gap-4">
          {!resourcesReady && !resourcesError && (
            <div className="flex items-center gap-2 text-[10px] text-teal-600 animate-pulse uppercase">
              <span>LOADING_DICT...</span>
            </div>
          )}
        </div>
      </div>

      {/* Text Area Container */}
      <div className="flex-1 relative bg-crt-base shadow-inner">
        <textarea
          ref={textAreaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          className="absolute inset-0 w-full h-full p-4 text-lg bg-transparent border-none outline-none resize-none font-retro-cjk text-stone-300 placeholder:text-stone-600 leading-relaxed selection:bg-stone-500 selection:text-black focus:bg-[#222]/30 transition-colors"
          spellCheck="false"
        />
      </div>

      {/* Footer */}
      <div className="h-10 border-t border-stone-700 flex items-center justify-between px-4 bg-[#1a1a1c] shrink-0 text-xs text-stone-500 relative z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
        {/* Left: Character count */}
        <div className="flex items-center gap-2">
          <span className={`${input.length > 3500 ? 'text-red-500 animate-pulse' : ''}`}>
            CHAR: {input.length.toString().padStart(4, '0')} / 3500
          </span>
        </div>

        {/* Right: Status */}
        <div className="text-[10px] uppercase font-bold tracking-widest text-stone-600">
          STATUS: {isLoading ? 'PROCESSING' : input ? 'READY' : 'IDLE'}
        </div>
      </div>
    </div>
  );
};

export default InputPanel;