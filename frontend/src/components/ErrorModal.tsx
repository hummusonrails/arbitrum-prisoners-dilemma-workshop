import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title = '⚠️ ERROR', message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-xl border-2 border-red-500/50 shadow-2xl" />
        <div className="absolute inset-1 bg-black/90 rounded-lg border border-red-400/30" />

        {/* Glow effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 blur-xl"></div>
        </div>

        {/* Animated corners */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 tracking-wider">
              {title}
            </h2>
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-2" />
          </div>

          {/* Message */}
          <div className="bg-black/50 rounded-lg border border-red-500/30 p-4 mb-4 max-h-60 overflow-y-auto">
            <p className="text-red-200 text-sm font-mono leading-relaxed break-words">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="group relative w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-6 py-3 rounded-lg font-bold tracking-wider transition-all duration-300 transform hover:scale-105 border border-red-400/50 hover:border-red-300"
          >
            <span className="relative z-10">CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
