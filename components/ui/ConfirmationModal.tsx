"use client";

import { useEffect } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "red" | "blue" | "green" | "yellow";
  isLoading?: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonColor = "red",
  isLoading = false,
}: ConfirmationModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getConfirmButtonClasses = () => {
    return "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px] text-white";
  };
  
  const getConfirmButtonStyle = () => {
    const colors = {
      red: { bg: '#dc2626', hover: '#b91c1c' },
      blue: { bg: '#2563eb', hover: '#1d4ed8' },
      green: { bg: '#16a34a', hover: '#15803d' },
      yellow: { bg: '#eab308', hover: '#ca8a04' },
    };
    return { backgroundColor: colors[confirmButtonColor].bg };
  };
  
  const handleConfirmMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading) {
      const colors = {
        red: '#b91c1c',
        blue: '#1d4ed8',
        green: '#15803d',
        yellow: '#ca8a04',
      };
      e.currentTarget.style.backgroundColor = colors[confirmButtonColor];
    }
  };
  
  const handleConfirmMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading) {
      const colors = {
        red: '#dc2626',
        blue: '#2563eb',
        green: '#16a34a',
        yellow: '#eab308',
      };
      e.currentTarget.style.backgroundColor = colors[confirmButtonColor];
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      ></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="rounded-lg shadow-xl max-w-md w-full m-3 sm:m-0" style={{ backgroundColor: '#d6d6c2' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold" style={{ color: '#800000' }}>
              {title}
            </h3>
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-[#800000]/50 hover:text-[#800000] transition-colors"
                tabIndex={0}
                aria-label="Close modal"
                type="button"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-base leading-relaxed" style={{ color: '#800000' }}>
              {message}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="border-t p-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              style={{ backgroundColor: '#ebebeb', color: '#800000' }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#d4d4d4')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#ebebeb')}
              tabIndex={0}
              type="button"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={getConfirmButtonClasses()}
              style={getConfirmButtonStyle()}
              onMouseEnter={handleConfirmMouseEnter}
              onMouseLeave={handleConfirmMouseLeave}
              tabIndex={0}
              type="button"
              data-color={confirmButtonColor}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

