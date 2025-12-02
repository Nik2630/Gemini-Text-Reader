import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, ReaderMode } from "../types";

// NOTE: In a real production app, you might want to proxy this request
// to avoid exposing API keys or handle rate limits better.
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set REACT_APP_GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

const getModeInstructions = (mode: ReaderMode): string => {
  switch (mode) {
    case 'speed':
      return "You are a speed reader. Read quickly, efficiently, and with minimal pauses between words. Maintain clarity but prioritize speed.";
    case 'news':
      return "You are a news anchor. Read with a professional, clear, objective, and informative tone. Maintain a steady, even pace.";
    case 'monotone':
      return "You are a robotic assistant. Read with a flat, consistent, and monotone voice. Do not add emotional inflection.";
    case 'narrator':
    default:
      return "You are a professional storyteller. Using context, read with natural, consistent tone. 1.2x speed. ";
  }
};

export const generateSpeechForSentence = async (
  prev: string,
  current: string,
  next: string,
  voice: VoiceName,
  mode: ReaderMode = 'narrator'
): Promise<string> => {
  const client = getClient();
  const roleInstruction = getModeInstructions(mode);
  
  // Prompt engineering to ensure it reads ONLY the target sentence but uses context for intonation.
  const prompt = `
    ${roleInstruction}
    
    I will provide the target sentence along with the preceding and following sentences for context. 
    
    **Instructions:**
    1. Read ONLY the "Target Sentence".
    2. Do NOT read the "Previous Context" or "Next Context".
    
    Previous Context: "${prev}"
    
    Target Sentence: "${current}"
    
    Next Context: "${next}"
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.[0];
    
    if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
      return audioPart.inlineData.data;
    }
    
    throw new Error("No audio data returned from Gemini.");
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
