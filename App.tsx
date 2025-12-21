import React, { useState } from 'react';
import Header from './components/Header';
import Converter from './components/Converter';
import SettingsScreen from './components/SettingsScreen';
import DocsScreen from './components/DocsScreen';
import ControlPanel from './components/ControlPanel';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConverterProvider } from './contexts/ConverterContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'CONVERTER' | 'SETTINGS' | 'DOCS'>('CONVERTER');
  const [isPoweredOn, setIsPoweredOn] = useState(false);

  // Toggle Power
  const togglePower = () => {
    setIsPoweredOn(prev => !prev);
  };

  return (
    <div className="relative min-h-screen bg-neutral-800 flex items-center justify-center p-2 sm:p-4 selection:bg-stone-400 selection:text-black font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,#4a4a4a,black)] -z-10" />

      {/* Main Console Chassis */}
      <div className="w-full max-w-[1000px] bg-[#d6d1c4] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.4),inset_0_-5px_15px_rgba(0,0,0,0.2)] p-2 sm:p-4 md:p-6 flex flex-col gap-4 relative border-black/20 md:border-b-8 md:border-r-8 border-b-4 border-r-4">

        {/* Screw heads (Decorative) */}
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2.5 h-0.5 bg-stone-600 rotate-45"></div></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2.5 h-0.5 bg-stone-600 rotate-12"></div></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2.5 h-0.5 bg-stone-600 -rotate-45"></div></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2.5 h-0.5 bg-stone-600 rotate-90"></div></div>

        {/* Console Header Plate with Power Toggle */}
        <div className="bg-[#e6e2d8] rounded-xl shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)] border border-stone-500/20 z-20">
          <Header isPoweredOn={isPoweredOn} onTogglePower={togglePower} />
        </div>

        {/* Main Interface Area (CRT Housing) */}
        <main className={`relative z-10 w-full min-h-[500px] h-[60vh] bg-[#0d0d0f] rounded-xl border-[6px] border-[#2a2a2c] shadow-[inset_0_0_20px_black] overflow-hidden transition-all duration-1000 ${isPoweredOn ? 'shadow-[0_0_15px_rgba(20,20,30,0.5)]' : 'shadow-none'}`}>

          {/* CRT Overlay Effect - only visible when ON */}
          <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-50 rounded-lg transition-opacity duration-1000 ${isPoweredOn ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Blackout Curtain for Power Off */}
          <div className={`absolute inset-0 bg-black z-40 transition-opacity duration-700 pointer-events-none ${isPoweredOn ? 'opacity-0' : 'opacity-95'}`}></div>

          {/* CRT Turn-off animation line/dot could be added here later */}
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-white z-[60] shadow-[0_0_20px_white] transition-all duration-300 ease-out ${isPoweredOn ? 'scale-x-0 opacity-0' : 'scale-x-0 opacity-0'}`}></div>

          <div className={`relative w-full h-full overflow-hidden flex flex-col transition-opacity duration-200 ${isPoweredOn ? 'opacity-100' : 'opacity-0'}`}>
            {currentView === 'CONVERTER' && <Converter />}
            {currentView === 'SETTINGS' && <SettingsScreen onBack={() => setCurrentView('CONVERTER')} />}
            {currentView === 'DOCS' && <DocsScreen onBack={() => setCurrentView('CONVERTER')} />}
          </div>
        </main>

        {/* Physical Control Deck */}
        <ControlPanel
          currentView={currentView}
          onViewChange={setCurrentView}
          onBack={() => setCurrentView('CONVERTER')}
          isPoweredOn={isPoweredOn}
        />

        {/* Footer Plate */}
        <footer className="bg-[#e6e2d8] py-2 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-between shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)] border border-stone-500/20 mt-auto">
          <div className="flex items-center gap-4">
            {/* Status LED */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPoweredOn ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-red-900'} transition-all duration-300`}></div>
              <span className="text-[10px] text-stone-500 font-bold uppercase">SYSTEM</span>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] text-stone-600 font-bold uppercase tracking-wider font-mono">
            <span>Model: NB-114514</span>
            <span className="hidden sm:inline">SerNo: 1919-810</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConverterProvider>
          <AppContent />
        </ConverterProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;