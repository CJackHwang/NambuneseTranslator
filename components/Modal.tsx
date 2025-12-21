import React, { useState, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: React.ReactNode;
    titleExtra?: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    children: React.ReactNode;
}

/**
 * Reusable Full-screen Modal Component
 * Provides consistent styling for all modal dialogs
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, maxWidth = 'md', titleIcon, titleExtra }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [show, setShow] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            setIsClosing(false);
        } else {
            setIsClosing(true);
            const timer = setTimeout(() => setShow(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!show) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        'full': 'max-w-full mx-4'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Darken the "room" (screen overlay) */}
            <div
                className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={onClose}
            />

            {/* OS Window */}
            <div
                className={`
                    relative z-10 w-full ${maxWidthClasses[maxWidth]} 
                    bg-[#1a1a1c] border-2 border-dl-primary
                    shadow-[0_0_0_1px_rgba(0,0,0,1),10px_10px_0_rgba(0,0,0,0.5)] 
                    flex flex-col max-h-[90dvh]
                    transition-all duration-200 transform
                    font-mono
                    ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
                `}
            >
                {/* Window Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-dl-primary text-black border-b border-dl-primary">
                    <div className="flex items-center gap-2">
                        {titleIcon && <div className="text-black">{titleIcon}</div>}
                        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center">
                            {title}
                            {titleExtra}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center bg-black text-dl-primary hover:bg-dl-textSec hover:text-black transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Window Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121214] text-dl-text p-1">
                    {children}
                </div>

                {/* Window Footer */}
                {footer && (
                    <div className="px-3 py-2 bg-[#1a1a1c] border-t border-dl-border/30 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
