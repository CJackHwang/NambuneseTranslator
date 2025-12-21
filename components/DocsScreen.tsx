import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface DocsScreenProps {
    onBack: () => void;
}

/**
 * Documentation Screen Component
 * Displayed within the main device CRT area
 */
const DocsScreen: React.FC<DocsScreenProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
    }, []);

    /**
     * Improved Markdown to HTML converter
     */
    const renderMarkdown = (md: string): string => {
        const lines = md.split('\n');
        const result: string[] = [];
        let inCodeBlock = false;
        let inTable = false;
        let tableRows: string[] = [];

        const processTableRows = (rows: string[]): string => {
            if (rows.length < 2) return rows.join('\n');

            const headerRow = rows[0];
            const dataRows = rows.slice(2);

            const headerCells = headerRow.split('|').map(c => c.trim()).filter(c => c);
            const headerHtml = '<thead><tr>' + headerCells.map(c =>
                `<th class="border border-stone-600 px-2 py-1.5 bg-stone-800/50 font-bold text-left text-xs whitespace-nowrap text-stone-300 uppercase tracking-wider">${escapeHtml(c)}</th>`
            ).join('') + '</tr></thead>';

            const bodyHtml = '<tbody>' + dataRows.map(row => {
                const cells = row.split('|').map(c => c.trim()).filter(c => c);
                return '<tr>' + cells.map(c =>
                    `<td class="border border-stone-700 px-2 py-1.5 text-xs text-stone-400 font-mono">${processInline(escapeHtml(c))}</td>`
                ).join('') + '</tr>';
            }).join('') + '</tbody>';

            return `<div class="overflow-x-auto my-4 -mx-2 px-2"><table class="w-full text-sm border-collapse min-w-max">${headerHtml}${bodyHtml}</table></div>`;
        };

        const escapeHtml = (str: string): string => {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        const processInline = (text: string): string => {
            return text
                .replace(/`([^`]+)`/g, '<code class="bg-stone-800 px-1 py-0.5 border border-stone-600 text-xs text-stone-300 font-mono">$1</code>')
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-stone-200">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em class="italic text-stone-500">$1</em>');
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    result.push('</code></pre>');
                    inCodeBlock = false;
                } else {
                    result.push('<pre class="bg-black/40 border border-stone-700 p-3 overflow-x-auto text-xs my-3 font-mono text-stone-400"><code>');
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                result.push(escapeHtml(line));
                continue;
            }

            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else if (inTable) {
                result.push(processTableRows(tableRows));
                inTable = false;
                tableRows = [];
            }

            if (line.startsWith('# ')) {
                const text = line.slice(2).replace(/\*\*/g, '');
                result.push(`<h1 class="text-xl font-bold text-stone-200 mb-4 mt-6 text-center uppercase tracking-widest border-b border-stone-600 pb-2">${escapeHtml(text)}</h1>`);
                continue;
            }
            if (line.startsWith('## ')) {
                const text = line.slice(3).replace(/\*\*/g, '');
                result.push(`<h2 class="text-lg font-bold text-stone-300 mt-6 mb-3 border-b border-dashed border-stone-600 pb-2 uppercase tracking-wide flex items-center gap-2"><span class="w-2 h-2 bg-stone-500 inline-block"></span>${escapeHtml(text)}</h2>`);
                continue;
            }
            if (line.startsWith('### ')) {
                const text = line.slice(4).replace(/\*\*/g, '');
                result.push(`<h3 class="text-base font-bold text-stone-400 mt-5 mb-2 uppercase font-mono">> ${escapeHtml(text)}</h3>`);
                continue;
            }
            if (line.startsWith('#### ')) {
                const text = line.slice(5).replace(/\*\*/g, '');
                result.push(`<h4 class="text-sm font-bold text-stone-500 mt-4 mb-2 font-mono ml-4 decoration-stone-600 underline decoration-dotted underline-offset-4">${escapeHtml(text)}</h4>`);
                continue;
            }

            if (line.trim() === '---') {
                result.push('<hr class="my-4 border-stone-700" />');
                continue;
            }

            if (line.startsWith('> ')) {
                result.push(`<blockquote class="border-l-4 border-stone-500 pl-3 py-1 my-2 text-stone-400 italic text-sm bg-stone-900/50">${processInline(escapeHtml(line.slice(2)))}</blockquote>`);
                continue;
            }

            if (line.startsWith('- ')) {
                result.push(`<li class="ml-4 list-disc text-sm leading-relaxed marker:text-stone-500 text-stone-400">${processInline(escapeHtml(line.slice(2)))}</li>`);
                continue;
            }
            if (/^\d+\. /.test(line)) {
                const text = line.replace(/^\d+\. /, '');
                result.push(`<li class="ml-4 list-decimal text-sm leading-relaxed marker:text-stone-500 font-mono text-stone-400">${processInline(escapeHtml(line))}</li>`);
                continue;
            }

            if (line.trim() === '') {
                result.push('<div class="h-2"></div>');
                continue;
            }

            result.push(`<p class="text-sm leading-relaxed my-2 text-stone-400">${processInline(escapeHtml(line))}</p>`);
        }

        if (inTable && tableRows.length > 0) {
            result.push(processTableRows(tableRows));
        }

        return result.join('\n');
    };

    return (
        <div className="flex flex-col h-full bg-[#151515] text-stone-300 font-mono relative overflow-hidden">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20 opacity-20"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1c] border-b border-stone-700 shadow-md z-30 shrink-0">
                <div className="flex items-center gap-2 text-stone-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                    <h2 className="text-sm font-bold uppercase tracking-widest">{t('docsTitle')}</h2>
                </div>
                <div className="w-4"></div>{/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-stone-600 gap-3">
                        <div className="w-6 h-6 border-2 border-stone-600 border-t-stone-400 rounded-full animate-spin"></div>
                        <span className="text-xs uppercase tracking-widest animate-pulse">ACCESSING_DATA...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-900/70 font-mono p-8">
                        <div className="border border-red-900/50 p-6 bg-red-950/10 text-center max-w-sm">
                            <p className="font-bold uppercase mb-2 text-red-800">DATA_CORRUPTED</p>
                            <p className="text-xs text-red-900/60">{error}</p>
                        </div>
                    </div>
                ) : (
                    <article
                        className="prose prose-sm prose-invert max-w-none font-sans prose-headings:font-mono prose-p:text-stone-400 prose-strong:text-stone-300 prose-code:text-stone-400"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                    />
                )}
            </div>

            {/* Footer Status Line */}
            <div className="px-3 py-1 bg-[#1a1a1c] border-t border-stone-700 text-[10px] text-stone-600 flex justify-between uppercase tracking-wider z-30 shrink-0">
                <span>MEM: OK</span>
                <span>SECURE_VIEW</span>
            </div>
        </div>
    );
};

export default DocsScreen;
