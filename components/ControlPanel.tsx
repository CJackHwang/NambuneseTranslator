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
    const { language, setLanguage } = useLanguage();
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
    const handlePlayPause = () => {
        if (!audioUrl) {
            loadAudio();
            return;
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
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
    const buttonBaseClass = `h-8 px-2 md:px-3 rounded bg-[#e8e4d9] shadow-[2px_2px_5px_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15)] active:translate-y-[1px] border border-[#beb6a6] text-stone-600 font-bold text-[10px] md:text-xs tracking-wider hover:text-stone-800 transition-colors flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap font-sans ${!isPoweredOn ? 'opacity-50 pointer-events-none' : ''}`;

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
                                <span className={`text-[9px] font-bold transition-colors ${language === 'zh' ? 'text-stone-800' : 'text-stone-400'}`}>中</span>
                                <span className={`text-[9px] font-bold transition-colors ${language === 'en' ? 'text-stone-800' : 'text-stone-400'}`}>英</span>
                                <span className={`text-[9px] font-bold transition-colors ${language === 'ja' ? 'text-stone-800' : 'text-stone-400'}`}>日</span>
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
                            <span className={labelStyle} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>语言选择</span>
                        </div>

                        {/* Mode Slider */}
                        <div className="flex flex-col items-center relative">
                            {/* Option Labels positioned ABOVE the track */}
                            <div className="flex w-24 justify-between px-1 mb-1 relative z-10 pointer-events-none">
                                <span className={`text-[9px] font-bold transition-colors ${isHybrid ? 'text-stone-800' : 'text-stone-400'}`}>智能</span>
                                <span className={`text-[9px] font-bold transition-colors ${!isHybrid ? 'text-stone-800' : 'text-stone-400'}`}>原始</span>
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
                            <span className={labelStyle} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>模式选择</span>
                        </div>
                    </div>

                    {/* Tape Deck Area */}
                    <div className="flex gap-1 items-center justify-center bg-[#2a2a2c] p-2 rounded border-t border-white/10 shadow-[inner_0_2px_10px_black] relative w-full lg:w-fit mt-4 lg:mt-0 shrink-0">
                        {/* Cassette Window */}
                        <div className={`h-16 w-56 md:w-64 bg-black/80 rounded border border-stone-600/50 relative overflow-hidden flex items-center justify-center group select-none transition-transform duration-700 ${isEjecting ? '-translate-y-2' : 'translate-y-0'}`}>

                            {/* Tape Mechanics Background */}
                            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_19px,#333_20px)]"></div>

                            {/* Tape Reels Visual - Left */}
                            <div className={`absolute left-6 w-10 h-10 rounded-full border-[3px] border-stone-500 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''} duration-[3s]`}>
                                <div className="w-3 h-3 bg-stone-600 rounded-full shadow-[0_0_2px_black]"></div>
                                {/* Spoke */}
                                <div className="absolute w-full h-0.5 bg-stone-600"></div>
                                <div className="absolute h-full w-0.5 bg-stone-600"></div>
                            </div>

                            {/* Tape Reels Visual - Right */}
                            <div className={`absolute right-6 w-10 h-10 rounded-full border-[3px] border-stone-500 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''} duration-[3s]`}>
                                <div className="w-3 h-3 bg-stone-600 rounded-full shadow-[0_0_2px_black]"></div>
                                {/* Spoke */}
                                <div className="absolute w-full h-0.5 bg-stone-600"></div>
                                <div className="absolute h-full w-0.5 bg-stone-600"></div>
                            </div>

                            {/* Tape Label Central */}
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                <span className={`text-[8px] font-mono tracking-widest uppercase mb-1 ${ttsLoading || isEjecting ? 'text-amber-500 animate-pulse' : 'text-stone-500'}`}>
                                    {ttsLoading ? 'GENERATING...' : isEjecting ? 'EJECTING...' : audioUrl ? (isPlaying ? 'PLAYING' : 'READY') : 'NO_TAPE'}
                                </span>
                            </div>

                            {/* Progress Bar (Integrated at Bottom) */}
                            {audioUrl && !isEjecting && (
                                <div
                                    className="absolute bottom-1 left-2 right-2 h-2 group/scrub cursor-pointer flex items-end z-20"
                                    onClick={handleScrub}
                                >
                                    <div className="w-full h-1 bg-stone-700/50 rounded-full relative overflow-hidden backdrop-blur-sm border border-white/5">
                                        <div style={{ width: `${progress}%` }} className="h-full bg-amber-500 shadow-[0_0_4px_orange] transition-all duration-100 ease-linear"></div>
                                    </div>
                                </div>
                            )}

                            {/* Glass Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded"></div>
                        </div>

                        {/* Middle Controls (Play/Eject) */}
                        <div className={`flex flex-col gap-1 mx-2 ${!isPoweredOn ? 'pointer-events-none' : ''}`}>
                            <button
                                onClick={handlePlayPause}
                                disabled={!result?.fullKana || ttsLoading || isEjecting}
                                title={isPlaying ? "Pause" : "Play / Generate"}
                                className="w-10 h-7 bg-[#d8d8d8] rounded-sm shadow-[0_1px_3px_black,inset_0_1px_0_white] flex items-center justify-center active:translate-y-0.5 active:shadow-[0_1px_2px_black] transition-transform border-b-2 border-r-2 border-[#999]"
                            >
                                {isPlaying ? (
                                    <div className="flex gap-1">
                                        <div className="w-1 h-3 bg-stone-800 rounded-sm"></div>
                                        <div className="w-1 h-3 bg-stone-800 rounded-sm"></div>
                                    </div>
                                ) : (
                                    <div className={`w-0 h-0 border-l-[8px] border-l-stone-800 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5 ${ttsLoading ? 'animate-pulse opacity-50' : ''}`}></div>
                                )}
                            </button>

                            <button
                                onClick={handleEject}
                                disabled={!result?.fullKana || ttsLoading || isEjecting}
                                title="Eject / Download"
                                className="w-10 h-7 bg-[#d8d8d8] rounded-sm shadow-[0_1px_3px_black,inset_0_1px_0_white] flex items-center justify-center active:translate-y-0.5 active:shadow-[0_1px_2px_black] transition-transform border-b-2 border-r-2 border-[#999] group/eject"
                            >
                                <div className="border-b-2 border-stone-800 w-4 h-3 flex justify-center items-end pb-0.5 group-active/eject:translate-y-[1px]">
                                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-stone-800 mb-0.5"></div>
                                </div>
                            </button>
                        </div>

                        {/* Right: Digital Counter (Filler) */}
                        <div className="h-16 w-20 bg-black rounded border border-stone-600/50 flex flex-col items-center justify-center shadow-[inset_0_2px_5px_black] relative overflow-hidden">
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
                    <div className="col-span-12 lg:col-span-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                        <button onClick={() => setHistoryVisible(!isHistoryVisible)} className={`${buttonBaseClass} ${isHistoryVisible ? 'bg-stone-300 shadow-inner translate-y-[1px]' : ''}`}>历史记录</button>
                        <button onClick={clearAll} className={buttonBaseClass}>清空</button>
                        <button onClick={() => result && handleCopy(result.nambunese)} disabled={!result} className={`${buttonBaseClass} ${!result ? 'opacity-50' : ''}`}>
                            复制结果
                        </button>
                        <button onClick={() => result && handleCopy(result.fullKana || '')} disabled={!result} className={`${buttonBaseClass} ${!result ? 'opacity-50' : ''}`}>
                            复制假名
                        </button>
                        <div className="w-[1px] h-6 bg-stone-400/50 mx-2"></div>
                        <button onClick={() => onViewChange('SETTINGS')} className={`${buttonBaseClass} ${currentView === 'SETTINGS' ? 'bg-stone-300 shadow-inner' : ''}`}>设置</button>
                        <button onClick={() => onViewChange('DOCS')} className={`${buttonBaseClass} ${currentView === 'DOCS' ? 'bg-stone-300 shadow-inner' : ''}`}>说明书</button>
                        <button
                            onClick={onBack}
                            disabled={currentView === 'CONVERTER'}
                            className={`${buttonBaseClass} ${currentView === 'CONVERTER' ? 'opacity-50' : ''}`}
                        >
                            EXIT
                        </button>
                    </div>

                    {/* Execution */}
                    <div className="col-span-12 lg:col-span-4 flex items-center justify-center lg:justify-end gap-4 border-t lg:border-t-0 border-stone-400/30 pt-4 lg:pt-0">
                        {/* LED Indicators */}
                        {/* LED Indicators */}
                        <div className={`flex gap-2 p-1 bg-stone-700/50 rounded shadow-inner border border-white/10 h-6 items-center px-2 relative ${!isPoweredOn ? 'opacity-20' : ''}`}>

                            {/* Printer Paper Animation - Hidden Slot */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 rounded-full"></div>
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 bg-[#f0f0f0] shadow-md transition-all duration-1000 ease-out flex flex-col items-center justify-end overflow-hidden border border-stone-300 ${isPrinting ? 'h-16 opacity-100 -translate-y-[60px]' : 'h-0 opacity-0 -translate-y-0'}`} style={{ zIndex: 0 }}>
                                <div className="w-full h-full p-1 flex flex-col gap-1 items-center">
                                    <div className="w-full h-[1px] bg-stone-300"></div>
                                    <span className="text-[4px] font-mono text-stone-600 leading-[4px] text-center">COPY<br />SUCCESS</span>
                                    <div className="w-full h-[1px] bg-stone-300"></div>
                                    <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                                </div>
                            </div>

                            <div className={`w-2 h-2 rounded-full ${resourcesReady && isPoweredOn ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-red-900'} transition-colors duration-300 z-10`}></div>
                            <span className="text-[8px] text-white/50 font-bold scale-75 origin-left z-10">RDY</span>

                            <div className={`w-2 h-2 rounded-full bg-yellow-400 ${isLoading && isPoweredOn ? 'opacity-100 shadow-[0_0_5px_orange] animate-pulse' : 'opacity-20'} ml-2 transition-all duration-300 z-10`}></div>
                            <span className="text-[8px] text-white/50 font-bold scale-75 origin-left z-10">BUSY</span>

                            <div className={`w-2 h-2 rounded-full bg-blue-400 ${isPrinting && isPoweredOn ? 'opacity-100 shadow-[0_0_8px_cyan] animate-pulse' : 'opacity-20'} ml-2 transition-all duration-300 z-10`}></div>
                            <span className="text-[8px] text-white/50 font-bold scale-75 origin-left z-10">OUT</span>
                        </div>

                        {/* Execute Button */}
                        <div className="flex flex-col items-center gap-1">
                            <span className={labelStyle} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>执行</span>
                            <div className="p-1.5 bg-stone-400/30 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-stone-500/20">
                                <button
                                    onClick={() => convert(input)}
                                    disabled={!input.trim() || !resourcesReady || isLoading || !isPoweredOn}
                                    className={`
                                       w-14 h-14 rounded-full
                                       border-b-[4px] border-r-[1px]
                                       flex items-center justify-center transition-all
                                       ${isLoading
                                            ? 'bg-amber-600'
                                            : isPoweredOn
                                                ? 'bg-[#cc2222] hover:bg-[#dd3333] active:border-b-[1px] active:translate-y-1 shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)]'
                                                : 'bg-[#551111] border-[#330000] cursor-not-allowed shadow-none translate-y-1'
                                        }
                                    `}
                                >
                                    {/* Indentation on button top */}
                                    {isPoweredOn && <div className="w-10 h-10 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] bg-gradient-to-br from-black/10 to-transparent"></div>}
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
