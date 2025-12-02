import { useState, useEffect, useCallback } from 'react';
import { generateAudio, downloadBlob } from '../services/ttsService';

export const useTTS = (text?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Revoke URL when text changes or component unmounts
  useEffect(() => {
    setAudioUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [text]);

  useEffect(() => {
    return () => {
      setAudioUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const loadAudio = useCallback(async () => {
    if (!text) return;
    setIsLoading(true);
    try {
      const blob = await generateAudio(text);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (e) {
      console.error("TTS Load Error", e);
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  const download = useCallback(async () => {
    if (!text) return;
    setIsLoading(true);
    try {
      const blob = await generateAudio(text);
      downloadBlob(blob, `nambu_audio_${Date.now()}.mp3`);
    } catch (e) {
      console.error("TTS Download Error", e);
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  return { isLoading, audioUrl, loadAudio, download };
};