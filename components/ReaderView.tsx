import React, { useEffect, useRef } from 'react';
import { Sentence } from '../types';
import clsx from 'clsx';

interface ReaderViewProps {
  sentences: Sentence[];
  currentIndex: number;
}

const ReaderView: React.FC<ReaderViewProps> = ({ sentences, currentIndex }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeSentenceRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll active sentence into view
  useEffect(() => {
    if (activeSentenceRef.current && scrollContainerRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto overflow-hidden relative mt-0 mb-32">
      <div 
        ref={scrollContainerRef}
        className="h-[calc(100vh-10rem)] overflow-y-auto px-6 py-12 md:px-0 md:py-20 no-scrollbar"
      >
        <div className="text-xl md:text-2xl leading-[1.8] text-neutral-400 font-serif antialiased">
            {sentences.map((sentence, idx) => {
              const isActive = idx === currentIndex;
              const isPast = idx < currentIndex;
              
              return (
                <React.Fragment key={idx}>
                  {sentence.isParagraphStart && (
                    <div className="h-6 md:h-8 w-full" aria-hidden="true" />
                  )}
                  <span
                    ref={isActive ? activeSentenceRef : null}
                    className={clsx(
                      "transition-all duration-500 rounded px-1 -mx-1 inline-block",
                      isActive 
                        ? "text-neutral-100 font-medium scale-100 origin-center" 
                        : isPast 
                          ? "text-neutral-700 blur-[0.3px]" 
                          : "text-neutral-600"
                    )}
                  >
                    {sentence.text}{" "}
                  </span>
                </React.Fragment>
              );
            })}
        </div>
      </div>
      
      {/* Gradient overlays for cinematic fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default ReaderView;