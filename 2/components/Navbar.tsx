
import React from 'react';

interface NavbarProps {
  onOpenProKey: () => void;
  isProMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenProKey, isProMode }) => {
  return (
    <nav className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          GEMINI VISUAL STUDIO
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isProMode ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
          <span className="text-xs font-medium text-zinc-400">
            {isProMode ? 'PRO API' : 'STANDBY'}
          </span>
        </div>

        <button 
          onClick={onOpenProKey}
          className={`p-2 rounded-lg transition-all duration-200 border group ${
            isProMode 
            ? 'bg-zinc-900 border-emerald-500/50 text-emerald-500' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
          title="Configure API Access"
        >
          <svg className={`w-5 h-5 transform group-hover:scale-110 transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </button>

        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
          <img src="https://picsum.photos/32/32?random=1" alt="Avatar" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
