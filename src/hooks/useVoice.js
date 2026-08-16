import { useRef, useCallback, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

/**
 * useVoice hook — plays text using ElevenLabs cloned voice via backend proxy.
 * Falls back to browser speech synthesis if backend is unavailable.
 * 
 * speak() returns a Promise that resolves when audio finishes playing,
 * so you can await it for sequential speech.
 * 
 * Usage:
 *   const { speak, stop, speaking } = useVoice();
 *   await speak('Spell the word');   // waits until done
 *   await speak('ELEPHANT');          // plays after first finishes
 */
const useVoice = () => {
  const audioRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const cacheRef = useRef({});
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  // Process the speech queue one at a time
  const processQueue = useCallback(async () => {
    if (playingRef.current) return;
    if (queueRef.current.length === 0) return;

    playingRef.current = true;
    const { text, resolve, fallbackToBrowser } = queueRef.current.shift();

    setSpeaking(true);

    try {
      const cacheKey = text.substring(0, 100);
      let audioUrl = cacheRef.current[cacheKey];

      if (!audioUrl) {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_URL}/api/tts/speak`,
          { text },
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
            timeout: 15000,
          }
        );
        audioUrl = URL.createObjectURL(response.data);
        cacheRef.current[cacheKey] = audioUrl;
      }

      // Play and wait for it to finish
      await new Promise((audioResolve, audioReject) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          audioRef.current = null;
          audioResolve();
        };
        audio.onerror = (err) => {
          audioRef.current = null;
          audioReject(err);
        };

        audio.play().catch(audioReject);
      });

      setSpeaking(false);
      playingRef.current = false;
      resolve();

      // Process next in queue
      processQueue();

    } catch (error) {
      console.warn('ElevenLabs TTS failed:', error.message || error);
      audioRef.current = null;
      setSpeaking(false);
      playingRef.current = false;

      // Fall back to browser speech and wait for it to finish
      if (fallbackToBrowser) {
        await browserSpeakAsync(text);
      }

      resolve();
      processQueue();
    }
  }, []);

  const speak = useCallback((text, { fallbackToBrowser = true } = {}) => {
    if (!text || text.trim().length === 0) return Promise.resolve();

    const cleanText = text.replace(/[🎉✅❌⏰💡🎯📝✓🔄🟢🟡🔴]/g, '').trim();
    if (!cleanText) return Promise.resolve();

    return new Promise((resolve) => {
      queueRef.current.push({ text: cleanText, resolve, fallbackToBrowser });
      processQueue();
    });
  }, [processQueue]);

  const stop = useCallback(() => {
    // Clear queue
    queueRef.current.forEach(item => item.resolve());
    queueRef.current = [];
    playingRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
};

// Browser fallback that returns a Promise (resolves when speech ends)
function browserSpeakAsync(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);

    // Safety timeout — resolve after 10s max in case onend never fires
    setTimeout(resolve, 10000);
  });
}

export default useVoice;
