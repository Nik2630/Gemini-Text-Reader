import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ArrowLeft, Loader2, Mic2, Settings2 } from 'lucide-react';
import { PlaybackState, VoiceName, ReaderMode } from '../types';

interface ControlsProps {
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  currentVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  currentMode: ReaderMode;
  onModeChange: (mode: ReaderMode) => void;
  progress: number; // 0 to 100 representing current playback position
  bufferedIndices: Set<number>;
  totalSentences: number;
}

const Controls: React.FC<ControlsProps> = ({
  playbackState,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  currentVoice,
  onVoiceChange,
  currentMode,
  onModeChange,
  progress,
  bufferedIndices,
  totalSentences,
}) => {
  const isPlaying = playbackState === 'playing';
  const isBuffering = playbackState === 'buffering' || playbackState === 'loading';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-neutral-800 p-6 z-50">
      
      {/* Progress Bar Container */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 w-full overflow-hidden">
        {/* Buffered Segments */}
        {totalSentences > 0 && Array.from(bufferedIndices).map((idx: number) => {
           const left = (idx / totalSentences) * 100;
           const width = (1 / totalSentences) * 100;
           return (
             <div 
               key={idx} 
               className="absolute top-0 bottom-0 bg-neutral-700 transition-all duration-300"
               style={{ left: `${left}%`, width: `${width}%` }}
             />
           );
        })}
        
        {/* Current Playhead */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        
        {/* Left: Configuration Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            <button
                onClick={onReset}
                className="p-2 text-neutral-500 hover:text-white transition-colors"
                title="Back to Input"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              {/* Voice Selector */}
              <div className="flex items-center gap-2 bg-neutral-900 rounded-lg px-3 py-2 border border-white/5 hover:border-white/10 transition-colors">
                  <Mic2 className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={currentVoice}
                    onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
                    className="bg-transparent border-none text-xs tracking-wider uppercase font-medium text-neutral-300 focus:outline-none cursor-pointer w-24 md:w-32"
                    disabled={isPlaying || isBuffering}
                  >
                  {Object.values(VoiceName).map((voice) => (
                      <option key={voice} value={voice} className="bg-neutral-900 text-neutral-200">
                      {voice}
                      </option>
                  ))}
                  </select>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-2 bg-neutral-900 rounded-lg px-3 py-2 border border-white/5 hover:border-white/10 transition-colors">
                  <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
                  <select
                    value={currentMode}
                    onChange={(e) => onModeChange(e.target.value as ReaderMode)}
                    className="bg-transparent border-none text-xs tracking-wider uppercase font-medium text-neutral-300 focus:outline-none cursor-pointer w-20 md:w-24"
                    disabled={isPlaying || isBuffering}
                  >
                    <option value="narrator" className="bg-neutral-900">Narrator</option>
                    <option value="speed" className="bg-neutral-900">Speed</option>
                    <option value="news" className="bg-neutral-900">News</option>
                    <option value="monotone" className="bg-neutral-900">Monotone</option>
                  </select>
              </div>
            </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-8">
          <button
            onClick={onPrev}
            className="p-2 text-neutral-500 hover:text-white transition-colors hover:bg-white/5 rounded-full"
            disabled={isBuffering}
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="relative p-6 bg-white hover:bg-neutral-200 text-black rounded-full transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isBuffering ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-neutral-500 hover:text-white transition-colors hover:bg-white/5 rounded-full"
            disabled={isBuffering}
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Right: Status (hidden on mobile) */}
        <div className="w-full md:w-auto md:min-w-[200px] text-center md:text-right hidden md:block">
             {isBuffering ? (
               <span className="text-[10px] uppercase tracking-widest text-neutral-500 animate-pulse">
                 Buffer {Array.from(bufferedIndices).length}/{totalSentences}
               </span>
             ) : (
               <span className="text-[10px] uppercase tracking-widest text-neutral-600">
                 {Math.round(progress)}% Complete
               </span>
             )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
