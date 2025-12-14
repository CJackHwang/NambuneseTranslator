import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { Language } from '../services/translations';
import SettingsModal from './SettingsModal';
import DocsModal from './DocsModal';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-dl-dark-surface sticky top-0 z-50 h-16 border-b border-dl-border dark:border-dl-dark-border flex items-center shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-dl-primary dark:text-gray-100 tracking-tight truncate">
                {t('title')}
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-dl-bg dark:bg-dl-dark-bg text-dl-textSec dark:text-dl-dark-textSec whitespace-nowrap">
                v5.1
              </span>
            </div>
            <div className="hidden md:block text-[10px] font-medium text-dl-textSec dark:text-dl-dark-textSec/80 tracking-widest uppercase truncate">
              {t('headerSubtitle')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <div className="relative group">
            <button className="p-2 rounded-md text-dl-textSec dark:text-dl-dark-textSec hover:text-dl-primary dark:hover:text-white hover:bg-dl-bg dark:hover:bg-dl-dark-hover transition-colors">
              {theme === 'light' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>}
              {theme === 'dark' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
              {theme === 'system' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
            </button>

            <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-white dark:bg-dl-dark-surface rounded-lg border border-dl-border dark:border-dl-dark-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {(['light', 'dark', 'system'] as Theme[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setTheme(m)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-dl-bg dark:hover:bg-dl-dark-hover transition-colors flex items-center gap-2 ${theme === m ? 'text-dl-accent font-medium' : 'text-dl-text dark:text-dl-dark-text'}`}
                >
                  <span>{m === 'light' ? t('themeLight') : m === 'dark' ? t('themeDark') : t('themeSystem')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* Docs Button */}
          <button
            onClick={() => setIsDocsOpen(true)}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-md text-dl-textSec dark:text-dl-dark-textSec hover:text-dl-primary dark:hover:text-white hover:bg-dl-bg dark:hover:bg-dl-dark-hover transition-colors text-sm font-medium"
            title={t('docsTitle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <span className="hidden sm:inline">{t('docsButton')}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-md text-dl-textSec dark:text-dl-dark-textSec hover:text-dl-primary dark:hover:text-white hover:bg-dl-bg dark:hover:bg-dl-dark-hover transition-colors"
            title={t('settingsTitle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>

          {/* Language Selector */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded hover:bg-dl-bg dark:hover:bg-dl-dark-hover transition-colors text-sm font-medium text-dl-textSec dark:text-dl-dark-textSec hover:text-dl-text dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" /></svg>
              <span className="hidden sm:inline">{language === 'zh' ? '中文' : language === 'en' ? 'English' : '日本語'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6" /></svg>
            </button>

            <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-white dark:bg-dl-dark-surface rounded-lg border border-dl-border dark:border-dl-dark-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {(['zh', 'en', 'ja'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-dl-bg dark:hover:bg-dl-dark-hover transition-colors ${language === lang ? 'text-dl-accent font-medium' : 'text-dl-text dark:text-dl-dark-text'}`}
                >
                  {lang === 'zh' ? '中文' : lang === 'en' ? 'English' : '日本語'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </header>
  );
};

export default Header;