import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
    getHistory,
    deleteHistory,
    clearHistory,
    formatTimestamp,
    HistoryEntry
} from '../services/historyService';

interface HistoryPanelProps {
    onRestore: (entry: HistoryEntry) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onRestore }) => {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load history on mount and when panel opens
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
        setIsOpen(false);
    };

    // Refresh history when opening
    const togglePanel = () => {
        if (!isOpen) {
            setEntries(getHistory());
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={togglePanel}
                className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${isOpen
                        ? 'bg-dl-accent text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
        `}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('history')}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-dl-dark-surface rounded-xl shadow-lg border border-dl-border dark:border-dl-dark-border overflow-hidden z-50 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dl-border dark:border-dl-dark-border bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-sm font-semibold text-dl-primary dark:text-gray-200">
                            {t('history')} {entries.length > 0 && <span className="text-gray-400 dark:text-gray-500 font-normal">({entries.length})</span>}
                        </span>
                        {entries.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium"
                            >
                                {t('clearHistory')}
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-72">
                        {entries.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                {t('noHistory')}
                            </div>
                        ) : (
                            <ul className="divide-y divide-dl-border dark:divide-dl-dark-border">
                                {entries.map((entry) => (
                                    <li
                                        key={entry.id}
                                        onClick={() => handleRestore(entry)}
                                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                        title={t('historyTooltip')}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                {/* Input preview */}
                                                <p className="text-sm text-dl-primary dark:text-gray-200 truncate font-medium">
                                                    {entry.input.length > 40 ? entry.input.slice(0, 40) + '...' : entry.input}
                                                </p>
                                                {/* Metadata */}
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                        {formatTimestamp(entry.timestamp)}
                                                    </span>
                                                    <span className={`
                            text-[10px] px-1.5 py-0.5 rounded
                            ${entry.mode === 'HYBRID'
                                                            ? 'bg-dl-accent/10 text-dl-accent'
                                                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}
                          `}>
                                                        {entry.mode === 'HYBRID' ? 'AI' : 'PURE'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => handleDelete(entry.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-all"
                                                title={t('deleteEntry')}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close panel */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default HistoryPanel;
