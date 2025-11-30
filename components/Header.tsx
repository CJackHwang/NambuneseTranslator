
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../services/translations';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-md-surface sticky top-0 z-50 py-4 px-4 border-b border-md-outlineVariant">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex flex-col items-start">
          <div className="text-[10px] sm:text-xs font-bold text-md-primary tracking-widest uppercase mb-1">
            {t('headerSubtitle')}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-normal text-md-onSurface font-sans">
              {t('title')}
            </h1>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-md-primaryContainer text-md-onPrimaryContainer">
              {t('subtitle')}
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full border border-md-outlineVariant hover:bg-md-surface2 transition-colors text-sm font-medium text-md-outline">
            <span className="uppercase">{language}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          
          <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-white rounded-xl border border-md-outlineVariant opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 shadow-sm">
             {(['zh', 'en', 'ja'] as Language[]).map((lang) => (
               <button
                 key={lang}
                 onClick={() => setLanguage(lang)}
                 className={`w-full text-left px-4 py-2 text-sm hover:bg-md-primaryContainer hover:text-md-onPrimaryContainer transition-colors ${language === lang ? 'text-md-primary font-bold bg-md-primaryContainer/30' : 'text-md-onSurface'}`}
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
