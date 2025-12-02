# Gemini Text Reader ✦

An aesthetic text-to-speech reader powered by Google's Gemini 2.5 Flash Native Audio. 

Designed for deep reading, this application breaks text down sentence-by-sentence, generating context-aware audio that understands intonation and emotion better than traditional TTS engines.

## Features

- **Context-Aware Narration**: Uses previous and next sentences to inform the prosody of the current line.
- **Aesthetic Reader View**: Auto-scrolling text with focus highlighting and ambient gradients.
- **Voice Personas**: Switch between styles like "Storyteller", "Speed Reader", or "News Anchor".
- **Smart Extraction**: Paste any URL to automatically strip ads and clutter using Mozilla Readability.
- **Pure Black UI**: Optimized for OLED screens and late-night reading sessions.

## Tech Stack

- **AI**: Google Gemini 2.5 Flash (via `@google/genai`)
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Parsing**: Mozilla Readability + DOMParser
- **Audio**: Web Audio API (PCM decoding)

---

## 🚨 Vibe Coding Alert

This project was 99% vibe coded as a fun hack when I ran out of free hours on the Eleven Reader app and Google's default TTS engine felt too robotic.
This app can be improved by better prompting, and other features like playback speed, PDF input, etc.
