import React, { createContext, useContext, ReactNode } from 'react';
import { useConverter } from '../hooks/useConverter';
import { useResources } from '../hooks/useResources';
import { TranslationResult, ConversionStatus } from '../types';
import { HistoryEntry } from '../services/historyService';

// Define the shape of the context
interface ConverterContextType {
    input: string;
    setInput: (value: string) => void;
    result: TranslationResult | null;
    setResult: (result: TranslationResult | null) => void;
    status: ConversionStatus;
    error: string | null;
    mode: 'HYBRID' | 'PURE';
    setMode: (mode: 'HYBRID' | 'PURE') => void;
    isRealTime: boolean;
    setIsRealTime: (value: boolean) => void;
    convert: (text: string, overrideMode?: 'HYBRID' | 'PURE') => Promise<void>;

    // Resource status
    resourcesReady: boolean;
    resourcesError: string | null;
    retryResources: () => void;

    // History Actions
    restoreHistory: (entry: HistoryEntry) => void;
    clearAll: () => void;

    // UI State
    isHistoryVisible: boolean;
    setHistoryVisible: (visible: boolean) => void;
}

const ConverterContext = createContext<ConverterContextType | undefined>(undefined);

export const ConverterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isReady, error: dictError, retry } = useResources();
    const converter = useConverter(isReady);
    const [isHistoryVisible, setHistoryVisible] = React.useState(false);

    const restoreHistory = (entry: HistoryEntry) => {
        converter.setInput(entry.input);
        converter.setMode(entry.mode);
        converter.convert(entry.input, entry.mode);
        setHistoryVisible(false);
    };

    const clearAll = () => {
        converter.setInput('');
        converter.setResult(null);
    };

    const value = {
        ...converter,
        resourcesReady: isReady,
        resourcesError: dictError,
        retryResources: retry,
        restoreHistory,
        clearAll,
        isHistoryVisible,
        setHistoryVisible
    };

    return (
        <ConverterContext.Provider value={value}>
            {children}
        </ConverterContext.Provider>
    );
};

export const useConverterContext = () => {
    const context = useContext(ConverterContext);
    if (context === undefined) {
        throw new Error('useConverterContext must be used within a ConverterProvider');
    }
    return context;
};
