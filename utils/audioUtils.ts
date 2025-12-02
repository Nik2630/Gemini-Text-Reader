// Decodes Base64 string to Uint8Array
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM data into an AudioBuffer
// Assumes 24kHz sample rate and 1 channel (mono) as per Gemini TTS defaults usually
export async function decodeAudioData(
  base64String: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const pcmData = decodeBase64(base64String);
  
  // Convert Uint8Array (representing Int16 PCM) to Float32
  const dataInt16 = new Int16Array(pcmData.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0); // Mono
  
  for (let i = 0; i < frameCount; i++) {
    // Normalize Int16 to Float32 (-1.0 to 1.0)
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}

// Singleton pattern for AudioContext to prevent creating too many contexts
let audioContextInstance: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContextInstance) {
    audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, 
    });
  }
  // Resume context if it's suspended (browsers often suspend until user interaction)
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume();
  }
  return audioContextInstance;
};
