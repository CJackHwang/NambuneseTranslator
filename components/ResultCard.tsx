
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultCardProps {
  title: string;
  content: string;
  subtext?: string;
  isPrimary?: boolean;
  fontClass?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, content, subtext, isPrimary = false, fontClass = "font-sans" }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className={`relative overflow-hidden transition-all duration-300 rounded-3xl p-6 sm:p-8 border ${
      isPrimary 
        ? 'bg-md-primaryContainer text-md-onPrimaryContainer border-md-primary/20' 
        : 'bg-white border-md-outlineVariant text-md-onSurface'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-xs font-bold tracking-widest uppercase ${isPrimary ? 'text-md-primary/80' : 'text-md-outline'}`}>
          {title}
        </h3>
        <button 
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 border ${
            copied 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : isPrimary ? 'text-md-primary hover:bg-md-primary/10 border-transparent hover:border-md-primary/10' : 'text-md-outline hover:bg-black/5 border-transparent hover:border-black/5'
          }`}
          title={t('copy')}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">{t('copied')}</span>
            </>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          )}
        </button>
      </div>
      
      <div className={`text-3xl sm:text-4xl leading-normal break-words ${fontClass} ${isPrimary ? 'font-medium' : 'font-normal'}`}>
        {content || "..."}
      </div>
      
      {subtext && (
        <div className={`text-sm mt-4 font-medium ${isPrimary ? 'text-md-onPrimaryContainer/60' : 'text-md-outline'}`}>
          {subtext}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
