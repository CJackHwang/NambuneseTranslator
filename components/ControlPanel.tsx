import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useConverterContext } from '../contexts/ConverterContext';
import { useTTS } from '../hooks/useTTS';

interface ControlPanelProps {
    currentView: 'CONVERTER' | 'SETTINGS' | 'DOCS';
    onViewChange: (view: 'CONVERTER' | 'SETTINGS' | 'DOCS') => void;
    onBack: () => void;
    isPoweredOn?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ currentView, onViewChange, onBack, isPoweredOn = true }) => {
    const { language, setLanguage, t } = useLanguage();
    const {
        input,
        convert,
        status,
        mode,
        setMode,
        clearAll,
        resourcesReady,
        isHistoryVisible,
        setHistoryVisible,
        result,
    } = useConverterContext() as any;

    const isLoading = status === 'LOADING';
    const isHybrid = mode === 'HYBRID';

    // Hook up TTS
    const { isLoading: ttsLoading, audioUrl, loadAudio, download: downloadAudio } = useTTS(result?.fullKana);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    // Eject / Download Logic
    const [isEjecting, setIsEjecting] = useState(false);
    const handleEject = () => {
        if (!audioUrl || ttsLoading || isEjecting) return;

        setIsEjecting(true);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        // Simulate mechanical delay
        setTimeout(() => {
            downloadAudio();
            setTimeout(() => setIsEjecting(false), 1000);
        }, 800);
    };

    // Audio Playback Handler
    const handlePlay = () => {
        if (!audioUrl) {
            loadAudio();
            return;
        }
        if (audioRef.current && !isPlaying) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleStop = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            // Optional: Rewind logic? For now, Stop = Pause behavior as per typical simple decks, or we can reset current time.
            // Let's keep it simple: Pause.
        }
    };

    // Slider Interaction Handlers
    const handleLanguageTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPoweredOn) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;

        if (percentage < 0.33) {
            setLanguage('zh');
        } else if (percentage < 0.66) {
            setLanguage('en');
        } else {
            setLanguage('ja');
        }
    };

    const handleModeTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isPoweredOn) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;

        if (percentage < 0.5) {
            setMode('HYBRID');
        } else {
            setMode('PURE');
        }
    };

    // Auto-play when audioUrl becomes available
    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.currentTime = 0;
            // No auto-play, manual only
        }
    }, [audioUrl]);

    // Track play state & progress
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [audioUrl]);

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !audioUrl) return;
        e.stopPropagation(); // Prevent play/pause toggle if clicking bar area
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.min(Math.max(x / rect.width, 0), 1);
        audioRef.current.currentTime = percentage * audioRef.current.duration;
        setProgress(percentage * 100);
    };


    // Copy Handler
    const [isPrinting, setIsPrinting] = useState(false);
    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);

        setIsPrinting(true);
        setTimeout(() => setIsPrinting(false), 2000); // Reset after animation
    };

    // Shared Styles
    // more realistic molded plastic look (Slider-like)
    const buttonBaseClass = `
        h-10 px-4 rounded-[4px] 
        bg-stone-300
        bg-gradient-to-b from-[#e8e4d9] to-[#bfbaa8]
        shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_0_2px_rgba(255,255,255,0.5),0_0_1px_rgba(0,0,0,0.4)]
        active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.5)] 
        active:translate-y-[1px] 
        active:bg-gradient-to-b from-[#bfbaa8] to-[#e8e4d9]
        border border-stone-400/80
        text-stone-700 font-bold text-xs tracking-wider 
        transition-all flex items-center justify-center gap-2 
        whitespace-nowrap font-sans select-none 
        group/btn
        ${!isPoweredOn ? 'pointer-events-none cursor-default grayscale opacity-80' : 'cursor-pointer hover:brightness-105'}
    `;

    // Label Style
    const labelStyle = "text-[10px] font-bold text-stone-500 tracking-widest text-center mt-2.5 font-sans";

    return (
        <div className={`w-full bg-[#d6d1c4] rounded-xl border border-stone-400 p-3 md:p-4 shadow-[inset_0_2px_5px_rgba(255,255,255,0.5),5px_5px_15px_rgba(0,0,0,0.2)] relative z-20 bg-noise transition-opacity duration-500`}>

            {/* Hidden Audio Element */}
            <audio ref={audioRef} src={audioUrl || undefined} className="hidden" />

            {/* Panel Screws */}
            <div className="absolute top-2 left-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2 md:w-2.5 h-0.5 bg-stone-600 rotate-45"></div></div>
            <div className="absolute top-2 right-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2 md:w-2.5 h-0.5 bg-stone-600 rotate-12"></div></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2 md:w-2.5 h-0.5 bg-stone-600 -rotate-45"></div></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-stone-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5),1px_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center"><div className="w-2 md:w-2.5 h-0.5 bg-stone-600 rotate-90"></div></div>

            <div className="flex flex-col gap-4 max-w-5xl mx-auto px-2 md:px-4 relative z-30">

                {/* TOP DECK: Switches & Tape */}
                <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between border-b border-stone-400/30 pb-4">

                    {/* Switches Section */}
                    <div className="flex gap-8 pt-4">
                        {/* Language Slider */}
                        <div className="flex flex-col items-center relative">
                            {/* Option Labels positioned ABOVE the track */}
                            <div className="flex w-32 justify-between px-1 mb-1 relative z-10 pointer-events-none">
                                <span className={`text-[9px] font-bold transition-colors ${language === 'zh' ? 'text-stone-800' : 'text-stone-400'}`}>{t('langZh')}</span>
                                <span className={`text-[9px] font-bold transition-colors ${language === 'en' ? 'text-stone-800' : 'text-stone-400'}`}>{t('langEn')}</span>
                                <span className={`text-[9px] font-bold transition-colors ${language === 'ja' ? 'text-stone-800' : 'text-stone-400'}`}>{t('langJa')}</span>
                            </div>

                            <div
                                onClick={handleLanguageTrackClick}
                                className={`relative bg-[#a8a090] p-1 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] border border-stone-500/30 flex items-center h-4 w-32 px-1 cursor-pointer group ${!isPoweredOn ? 'pointer-events-none' : ''}`}
                            >
                                {/* Tracks background */}
                                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1 bg-black/20 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.5)]"></div>

                                {/* Physical Slider Handle */}
                                <div
                                    className="absolute w-8 h-5 bg-stone-300 rounded shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_white] border border-stone-400 top-[-2px] transition-all duration-300 ease-out flex items-center justify-center pointer-events-none"
                                    style={{
                                        left: language === 'zh' ? '4px' : language === 'en' ? 'calc(50% - 16px)' : 'calc(100% - 36px)'
                                    }}
                                >
                                    <div className="w-0.5 h-3 bg-stone-400/50 mx-0.5"></div>
                                    <div className="w-0.5 h-3 bg-stone-400/50 mx-0.5"></div>
                                </div>
                            </div>
                            <span className={labelStyle} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{t('languageSelect')}</span>
                        </div>

                        {/* Mode Slider */}
                        <div className="flex flex-col items-center relative">
                            {/* Option Labels positioned ABOVE the track */}
                            <div className="flex w-24 justify-between px-1 mb-1 relative z-10 pointer-events-none">
                                <span className={`text-[9px] font-bold transition-colors ${isHybrid ? 'text-stone-800' : 'text-stone-400'}`}>{t('modeAI')}</span>
                                <span className={`text-[9px] font-bold transition-colors ${!isHybrid ? 'text-stone-800' : 'text-stone-400'}`}>{t('modeRaw')}</span>
                            </div>

                            <div
                                onClick={handleModeTrackClick}
                                className={`relative bg-[#a8a090] p-1 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] border border-stone-500/30 flex items-center h-4 w-24 px-1 cursor-pointer group ${!isPoweredOn ? 'pointer-events-none' : ''}`}
                            >
                                {/* Tracks background */}
                                <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1 bg-black/20 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.5)]"></div>

                                {/* Physical Slider Handle */}
                                <div
                                    className="absolute w-10 h-5 bg-stone-300 rounded shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_white] border border-stone-400 top-[-2px] transition-all duration-300 ease-out flex items-center justify-center pointer-events-none"
                                    style={{
                                        left: isHybrid ? '4px' : 'calc(100% - 44px)'
                                    }}
                                >
                                    <div className="w-0.5 h-3 bg-stone-400/50 mx-0.5"></div>
                                    <div className="w-0.5 h-3 bg-stone-400/50 mx-0.5"></div>
                                </div>
                            </div>
                            <span className={labelStyle} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{t('modeSelect')}</span>
                        </div>
                    </div>

                    {/* Tape Deck Area */}
                    <div className="flex gap-1 items-center justify-center bg-[#2a2a2c] p-2 rounded border-t border-white/10 shadow-[inner_0_2px_10px_black] relative w-full lg:w-fit mt-4 lg:mt-0 shrink-0">
                        {/* Cassette Window */}
                        <div className={`h-24 w-56 md:w-64 bg-black/80 rounded border border-stone-600/50 relative overflow-hidden flex items-center justify-center group select-none transition-transform duration-700 ${isEjecting ? '-translate-y-2' : 'translate-y-0'}`}>

                            {/* Tape Mechanics Background */}
                            <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_2px,#111_3px)]"></div>

                            {/* Tape Reels Visual - Left */}
                            <div className={`absolute top-4 left-6 w-14 h-14 rounded-full border border-stone-700/50 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''} duration-[3s] shadow-[0_2px_5px_black]`}>
                                {/* Tape Pack (Simulated) */}
                                <div className="absolute inset-0.5 rounded-full bg-gradient-to-r from-[#3e2b20] to-[#2a1a10] opacity-90 shadow-inner"></div>
                                {/* Reel Hub */}
                                <div className="absolute w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center shadow-md border border-stone-300 z-10">
                                    <div className="absolute w-1.5 h-full bg-stone-300 rotate-0"></div>
                                    <div className="absolute w-1.5 h-full bg-stone-300 rotate-60"></div>
                                    <div className="absolute w-1.5 h-full bg-stone-300 rotate-120"></div>
                                    <div className="w-2.5 h-2.5 bg-black rounded-full z-20 shadow-inner"></div>
                                </div>
                            </div>

                            {/* Tape Reels Visual - Right */}
                            <div className={`absolute top-4 right-6 w-14 h-14 rounded-full border border-stone-700/50 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''} duration-[3s] shadow-[0_2px_5px_black]`}>
                                {/* Tape Pack (Simulated - often smaller if playing, but static here implies full/ready) */}
                                <div className="absolute inset-0.5 rounded-full bg-gradient-to-r from-[#3e2b20] to-[#2a1a10] opacity-90 shadow-inner"></div>
                                {/* Reel Hub */}
                                <div className="absolute w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center shadow-md border border-stone-300 z-10">
                                    <div className="absolute w-1.5 h-full bg-stone-300 rotate-0"></div>
                                    <div className="absolute w-1.5 h-full bg-stone-300 rotate-60"></div>
                                    <div className="absolute w-1.5 h-full bg-stone-300 rotate-120"></div>
                                    <div className="w-2.5 h-2.5 bg-black rounded-full z-20 shadow-inner"></div>
                                </div>
                            </div>

                            {/* Tape Label Central */}
                            <div className="absolute inset-x-0 top-[40px] flex flex-col items-center z-10">
                                <span className={`text-[8px] font-mono tracking-widest uppercase mb-1 ${ttsLoading || isEjecting ? 'text-amber-500 animate-pulse' : 'text-stone-500'}`}>
                                    {ttsLoading ? 'GENERATING...' : isEjecting ? 'EJECTING...' : audioUrl ? (isPlaying ? 'PLAYING' : 'READY') : 'NO_TAPE'}
                                </span>
                            </div>

                            {/* Progress Bar (Integrated at Bottom) */}
                            {audioUrl && !isEjecting && (
                                <div
                                    className="absolute bottom-2 left-4 right-4 h-2 group/scrub cursor-pointer flex items-end z-20"
                                    onClick={handleScrub}
                                >
                                    <div className="w-full h-full bg-neutral-900/80 rounded-[1px] relative overflow-hidden border border-stone-700 shadow-[inset_0_1px_2px_black]">
                                        <div style={{ width: `${progress}%` }} className="h-full bg-amber-600 shadow-[0_0_5px_orange] transition-all duration-100 ease-linear opacity-80"></div>
                                        {/* Tick marks */}
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_19%,rgba(255,255,255,0.1)_20%)] bg-[length:5px_100%] pointer-events-none"></div>
                                    </div>
                                </div>
                            )}

                            {/* Glass Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded"></div>
                        </div>

                        {/* Middle Controls (Play/Eject) */}
                        {/* Middle Controls (Play/Stop/Eject) - Stacked */}
                        <div className={`flex flex-col gap-1 mx-2 ${!isPoweredOn ? 'pointer-events-none' : ''}`}>
                            <button
                                onClick={handlePlay}
                                disabled={!result?.fullKana || ttsLoading || isEjecting || isPlaying}
                                title="Play"
                                className={`w-10 h-7 bg-[#d8d8d8] rounded-[2px] shadow-[0_1px_2px_black,inset_0_1px_0_white] flex items-center justify-center active:translate-y-0.5 active:shadow-[inset_0_1px_2px_black] transition-transform border border-stone-400 ${isPlaying ? 'bg-[#c0c0c0] shadow-[inset_0_1px_3px_black]' : ''}`}
                            >
                                <div className={`w-0 h-0 border-l-[8px] border-l-stone-800 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5 ${ttsLoading ? 'animate-pulse opacity-50' : ''}`}></div>
                            </button>

                            <button
                                onClick={handleStop}
                                disabled={!result?.fullKana || ttsLoading || isEjecting || !isPlaying}
                                title="Stop"
                                className="w-10 h-7 bg-[#d8d8d8] rounded-[2px] shadow-[0_1px_2px_black,inset_0_1px_0_white] flex items-center justify-center active:translate-y-0.5 active:shadow-[inset_0_1px_2px_black] transition-transform border border-stone-400"
                            >
                                <div className="w-3 h-3 bg-stone-800 rounded-[1px]"></div>
                            </button>

                            <button
                                onClick={handleEject}
                                disabled={!result?.fullKana || ttsLoading || isEjecting}
                                title="Eject / Download"
                                className="w-10 h-7 bg-[#d8d8d8] rounded-[2px] shadow-[0_1px_2px_black,inset_0_1px_0_white] flex items-center justify-center active:translate-y-0.5 active:shadow-[inset_0_1px_2px_black] transition-transform border border-stone-400 group/eject"
                            >
                                <div className="border-b-2 border-stone-800 w-4 h-3 flex justify-center items-end pb-0.5 group-active/eject:translate-y-[1px]">
                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-stone-800 mb-0.5"></div>
                                </div>
                            </button>
                        </div>

                        {/* Right: Digital Counter (Filler) */}
                        <div className="h-20 w-20 bg-black rounded-[2px] border border-stone-600/50 flex flex-col items-center justify-center shadow-[inset_0_2px_5px_black] relative overflow-hidden">
                            <span className="text-[6px] text-stone-600 uppercase tracking-widest mb-1 font-mono">COUNTER</span>
                            <div className="font-mono text-xl text-red-600 font-bold tracking-widest text-shadow-glow">
                                {String(Math.floor(progress * 10)).padStart(3, '0')}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 pointer-events-none"></div>
                        </div>

                    </div>

                </div>

                {/* BOTTOM DECK: Operations */}
                <div className="grid grid-cols-12 gap-4 items-center">

                    {/* Operation Buttons */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start items-center">
                            <button onClick={() => isPoweredOn && setHistoryVisible(!isHistoryVisible)} className={`${buttonBaseClass} ${isHistoryVisible ? 'bg-stone-300 translate-y-[3px] shadow-[0_1px_0_#beb6a6,inset_0_1px_2px_rgba(0,0,0,0.2)]' : ''}`}>{t('history')}</button>
                            <button onClick={() => isPoweredOn && clearAll()} className={buttonBaseClass}>{t('clear')}</button>
                            <button onClick={() => isPoweredOn && result && handleCopy(result.nambunese)} className={`${buttonBaseClass}`}>
                                {t('copyResult')}
                            </button>
                            <button onClick={() => isPoweredOn && result && handleCopy(result.fullKana || '')} className={`${buttonBaseClass}`}>
                                {t('copyKana')}
                            </button>
                            <div className="w-[1px] h-8 bg-stone-400/30 mx-2 hidden sm:block shadow-[1px_0_0_white]"></div>
                            <button onClick={() => isPoweredOn && onViewChange('SETTINGS')} className={`${buttonBaseClass} ${currentView === 'SETTINGS' ? 'bg-stone-300 translate-y-[3px] shadow-[0_1px_0_#beb6a6,inset_0_1px_2px_rgba(0,0,0,0.2)]' : ''}`}>{t('settings')}</button>
                            <button onClick={() => isPoweredOn && onViewChange('DOCS')} className={`${buttonBaseClass} ${currentView === 'DOCS' ? 'bg-stone-300 translate-y-[3px] shadow-[0_1px_0_#beb6a6,inset_0_1px_2px_rgba(0,0,0,0.2)]' : ''}`}>{t('manual')}</button>
                        </div>

                        {/* Secondary Navigation Row (EXIT) */}
                        <div className="flex justify-center lg:justify-start pl-0 lg:pl-[120px] mt-2">
                            <button
                                onClick={() => isPoweredOn && onBack()}
                                disabled={currentView === 'CONVERTER'} // Logic disabled but visually full
                                className={`${buttonBaseClass} w-24 ${currentView === 'CONVERTER' ? '' : 'text-stone-600'}`}
                            >
                                EXIT
                            </button>
                        </div>
                    </div>

                    {/* Execution */}
                    <div className="col-span-12 lg:col-span-4 flex items-center justify-center lg:justify-end gap-4 border-t lg:border-t-0 border-stone-400/30 pt-4 lg:pt-0">
                        {/* LED Indicators - High Fidelity Realism */}
                        <div className={`flex gap-4 p-3 bg-[#d0cdc4] rounded-[6px] border border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] h-20 items-center justify-center relative ${!isPoweredOn ? 'opacity-90' : ''}`}>

                            {/* Inner Recessed Tray */}
                            <div className="absolute inset-2 bg-[#b8b4a8] rounded-[4px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border-b border-white/50"></div>

                            {/* RDY LED */}
                            <div className="flex flex-col items-center gap-2 relative z-10 w-10">
                                <div className={`w-8 h-6 rounded-[1px] transition-all duration-300 relative bg-[#1a2a1a] shadow-[0_1px_1px_rgba(255,255,255,0.2),inset_0_2px_6px_black] border border-stone-600/30 overflow-hidden`}>
                                    {/* Unlit State Texture */}
                                    <div className="absolute inset-0 bg-[#0a1a0a] opacity-80"></div>

                                    {/* Lit State - Diffuse Scattering */}
                                    <div className={`absolute inset-0 transition-opacity duration-200 ${resourcesReady && isPoweredOn ? 'opacity-100' : 'opacity-0'}`}>
                                        {/* Base radial glow (Bulb source) */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4ade80_0%,#22c55e_40%,#15803d_80%,transparent_100%)] contrast-125"></div>
                                        {/* Surface Bloom */}
                                        <div className="absolute inset-0 bg-green-500/30 blur-[2px]"></div>
                                        {/* Outer Glow (Spill) */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-green-400/20 blur-md rounded-full shadow-[0_0_15px_rgba(74,222,128,0.8)]"></div>
                                        {/* Scanline/Grid Texture overlay (subtle) */}
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_1px,rgba(0,0,0,0.2)_2px)] opacity-20 mixed-blend-overlay"></div>
                                    </div>

                                    {/* Glass Housing Gloss */}
                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10"></div>
                                </div>
                                <span className="text-[9px] font-bold text-stone-600 tracking-widest text-shadow-sm">RDY</span>
                            </div>

                            {/* BUSY LED */}
                            <div className="flex flex-col items-center gap-2 relative z-10 w-10">
                                <div className={`w-8 h-6 rounded-[1px] transition-all duration-300 relative bg-[#2a1a0a] shadow-[0_1px_1px_rgba(255,255,255,0.2),inset_0_2px_6px_black] border border-stone-600/30 overflow-hidden`}>
                                    {/* Unlit State Texture */}
                                    <div className="absolute inset-0 bg-[#1a0a00] opacity-80"></div>

                                    {/* Lit State - Diffuse Scattering */}
                                    <div className={`absolute inset-0 transition-opacity duration-200 ${isLoading && isPoweredOn ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                                        {/* Base radial glow */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fcd34d_0%,#f59e0b_40%,#b45309_80%,transparent_100%)] contrast-125"></div>
                                        {/* Surface Bloom */}
                                        <div className="absolute inset-0 bg-amber-500/30 blur-[2px]"></div>
                                        {/* Outer Glow */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-400/20 blur-md rounded-full shadow-[0_0_15px_rgba(251,191,36,0.8)]"></div>
                                        {/* Texture */}
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_1px,rgba(0,0,0,0.2)_2px)] opacity-20 mixed-blend-overlay"></div>
                                    </div>

                                    {/* Glass Housing Gloss */}
                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10"></div>
                                </div>
                                <span className="text-[9px] font-bold text-stone-600 tracking-widest text-shadow-sm">BUSY</span>
                            </div>

                            {/* OUT LED */}
                            <div className="flex flex-col items-center gap-2 relative z-10 w-10">
                                <div className={`w-8 h-6 rounded-[1px] transition-all duration-300 relative bg-[#0a1a2a] shadow-[0_1px_1px_rgba(255,255,255,0.2),inset_0_2px_6px_black] border border-stone-600/30 overflow-hidden`}>
                                    {/* Unlit State Texture */}
                                    <div className="absolute inset-0 bg-[#000a1a] opacity-80"></div>

                                    {/* Lit State - Diffuse Scattering */}
                                    <div className={`absolute inset-0 transition-opacity duration-200 ${isPrinting && isPoweredOn ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
                                        {/* Base radial glow */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#60a5fa_0%,#3b82f6_40%,#1e3a8a_80%,transparent_100%)] contrast-125"></div>
                                        {/* Surface Bloom */}
                                        <div className="absolute inset-0 bg-blue-500/30 blur-[2px]"></div>
                                        {/* Outer Glow */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-400/20 blur-md rounded-full shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
                                        {/* Texture */}
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_1px,rgba(0,0,0,0.2)_2px)] opacity-20 mixed-blend-overlay"></div>
                                    </div>

                                    {/* Glass Housing Gloss */}
                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10"></div>
                                </div>
                                <span className="text-[9px] font-bold text-stone-600 tracking-widest text-shadow-sm">OUT</span>
                            </div>

                            {/* Printer Paper Animation - Bottom Slot (Hidden behind panel look now, or integrated differently? Keeping it simple for now as requested focused on LEDs) */}
                            {/* Re-integrating Paper Output in a cleaner way if needed, but per request focusing on LEDs. 
                                Let's put the paper output adjacent or slightly below. 
                                I'll keep the paper slot separate or minimize it to avoid crowding the new large LEDs.
                            */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                                <div className="w-12 h-1 bg-[#1a1a1c] shadow-[0_1px_1px_rgba(255,255,255,0.5)] rounded-full"></div>
                                <div
                                    className={`absolute top-full left-1/2 -translate-x-1/2 w-8 bg-[#f5f5f5] shadow-lg transition-all duration-1000 ease-out flex flex-col items-center overflow-hidden border border-stone-300 z-50 ${isPrinting ? 'h-20 opacity-100' : 'h-0 opacity-0'}`}
                                >
                                    <div className="w-full h-full p-1 flex flex-col gap-0.5 items-center">
                                        <div className="flex gap-0.5 mt-1">
                                            <div className="w-0.5 h-0.5 rounded-full bg-stone-400"></div>
                                            <div className="w-0.5 h-0.5 rounded-full bg-stone-400"></div>
                                        </div>
                                        <div className="w-full h-[1px] bg-stone-300 my-0.5"></div>
                                        <span className="text-[4px] font-mono text-stone-800 leading-[5px] text-center">
                                            OK
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Execute Button */}
                        <div className="flex flex-col items-center gap-1">
                            <span className={labelStyle} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>{t('execute')}</span>
                            <div className="p-1.5 bg-stone-400/30 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-stone-500/20">
                                <button
                                    onClick={() => convert(input)}
                                    disabled={!input.trim() || !resourcesReady || isLoading || !isPoweredOn}
                                    className={`
                                       w-16 h-16 rounded-full
                                       border-b-[4px] border-r-[1px]
                                       flex items-center justify-center transition-all
                                       ${isLoading
                                            ? 'bg-amber-600 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.3)]'
                                            : isPoweredOn
                                                ? 'bg-gradient-to-br from-[#e62e2e] to-[#b30000] hover:brightness-110 active:border-b-[1px] active:translate-y-1 shadow-[0_5px_8px_rgba(0,0,0,0.4),inset_0_2px_5px_rgba(255,255,255,0.4),inset_0_-5px_10px_rgba(0,0,0,0.2)]'
                                                : 'bg-[#551111] border-[#330000] cursor-not-allowed shadow-none translate-y-1'
                                        }
                                    `}
                                >
                                    {/* Indentation on button top */}
                                    {isPoweredOn && <div className="w-12 h-12 rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.3)] bg-gradient-to-br from-transparent to-black/10"></div>}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
