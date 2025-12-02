import React from 'react';
import { TranslationResult } from '../types';

interface ProcessDetailsProps {
  processLog: TranslationResult['processLog'];
  aiError?: string;
}

const ProcessDetails: React.FC<ProcessDetailsProps> = ({ processLog, aiError }) => {
  if (!processLog) return null;

  return (
    <div className="mt-4 bg-white dark:bg-dl-dark-surface rounded-xl shadow-card border border-dl-border dark:border-dl-dark-border p-6 animate-fade-in-up transition-colors max-h-[500px] overflow-y-auto">
      <h4 className="text-sm font-bold text-dl-text dark:text-gray-200 uppercase mb-4 tracking-wide border-b border-dl-border dark:border-dl-dark-border pb-2">Process Details</h4>
      <div className="space-y-4">
        {/* Step 1: Raw Input & AI Extraction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Raw Input</div>
            <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 font-sans text-dl-text dark:text-gray-200 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap break-words">
              {processLog.step1_raw_input}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">AI Extracted (Raw Keywords)</div>
            <div className={`text-sm p-2 rounded border font-mono text-xs break-all max-h-40 overflow-y-auto scrollbar-thin ${aiError ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-dl-primary dark:text-blue-300'}`}>
              {processLog.step2_ai_extraction}
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center">
          <svg className="text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </div>

        {/* Step 2: Normalization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Normalized Text (Shinjitai)</div>
            <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 font-jp text-dl-text dark:text-gray-200 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap break-words">
              {processLog.step3_normalization_text}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Normalized Keywords</div>
            <div className="text-sm bg-teal-50 dark:bg-teal-900/20 p-2 rounded border border-teal-100 dark:border-teal-900/30 font-mono text-teal-800 dark:text-teal-300 text-xs break-all max-h-40 overflow-y-auto scrollbar-thin">
              {processLog.step4_normalization_keywords}
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center">
          <svg className="text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </div>

        {/* Step 3: Phonetic Processing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Intermediate Jyutping</div>
            <div className="text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-100 dark:border-purple-900/30 font-mono text-purple-800 dark:text-purple-300 text-xs break-all max-h-40 overflow-y-auto scrollbar-thin">
              {processLog.step6_jyutping_generation}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Full Kana Output</div>
            <div className="text-sm bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded border border-indigo-100 dark:border-indigo-900/30 font-jp text-indigo-800 dark:text-indigo-300 text-xs break-all max-h-40 overflow-y-auto scrollbar-thin">
              {processLog.step7_full_kana_generation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetails;