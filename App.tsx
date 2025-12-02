import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import TextInput from './components/TextInput';
import ReaderView from './components/ReaderView';
import Controls from './components/Controls';
import { splitIntoSentences, getContextWindow } from './utils/textUtils';
import { generateSpeechForSentence } from './services/geminiService';
import { getAudioContext, decodeAudioData } from './utils/audioUtils';
import { Sentence, PlaybackState, VoiceName, ReaderMode } from './types';

const INITIAL_BUFFER_COUNT = 5;
const LOOKAHEAD_COUNT = 8;

const App: React.FC = () => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  
  // Settings State
  const [currentVoice, setCurrentVoice] = useState<VoiceName>(VoiceName.Schedar); // Default to Schedar 
  const [currentMode, setCurrentMode] = useState<ReaderMode>('narrator');

  // Cache to store decoded audio buffers
  const audioCacheRef = useRef<Record<number, AudioBuffer>>({});
  // Track which indices are buffered for UI visualization
  const [bufferedIndices, setBufferedIndices] = useState<Set<number>>(new Set());

  // Refs for audio management and concurrency control
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false); 
  const currentVoiceRef = useRef(currentVoice); 
  const currentModeRef = useRef(currentMode);
  
  // Session ID tracks the current "playback context". 
  // Incrementing this invalidates any pending audio operations from previous contexts (e.g., previous "Next" clicks).
  const sessionRef = useRef(0);

  const hasContent = sentences.length > 0;

  // Clear cache when voice or mode changes
  const resetCache = useCallback(() => {
    stopAudio();
    audioCacheRef.current = {};
    setBufferedIndices(new Set());
    sessionRef.current += 1; // Invalidate current session
  }, []);

  useEffect(() => {
    currentVoiceRef.current = currentVoice;
    if (hasContent) {
      resetCache();
      setPlaybackState('idle');
    }
  }, [currentVoice, hasContent, resetCache]);

  useEffect(() => {
    currentModeRef.current = currentMode;
    if (hasContent) {
      resetCache();
      setPlaybackState('idle');
    }
  }, [currentMode, hasContent, resetCache]);

  const fetchAudioForIndex = async (index: number, currentSentences: Sentence[], voice: VoiceName, mode: ReaderMode) => {
    // If already cached or out of bounds, skip
    if (audioCacheRef.current[index] || index < 0 || index >= currentSentences.length) return;

    try {
      const { prev, current, next } = getContextWindow(currentSentences, index);
      // Pass the mode to the service
      const base64Audio = await generateSpeechForSentence(prev, current, next, voice, mode);
      
      // Check if voice/mode changed while we were fetching. If so, discard this result.
      if (voice !== currentVoiceRef.current || mode !== currentModeRef.current) return;

      const ctx = getAudioContext();
      const buffer = await decodeAudioData(base64Audio, ctx);
      
      audioCacheRef.current[index] = buffer;
      setBufferedIndices(prev => {
        const nextSet = new Set(prev);
        nextSet.add(index);
        return nextSet;
      });
    } catch (e) {
      console.error(`Failed to fetch audio for index ${index}`, e);
    }
  };

  const bufferRange = async (startIndex: number, count: number, currentSentences: Sentence[]) => {
    const promises = [];
    const endIndex = Math.min(startIndex + count, currentSentences.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      promises.push(fetchAudioForIndex(i, currentSentences, currentVoiceRef.current, currentModeRef.current));
    }
    
    await Promise.all(promises);
  };

  const handleStartReading = async (text: string) => {
    const parsed = splitIntoSentences(text);
    setSentences(parsed);
    setCurrentIndex(0);
    audioCacheRef.current = {};
    setBufferedIndices(new Set());
    sessionRef.current += 1;
    
    // Initial Buffer Phase
    setPlaybackState('buffering');
    await bufferRange(0, INITIAL_BUFFER_COUNT, parsed);
    
    // Start playing
    setPlaybackState('playing');
    isPlayingRef.current = true;
    playSentence(0, parsed, sessionRef.current);
  };

  const handleReset = () => {
    stopAudio();
    setSentences([]);
    setCurrentIndex(0);
    setPlaybackState('idle');
    audioCacheRef.current = {};
    setBufferedIndices(new Set());
    sessionRef.current += 1;
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        // Disconnect to be safe
        audioSourceRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      audioSourceRef.current = null;
    }
    isPlayingRef.current = false;
  };

  const playSentence = useCallback(async (index: number, currentSentences: Sentence[], sessionId: number) => {
    // If session changed (e.g. user clicked Reset or changed Voice), abort
    if (sessionId !== sessionRef.current) return;

    if (index >= currentSentences.length || index < 0) {
      setPlaybackState('idle');
      isPlayingRef.current = false;
      setCurrentIndex(0);
      return;
    }

    const ctx = getAudioContext();
    const buffer = audioCacheRef.current[index];

    if (!buffer) {
      // Buffer miss - show loading and fetch immediately
      setPlaybackState('buffering');
      await fetchAudioForIndex(index, currentSentences, currentVoiceRef.current, currentModeRef.current);
      
      // If session changed during fetch, abort
      if (sessionId !== sessionRef.current) return;
      // If we are no longer playing (user paused during buffering), abort
      if (!isPlayingRef.current && playbackState !== 'buffering') return;
      
      // Recursive call after fetch
      playSentence(index, currentSentences, sessionId);
      return;
    }

    // Stop previous if exists
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e){}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    source.onended = () => {
      // Only proceed if we are still playing AND the session matches
      if (isPlayingRef.current && sessionId === sessionRef.current) {
        const nextIdx = index + 1;
        if (nextIdx < currentSentences.length) {
          setCurrentIndex(nextIdx);
          playSentence(nextIdx, currentSentences, sessionId);
        } else {
          setPlaybackState('idle');
          isPlayingRef.current = false;
          setCurrentIndex(0);
        }
      }
    };

    audioSourceRef.current = source;
    source.start();
    setPlaybackState('playing');
    
    // TRIGGER BACKGROUND PREFETCH
    // Ensure we are always LOOKAHEAD_COUNT steps ahead
    bufferRange(index + 1, LOOKAHEAD_COUNT, currentSentences);

  }, [playbackState]);

  const handlePlayPause = async () => {
    if (playbackState === 'playing') {
      stopAudio();
      setPlaybackState('paused');
    } else if (playbackState === 'buffering') {
        stopAudio();
        setPlaybackState('paused');
    } else {
      // Play
      sessionRef.current += 1; // Start a new playback session
      const newSessionId = sessionRef.current;
      isPlayingRef.current = true;
      
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      // Check if we need to buffer first
      if (!audioCacheRef.current[currentIndex]) {
          setPlaybackState('buffering');
          await bufferRange(currentIndex, Math.min(INITIAL_BUFFER_COUNT, sentences.length - currentIndex), sentences);
      }
      
      if (newSessionId === sessionRef.current) {
         playSentence(currentIndex, sentences, newSessionId);
      }
    }
  };

  const handleNext = () => {
    // 1. Stop current audio immediately
    stopAudio();
    
    // 2. Increment Session ID to invalidate any pending playSentence/fetches
    sessionRef.current += 1;
    const newSessionId = sessionRef.current;

    // 3. Calculate STRICT next index
    const next = Math.min(currentIndex + 1, sentences.length - 1);
    setCurrentIndex(next);

    // 4. Trigger buffering for the NEW target
    bufferRange(next, LOOKAHEAD_COUNT, sentences);
    
    // 5. If we were playing (or buffering), continue playing from new spot
    // If paused, just move the cursor
    if (playbackState === 'playing' || playbackState === 'buffering') {
      isPlayingRef.current = true;
      playSentence(next, sentences, newSessionId);
    } else {
       setPlaybackState('paused');
    }
  };

  const handlePrev = () => {
    stopAudio();
    sessionRef.current += 1;
    const newSessionId = sessionRef.current;

    const prev = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prev);
    
    if (playbackState === 'playing' || playbackState === 'buffering') {
      isPlayingRef.current = true;
      playSentence(prev, sentences, newSessionId);
    } else {
        setPlaybackState('paused');
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-300 flex flex-col font-serif">
      <Header />
      
      <main className="flex-1 flex flex-col items-center w-full relative">
        {!hasContent ? (
          <div className="flex-1 flex items-center justify-center w-full px-4">
            <TextInput onStartReading={handleStartReading} />
          </div>
        ) : (
          <>
            <ReaderView sentences={sentences} currentIndex={currentIndex} />
            <Controls 
              playbackState={playbackState}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrev={handlePrev}
              onReset={handleReset}
              currentVoice={currentVoice}
              onVoiceChange={setCurrentVoice}
              currentMode={currentMode}
              onModeChange={setCurrentMode}
              progress={sentences.length > 0 ? ((currentIndex) / sentences.length) * 100 : 0}
              bufferedIndices={bufferedIndices}
              totalSentences={sentences.length}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default App;
