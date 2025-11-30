
/**
 * TTS Service Integration
 * API Endpoint: https://tts.cjack.top/api/text-to-speech
 * Voice: Microsoft Server Speech Text to Speech Voice (ja-JP, NanamiNeural)
 * Auth: Bearer tetr5354
 */

const API_ENDPOINT = "https://tts.cjack.top/api/text-to-speech";
const AUTH_TOKEN = "tetr5354";
const VOICE_NAME = "Microsoft Server Speech Text to Speech Voice (ja-JP, NanamiNeural)";

// Simple in-memory cache: Text -> Blob
const audioCache = new Map<string, Blob>();

export const generateAudio = async (text: string): Promise<Blob> => {
  if (!text) {
    throw new Error("No text provided for TTS");
  }

  // 1. Check Cache
  if (audioCache.has(text)) {
    console.log("TTS Cache Hit");
    return audioCache.get(text)!;
  }

  // Use URLSearchParams to handle encoding of special characters (spaces, parens, Japanese) automatically
  // Note: 'rate' must be "0" as the API returns 500 for percentage strings like "+10%"
  const params = new URLSearchParams({
    voice: VOICE_NAME,
    text: text,
    volume: "0",
    rate: "0", 
    pitch: "0"
  });

  const url = `${API_ENDPOINT}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`TTS API Error (${response.status}): ${errText}`);
    }

    const blob = await response.blob();
    
    // 2. Save to Cache
    audioCache.set(text, blob);
    
    return blob;
  } catch (error) {
    console.error("TTS Generation Failed:", error);
    throw error;
  }
};

/**
 * Helper to trigger a browser download for a Blob
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
};
