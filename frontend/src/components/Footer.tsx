import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 mt-16 border-t-2 border-gray-700/50">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-black/90 backdrop-blur-sm">
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-gray-600 to-gray-800 shadow-lg"
              style={{ left: `${i * 5}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          {/* Main footer content */}
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-2xl transform hover:scale-[1.02] transition-all duration-500 hover:border-orange-500/30">
            <p className="text-gray-300 font-mono tracking-wider text-lg mb-2">
              Made with{' '}
              <span className="text-red-400 animate-pulse text-xl mx-1">❤️</span>{' '}
              by the{' '}
              <a
                href="https://arbitrum.foundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 font-bold transition-colors duration-300 hover:underline decoration-2 underline-offset-4"
              >
                Arbitrum DevRel Team
              </a>
            </p>
            
            <div className="flex justify-center items-center space-x-4 mt-4 pt-4 border-t border-gray-700/50">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <div className="text-gray-500 font-mono text-sm tracking-widest">
                PRISONER'S DILEMMA WORKSHOP • GAME THEORY
              </div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="inline-block text-gray-600 font-mono text-xs tracking-wider opacity-60">
              █▓▒░ ESCAPE IS IMPOSSIBLE ░▒▓█
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
