import React, { useState } from 'react';
import { ClipboardPaste, Link2, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Readability } from '@mozilla/readability';

interface TextInputProps {
  onStartReading: (text: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onStartReading }) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleStart = () => {
    if (text.trim()) {
      onStartReading(text);
    }
  };

  const handleUrlFetch = async () => {
    if (!url) return;
    setIsLoadingUrl(true);
    setFetchError(null);
    
    try {
       // Use AllOrigins as a CORS proxy to get the raw HTML
       const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
       const response = await fetch(proxyUrl);
       
       if (!response.ok) {
         throw new Error(`Failed to fetch URL: ${response.statusText}`);
       }

       const htmlText = await response.text();
       
       // Parse the HTML string into a DOM Document
       const parser = new DOMParser();
       const doc = parser.parseFromString(htmlText, 'text/html');
       
       // Use Mozilla Readability to parse the article
       // We create a new Readability instance with the parsed document
       const reader = new Readability(doc);
       const article = reader.parse();

       if (article) {
         // Combine title and text content for a better reading experience
         const fullText = `${article.title}\n\n${article.textContent}`;
         // Remove excessive whitespace that might have been left over
         const cleanText = fullText.replace(/\n\s+\n/g, '\n\n').trim();
         setText(cleanText);
       } else {
         // Fallback if Readability fails to find an article
         const stripped = doc.body.textContent || "";
         setText(stripped.trim());
         setFetchError("Could not detect a clear article. Extracted raw text instead.");
       }

    } catch (e) {
      console.error(e);
      setFetchError("The public CORS proxy (api.allorigins.win) might be down. Please paste the text directly or use your own proxy.");
    } finally {
      setIsLoadingUrl(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-col gap-6">
        
        {/* URL Input */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 transition-colors group-hover:text-neutral-400" />
              <input 
                type="url"
                placeholder="Paste article URL (e.g., https://example.com/article)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-300 focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700 transition-all font-sans text-sm"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (fetchError) setFetchError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
              />
            </div>
            <button 
              onClick={handleUrlFetch}
              disabled={!url || isLoadingUrl}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors disabled:opacity-50 font-medium text-xs uppercase tracking-wider min-w-[80px] flex items-center justify-center"
            >
              {isLoadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
            </button>
          </div>
          
          {fetchError && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 border border-red-900/50 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
           <div className="h-px bg-neutral-900 flex-1"></div>
           <span className="text-neutral-700 text-xs uppercase tracking-widest">or</span>
           <div className="h-px bg-neutral-900 flex-1"></div>
        </div>

        {/* Text Area */}
        <div className="relative group">
          <textarea
            className="w-full h-80 bg-neutral-900/30 border border-neutral-800 hover:border-neutral-700 rounded-xl p-6 text-neutral-300 focus:outline-none focus:border-neutral-600 resize-none transition-all placeholder:text-neutral-700 leading-relaxed font-serif text-lg"
            placeholder="Paste your text here to begin reading..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handlePaste}
            className="absolute right-4 bottom-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Paste from Clipboard"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleStart}
          disabled={!text.trim()}
          className="w-full py-4 bg-white hover:bg-neutral-200 text-black rounded-xl font-medium text-sm uppercase tracking-widest transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
        >
          <BookOpen className="w-4 h-4" />
          Start Reader
        </button>
      </div>
    </div>
  );
};

export default TextInput;