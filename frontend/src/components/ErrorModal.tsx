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
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-2xl border-2 border-red-500/50 shadow-2xl" />
        <div className="absolute inset-1 bg-black/80 rounded-xl border border-red-400/30" />

        {/* Glow effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 blur-2xl"></div>
        </div>

        {/* Animated corners */}
        <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 mb-2 tracking-wider drop-shadow-2xl">
              {title}
            </h2>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
          </div>

          {/* Message */}
          <div className="bg-black/50 rounded-xl border border-red-500/30 p-6 mb-6">
            <p className="text-red-200 text-center text-lg font-mono tracking-wide leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="group relative w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-black text-xl tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-red-400/50 hover:border-red-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <span className="relative z-10">CLOSE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
