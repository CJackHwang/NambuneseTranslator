import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  isPoweredOn?: boolean;
  onTogglePower?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isPoweredOn = true, onTogglePower }) => {
  const { t } = useLanguage();

  return (
    <header className="h-20 flex items-center px-4 md:px-8 relative z-50">
      {/* Engraved Line */}
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-stone-400 shadow-[0_1px_0_white]"></div>

      {/* Brand / Logo Area */}
      <div className="flex flex-col relative z-20 mr-auto">
        <h1 className={`text-2xl md:text-3xl font-bold tracking-tighter transition-colors duration-500 ${isPoweredOn ? 'text-stone-700' : 'text-stone-500'}`} style={{ textShadow: isPoweredOn ? '1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(0,0,0,0.1)' : 'none' }}>
          南武正語翻訳機 <span className="text-xs align-top border border-stone-600 rounded px-1 ml-1 text-stone-600 shadow-sm opacity-70">Ver. 2.0</span>
        </h1>
        <span className="text-[10px] font-mono text-stone-500 tracking-[0.2em] font-bold uppercase pl-1 opacity-70">
          Nambun Electronics Corp.
        </span>
      </div>

      {/* Controls Area (Right Side) */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0 font-mono relative z-20">

        {/* Power Switch (Interactive) */}
        <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={onTogglePower}>
          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isPoweredOn
            ? 'bg-[#d4cdc0] shadow-[inset_0_2px_5px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.5)] border border-[#a8a090] translate-y-0.5'
            : 'bg-[#e0d8c8] shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#c8c0b0] -translate-y-0.5'
            }`}>
            {/* The actual button cap */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isPoweredOn ? 'mt-[1px]' : '-mt-[1px]'}`}>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isPoweredOn
                ? 'bg-red-500 shadow-[0_0_8px_red] animate-pulse'
                : 'bg-red-900/50 shadow-none'
                }`}></div>
            </div>
          </div>
          <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest pl-0.5" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
            {isPoweredOn ? 'PWR ON' : 'PWR OFF'}
          </span>
        </div>

      </div>
    </header>
  );
};

export default Header;