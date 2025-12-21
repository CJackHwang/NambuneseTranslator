import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Modal from './Modal';
import {
    getHistory,
    deleteHistory,
    clearHistory,
    formatTimestamp,
    HistoryEntry
} from '../services/historyService';

interface HistoryPanelProps {
    onRestore: (entry: HistoryEntry) => void;
    isOpen: boolean;
    onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onRestore, isOpen, onClose }) => {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);

    // Refresh entries when opened
    useEffect(() => {
        if (isOpen) {
            setEntries(getHistory());
        }
    }, [isOpen]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteHistory(id);
        setEntries(getHistory());
    };

    const handleClear = () => {
        if (entries.length === 0) return;
        clearHistory();
        setEntries([]);
    };

    const handleRestore = (entry: HistoryEntry) => {
        onRestore(entry);
        // onClose(); // Handled by parent or context
    };

    const titleIcon = (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const titleExtra = entries.length > 0 && (
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
            ({entries.length})
        </span>
    );

    return (
        <>
            {/* Full-Screen Overlay */}
            {isOpen && (
                <div className="absolute inset-0 z-[60] flex flex-col bg-[#1c1e1c]/95 backdrop-blur-sm border-2 border-stone-700 shadow-2xl overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2c] border-b border-stone-700">
                        <div className="flex items-center gap-2 text-stone-300">
                            {titleIcon}
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {t('history')} {titleExtra}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-stone-500 hover:text-white"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-2 bg-crt-base custom-scrollbar relative">
                        {/* Scanlines for the overlay too */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-10 opacity-20"></div>

                        {entries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-stone-600">
                                <span className="text-xs uppercase tracking-widest">[ EMPTY_LOG ]</span>
                            </div>
                        ) : (
                            <ul className="divide-y divide-stone-800 relative z-20">
                                {entries.map((entry) => (
                                    <li
                                        key={entry.id}
                                        onClick={() => handleRestore(entry)}
                                        className="group px-3 py-2 hover:bg-[#2a2a2c] cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-stone-300 font-mono line-clamp-1 mb-1 group-hover:text-white">
                                                    {entry.input}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-stone-600 font-mono uppercase">
                                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className={`
                                                        text-[9px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-wide
                                                        ${entry.mode === 'HYBRID'
                                                            ? 'text-teal-500 bg-teal-900/20'
                                                            : 'text-purple-500 bg-purple-900/20'}
                                                    `}>
                                                        {entry.mode === 'HYBRID' ? 'AI' : 'RAW'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(entry.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-red-400 transition-opacity"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-1.5 bg-[#2a2a2c] border-t border-stone-700 flex justify-between items-center text-[10px] text-stone-500 font-mono uppercase tracking-wide">
                        <span>REC: {entries.length}</span>
                        {entries.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="hover:text-red-400 hover:underline"
                            >
                                [ CLEAR_ALL ]
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default HistoryPanel;
