import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: React.ReactNode;
    titleExtra?: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl'
};

/**
 * Reusable Full-screen Modal Component
 * Provides consistent styling for all modal dialogs
 */
const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    titleIcon,
    titleExtra,
    footer,
    maxWidth = 'lg',
    children
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 transition-opacity">
            <div className={`bg-white dark:bg-dl-dark-surface rounded-xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90dvh] border border-gray-100 dark:border-gray-700 animate-fade-in`}>

                {/* Header */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {titleIcon && (
                            <span className="text-dl-accent dark:text-teal-400 shrink-0">
                                {titleIcon}
                            </span>
                        )}
                        <h2 className="text-base sm:text-lg font-bold text-dl-primary dark:text-white truncate">
                            {title}
                        </h2>
                        {titleExtra}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
