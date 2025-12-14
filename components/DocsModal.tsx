import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DocsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Documentation Modal Component
 * Displays the official Nambunese specification document
 */
const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !content) {
            setIsLoading(true);
            setError(null);

            fetch('/data/specification.md')
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
                    return res.text();
                })
                .then(text => {
                    setContent(text);
                    setIsLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setIsLoading(false);
                });
        }
    }, [isOpen, content]);

    if (!isOpen) return null;

    /**
     * Improved Markdown to HTML converter
     * Better table parsing and mobile responsiveness
     */
    const renderMarkdown = (md: string): string => {
        const lines = md.split('\n');
        const result: string[] = [];
        let inCodeBlock = false;
        let inTable = false;
        let tableRows: string[] = [];

        const processTableRows = (rows: string[]): string => {
            if (rows.length < 2) return rows.join('\n');

            // First row is header, second is separator (skip it), rest are data
            const headerRow = rows[0];
            const dataRows = rows.slice(2); // Skip separator row

            const headerCells = headerRow.split('|').map(c => c.trim()).filter(c => c);
            const headerHtml = '<thead><tr>' + headerCells.map(c =>
                `<th class="border border-dl-border dark:border-dl-dark-border px-2 py-1.5 bg-gray-50 dark:bg-gray-800 font-bold text-left text-xs whitespace-nowrap">${escapeHtml(c)}</th>`
            ).join('') + '</tr></thead>';

            const bodyHtml = '<tbody>' + dataRows.map(row => {
                const cells = row.split('|').map(c => c.trim()).filter(c => c);
                return '<tr>' + cells.map(c =>
                    `<td class="border border-dl-border dark:border-dl-dark-border px-2 py-1.5 text-xs">${processInline(escapeHtml(c))}</td>`
                ).join('') + '</tr>';
            }).join('') + '</tbody>';

            return `<div class="overflow-x-auto my-4 -mx-2 px-2"><table class="w-full text-sm border-collapse min-w-max">${headerHtml}${bodyHtml}</table></div>`;
        };

        const escapeHtml = (str: string): string => {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        const processInline = (text: string): string => {
            return text
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs text-teal-700 dark:text-teal-300">$1</code>')
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code blocks
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    result.push('</code></pre>');
                    inCodeBlock = false;
                } else {
                    result.push('<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs my-3"><code>');
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                result.push(escapeHtml(line));
                continue;
            }

            // Table detection
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else if (inTable) {
                // End of table
                result.push(processTableRows(tableRows));
                inTable = false;
                tableRows = [];
            }

            // Headers
            if (line.startsWith('# ')) {
                const text = line.slice(2).replace(/\*\*/g, '');
                result.push(`<h1 class="text-xl font-bold text-dl-primary dark:text-gray-100 mb-4 mt-6 text-center">${escapeHtml(text)}</h1>`);
                continue;
            }
            if (line.startsWith('## ')) {
                const text = line.slice(3).replace(/\*\*/g, '');
                result.push(`<h2 class="text-lg font-bold text-dl-primary dark:text-gray-100 mt-6 mb-3 border-b-2 border-dl-accent dark:border-teal-600 pb-2">${escapeHtml(text)}</h2>`);
                continue;
            }
            if (line.startsWith('### ')) {
                const text = line.slice(4).replace(/\*\*/g, '');
                result.push(`<h3 class="text-base font-bold text-dl-primary dark:text-gray-100 mt-5 mb-2">${escapeHtml(text)}</h3>`);
                continue;
            }
            if (line.startsWith('#### ')) {
                const text = line.slice(5).replace(/\*\*/g, '');
                result.push(`<h4 class="text-sm font-bold text-dl-primary dark:text-gray-100 mt-4 mb-2">${escapeHtml(text)}</h4>`);
                continue;
            }

            // Horizontal rule
            if (line.trim() === '---') {
                result.push('<hr class="my-4 border-dl-border dark:border-dl-dark-border" />');
                continue;
            }

            // Blockquote
            if (line.startsWith('> ')) {
                result.push(`<blockquote class="border-l-4 border-dl-accent dark:border-teal-600 pl-3 py-1 my-2 text-dl-textSec dark:text-gray-400 italic text-sm">${processInline(escapeHtml(line.slice(2)))}</blockquote>`);
                continue;
            }

            // List items
            if (line.startsWith('- ')) {
                result.push(`<li class="ml-4 list-disc text-sm leading-relaxed">${processInline(escapeHtml(line.slice(2)))}</li>`);
                continue;
            }
            if (/^\d+\. /.test(line)) {
                const text = line.replace(/^\d+\. /, '');
                result.push(`<li class="ml-4 list-decimal text-sm leading-relaxed">${processInline(escapeHtml(text))}</li>`);
                continue;
            }

            // Empty line
            if (line.trim() === '') {
                result.push('<div class="h-2"></div>');
                continue;
            }

            // Regular paragraph
            result.push(`<p class="text-sm leading-relaxed my-2">${processInline(escapeHtml(line))}</p>`);
        }

        // Handle unclosed table
        if (inTable && tableRows.length > 0) {
            result.push(processTableRows(tableRows));
        }

        return result.join('\n');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 transition-opacity">
            <div className="bg-white dark:bg-dl-dark-surface rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90dvh] border border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dl-accent dark:text-teal-400 shrink-0">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                        <h2 className="text-base sm:text-lg font-bold text-dl-primary dark:text-white truncate">{t('docsTitle')}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 text-dl-text dark:text-dl-dark-text">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-dl-accent dark:text-teal-400">
                            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-sm">{t('loading')}</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-4 opacity-50">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <article
                            className="prose prose-sm dark:prose-invert max-w-none font-sans"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 flex justify-between items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">v5.1 | CC BY-SA 4.0</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium tracking-wide text-white bg-dl-accent hover:bg-teal-700 dark:hover:bg-teal-600 rounded-lg shadow-sm transition-all active:scale-95"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocsModal;

