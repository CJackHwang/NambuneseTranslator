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
}

/**
 * History Panel Component
 * Uses Modal component for full-screen display
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({ onRestore }) => {
    const { t } = useLanguage();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

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

    const openModal = () => {
        setEntries(getHistory());
        setIsOpen(true);
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

    const footer = (
        <div className="flex justify-between items-center">
            {entries.length > 0 ? (
                <button
                    onClick={handleClear}
                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                    {t('clearHistory')}
                </button>
            ) : (
                <span></span>
            )}
            <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-dl-accent hover:bg-teal-700 dark:hover:bg-teal-600 rounded-lg shadow-sm transition-all active:scale-95"
            >
                {t('close')}
            </button>
        </div>
    );

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={openModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('history')}
            </button>

            {/* Modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={t('history')}
                titleIcon={titleIcon}
                titleExtra={titleExtra}
                footer={footer}
                maxWidth="lg"
            >
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">{t('noHistory')}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-dl-border dark:divide-dl-dark-border">
                        {entries.map((entry) => (
                            <li
                                key={entry.id}
                                onClick={() => handleRestore(entry)}
                                className="px-4 sm:px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                title={t('historyTooltip')}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-dl-primary dark:text-gray-200 font-medium line-clamp-2">
                                            {entry.input}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                {formatTimestamp(entry.timestamp)}
                                            </span>
                                            <span className={`
                                                text-[10px] px-1.5 py-0.5 rounded font-medium
                                                ${entry.mode === 'HYBRID'
                                                    ? 'bg-dl-accent/10 text-dl-accent dark:bg-teal-900/30 dark:text-teal-400'
                                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}
                                            `}>
                                                {entry.mode === 'HYBRID' ? 'AI' : t('modePure')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(entry.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
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
            </Modal>
        </>
    );
};

export default HistoryPanel;
