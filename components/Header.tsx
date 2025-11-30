
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../services/translations';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-white sticky top-0 z-50 h-16 border-b border-dl-border flex items-center shadow-sm">
      <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
             <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-bold text-dl-primary tracking-tight">
                  {t('title')}
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dl-bg text-dl-textSec">
                  v5.1
                </span>
             </div>
             <div className="hidden sm:block text-[10px] font-medium text-dl-textSec tracking-widest uppercase">
                {t('headerSubtitle')}
             </div>
          </div>
        </div>

        {/* Language Selector - Flat Style */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-dl-bg transition-colors text-sm font-medium text-dl-textSec hover:text-dl-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>{language === 'zh' ? '中文' : language === 'en' ? 'English' : '日本語'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          
          <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-white rounded-lg border border-dl-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
             {(['zh', 'en', 'ja'] as Language[]).map((lang) => (
               <button
                 key={lang}
                 onClick={() => setLanguage(lang)}
                 className={`w-full text-left px-4 py-2 text-sm hover:bg-dl-bg transition-colors ${language === lang ? 'text-dl-accent font-medium' : 'text-dl-text'}`}
               >
                 {lang === 'zh' ? '中文' : lang === 'en' ? 'English' : '日本語'}
               </button>
             ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;