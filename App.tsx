import React from 'react';
import Header from './components/Header';
import Converter from './components/Converter';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-dl-bg dark:bg-dl-dark-bg text-dl-text dark:text-dl-dark-text font-sans selection:bg-dl-accent selection:text-white transition-colors duration-300">
      <Header />
      <Converter />
      
      <footer className="py-8 text-center text-dl-textSec dark:text-dl-dark-textSec/60 text-xs">
        <p>© 2025 {t('footerDept')}</p>
        <p className="mt-1">{t('footerStandard')}</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;