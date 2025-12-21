import React from 'react';
import { TranslationResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProcessDetailsProps {
  processLog: TranslationResult['processLog'];
  aiError?: string;
  onBack: () => void;
}

const ProcessDetails: React.FC<ProcessDetailsProps> = ({ processLog, aiError, onBack }) => {
  const { t } = useLanguage();

  if (!processLog) return null;

  return (
    <div className="flex flex-col h-full bg-[#151515] text-stone-300 font-mono relative overflow-hidden absolute inset-0 z-50 animate-fade-in">
      {/* Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20 opacity-20"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1c] border-b border-stone-700 shadow-md z-30 shrink-0">
        <div className="flex items-center gap-2 text-stone-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          <h2 className="text-sm font-bold uppercase tracking-widest">PROCESS LOG</h2>
        </div>
        <button
          onClick={onBack}
          className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-300 border border-stone-700 hover:border-stone-500 px-2 py-1 transition-colors"
        >
          [ EXIT ]
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10 space-y-6">

        {/* Warning Banner if AI Error */}
        {aiError && (
          <div className="border border-red-900/50 bg-red-950/20 p-4 text-xs font-mono text-red-400">
            <h3 className="font-bold uppercase mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              AI EXTRACTION WARNING
            </h3>
            <p className="opacity-80">{aiError}</p>
          </div>
        )}

        {/* Step 1: Raw Input & AI Extraction */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] bg-stone-800 text-stone-400 px-1 font-bold">01</span>
            <h3 className="text-xs font-bold uppercase text-stone-500 tracking-wider">INPUT PROCESSING</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">Raw Input</div>
              <div className="text-xs bg-black/40 p-2 border border-stone-800 text-stone-300 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap break-words font-sans">
                {processLog.step1_raw_input}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">AI Extracted Keywords</div>
              <div className={`text-xs p-2 border font-mono break-all max-h-40 overflow-y-auto scrollbar-thin ${aiError ? 'bg-red-900/10 border-red-900/30 text-red-400' : 'bg-blue-900/10 border-blue-900/30 text-blue-300'}`}>
                {processLog.step2_ai_extraction}
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center opacity-30">
          <div className="h-4 w-px bg-stone-600"></div>
        </div>

        {/* Step 2: Normalization */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] bg-stone-800 text-stone-400 px-1 font-bold">02</span>
            <h3 className="text-xs font-bold uppercase text-stone-500 tracking-wider">NORMALIZATION</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">Standardized Text (Shinjitai)</div>
              <div className="text-xs bg-black/40 p-2 border border-stone-800 text-stone-300 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap break-words font-jp">
                {processLog.step3_normalization_text}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">Normalized Keywords</div>
              <div className="text-xs bg-teal-900/10 p-2 border border-teal-900/30 font-mono text-teal-300 break-all max-h-40 overflow-y-auto scrollbar-thin">
                {processLog.step4_normalization_keywords}
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center opacity-30">
          <div className="h-4 w-px bg-stone-600"></div>
        </div>

        {/* Step 3: Phonetic Processing */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] bg-stone-800 text-stone-400 px-1 font-bold">03</span>
            <h3 className="text-xs font-bold uppercase text-stone-500 tracking-wider">PHONETIC SYNTHESIS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">Intermediate Jyutping</div>
              <div className="text-xs bg-purple-900/10 p-2 border border-purple-900/30 font-mono text-purple-300 break-all max-h-40 overflow-y-auto scrollbar-thin">
                {processLog.step6_jyutping_generation}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-600 uppercase mb-1">Full Kana Output</div>
              <div className="text-xs bg-indigo-900/10 p-2 border border-indigo-900/30 font-jp text-indigo-300 break-all max-h-40 overflow-y-auto scrollbar-thin">
                {processLog.step7_full_kana_generation}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Status Line */}
      <div className="px-3 py-1 bg-[#1a1a1c] border-t border-stone-700 text-[10px] text-stone-600 flex justify-between uppercase tracking-wider z-30 shrink-0">
        <span>LOG_VIEWER_V1.0</span>
        <span>DEBUG_MODE_ACTIVE</span>
      </div>
    </div>
  );
};

export default ProcessDetails;