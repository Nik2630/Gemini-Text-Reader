import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between py-6 px-6 md:px-8 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-neutral-500" />
        <h1 className="text-lg md:text-xl font-serif font-medium text-neutral-200 tracking-tight">
          Gemini Text Reader
        </h1>
      </div>
      <div className="text-xs uppercase tracking-widest text-neutral-600 hidden md:block">
        Gemini 2.5 Flash
      </div>
    </header>
  );
};

export default Header;