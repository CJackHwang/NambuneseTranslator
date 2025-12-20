/**
 * Translation History Service
 * 使用 localStorage 持久化存储翻译历史记录
 * 只存储输入文本和模式，恢复时重新执行翻译（利用缓存）
 */

import { ConverterMode } from '../hooks/useConverter';

const STORAGE_KEY = 'translation-history';
const MAX_ENTRIES = 50;

export interface HistoryEntry {
    id: string;
    timestamp: number;
    input: string;
    mode: ConverterMode;
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 获取所有历史记录
 */
export function getHistory(): HistoryEntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load translation history:', e);
    }
    return [];
}

/**
 * 保存历史记录到 localStorage
 */
function saveHistory(entries: HistoryEntry[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
        console.warn('Failed to save translation history:', e);
    }
}

/**
 * 添加新的历史条目
 * 自动去重（相同输入不重复添加）并限制总数
 */
export function addHistory(
    input: string,
    mode: ConverterMode
): HistoryEntry {
    const entries = getHistory();
    const trimmedInput = input.trim();

    // 检查是否已存在相同输入
    const existingIndex = entries.findIndex(e => e.input === trimmedInput);
    if (existingIndex !== -1) {
        // 更新现有条目并移到最前
        const existing = entries.splice(existingIndex, 1)[0];
        existing.timestamp = Date.now();
        existing.mode = mode;
        entries.unshift(existing);
        saveHistory(entries);
        return existing;
    }

    // 创建新条目
    const newEntry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        input: trimmedInput,
        mode
    };

    // 添加到开头
    entries.unshift(newEntry);

    // LRU: 超出限制时删除最旧的
    if (entries.length > MAX_ENTRIES) {
        entries.pop();
    }

    saveHistory(entries);
    return newEntry;
}

/**
 * 删除单条历史记录
 */
export function deleteHistory(id: string): void {
    const entries = getHistory().filter(e => e.id !== id);
    saveHistory(entries);
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * 格式化时间戳为可读字符串
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
    });
}
