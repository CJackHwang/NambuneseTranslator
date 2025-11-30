
import React from 'react';
import Header from './components/Header';
import Converter from './components/Converter';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-md-background text-md-onSurface font-sans selection:bg-md-primaryContainer selection:text-md-onPrimaryContainer">
      <Header />
      <Converter />
      
      <footer className="py-8 text-center text-md-outline/60 text-xs">
        <p>© 2025 {t('footerDept')}</p>
        <p className="mt-1">{t('footerStandard')}</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
