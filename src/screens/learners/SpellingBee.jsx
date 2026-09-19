// frontend/src/screens/learners/SpellingBee.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import API_URL from '../../config';
import VoiceCloneService from '../../services/voiceCloneService';
import useVoice from '../../hooks/useVoice';
import { useTheme, getContrastTextColor } from '../../contexts/ThemeContext';
import {
  ArrowLeft, Volume2, VolumeX,
  Trophy, Zap, Clock, Check,
  SkipForward, RefreshCw, Brain, Headphones,
  Repeat, Play, Pause, Volume1,
  ArrowRight, Trash2, Info, BookOpen,
  Keyboard, AlertCircle, XCircle, Timer, Mic, MicOff
} from 'lucide-react';

const SpellingBee = () => {
  const navigate = useNavigate();
  const { speak: speakElevenLabs } = useVoice();
  const { settings } = useTheme();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  
  // Audio refs
  const audioContext = useRef(null);
  const audioRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Voice Settings (Admin Controlled)
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: false,
    useClonedVoice: false,
    voiceSpeed: 0.9,
    voicePitch: 1.0,
    voiceType: 'system'
  });
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);
  const [isLoadingVoiceSettings, setIsLoadingVoiceSettings] = useState(false);
  
  // Game State
  const [currentWord, setCurrentWord] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordList, setWordList] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalWords, setTotalWords] = useState(0);
  const [letterBoxes, setLetterBoxes] = useState([]);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [wordTimer, setWordTimer] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [wordSpoken, setWordSpoken] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hasAutoSpoken, setHasAutoSpoken] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Level Timer - 5 minutes per level
  const [levelTimeLeft, setLevelTimeLeft] = useState(300);
  const [levelTimer, setLevelTimer] = useState(null);
  const [levelTimeUp, setLevelTimeUp] = useState(false);
  const [levelStartTime, setLevelStartTime] = useState(null);
  
  // Dialog State
  const [showDialog, setShowDialog] = useState(true);
  const [dialogMessage, setDialogMessage] = useState('');

  const themeAccentColor = settings?.accentColor || '#0d9488';
  const modalBackground = settings?.cardBg || settings?.containerBg || settings?.bgColor || (isDarkMode ? '#0f172a' : '#ffffff');
  const modalTextColor = getContrastTextColor(modalBackground, '#e2e8f0', '#19475B');
  const modalHeadingColor = getContrastTextColor(modalBackground, '#f8fafc', '#19475B');
  const modalAccentTextColor = getContrastTextColor(themeAccentColor, '#e2e8f0', '#19475B');
  const modalBorderColor = settings?.containerBorder || themeAccentColor;

  // Level States
  const [currentLevel, setCurrentLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState({});
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [levelScore, setLevelScore] = useState(0);
  const [levelWordsCompleted, setLevelWordsCompleted] = useState(0);
  const [timerSettings, setTimerSettings] = useState(null);
  const [isLoadingTimer, setIsLoadingTimer] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [bonusEarned, setBonusEarned] = useState(0);

  const inputRef = useRef(null);
  const POINTS_PER_WORD = 2;
  const BONUS_INTERVAL = 5;
  const BONUS_POINTS = 2;
  const WORD_TIME_LIMIT = 30;
  const autoSpeakDelay = 800;
  const LEVEL_DURATION = 300;
  const WORDS_PER_LEVEL = 10;

  // Keyboard letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Level info
  const LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);
  const levelLabels = {
    1: 'Beginner', 2: 'Sprout', 3: 'Learner', 4: 'Student', 5: 'Scholar',
    6: 'Reader', 7: 'Graduate', 8: 'Star', 9: 'Master', 10: 'Legend'
  };
  const levelColors = {
    1: 'text-teal-600', 2: 'text-teal-700', 3: 'text-cyan-600', 
    4: 'text-cyan-700', 5: 'text-sky-600', 6: 'text-sky-700',
    7: 'text-indigo-600', 8: 'text-indigo-700', 9: 'text-emerald-600', 
    10: 'text-emerald-700'
  };

  // Theme toggle effect
  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Helper to ensure voices are loaded
  const _getVoicesAsync = () => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve([]);
      let voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) return resolve(voices);
      const onVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(voices);
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      // Fallback: resolve after short timeout
      setTimeout(() => {
        voices = window.speechSynthesis.getVoices() || [];
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(voices);
      }, 500);
    });
  };

  // Speak using ElevenLabs cloned voice, falls back to system TTS
  const speakWithVoiceCharacteristics = async (message) => {
    // Use ElevenLabs cloned voice (useVoice hook handles fallback automatically)
    try {
      setIsSpeaking(true);
      await speakElevenLabs(message);
    } catch (err) {
      console.warn('ElevenLabs voice failed, falling back to system TTS:', err);
      // Fallback to browser speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  // Auto-speak the word
  const autoSpeakWord = async (word) => {
    if (!word) return;
    if (!voiceSettings.enabled) return;
    if (isCorrect !== null) return;
    if (gameWon) return;
    if (levelTimeUp) return;
    
    setIsDictating(true);
    setWordSpoken(false);
    
    try {
      await speakWithVoiceCharacteristics(`Spell the word`);
      await speakWithVoiceCharacteristics(word);
      await speakWithVoiceCharacteristics(word);
      await speakWithVoiceCharacteristics(`Now type the word`);
      
      setWordSpoken(true);
      setHasAutoSpoken(true);
      
    } catch (error) {
      console.error('Error during auto-speak:', error);
      try {
        await speakWithVoiceCharacteristics(`Spell the word ${word}`);
        setWordSpoken(true);
        setHasAutoSpoken(true);
      } catch (fallbackError) {
        console.error('Fallback auto-speak failed:', fallbackError);
      }
    } finally {
      setIsDictating(false);
    }
  };

  // Speak the word manually
  const replayWord = async () => {
    if (!currentWord) {
      console.warn('No current word to speak');
      return;
    }
    
    if (!voiceSettings.enabled) {
      toast.error('Voice is currently disabled by the administrator.');
      return;
    }
    
    if (levelTimeUp) {
      toast.error('Time is up for this level!');
      return;
    }
    
    setIsPlaying(true);
    
    try {
      await speakWithVoiceCharacteristics(`Spell the word`);
      await speakWithVoiceCharacteristics(currentWord.word);
      await speakWithVoiceCharacteristics(currentWord.word);
      await speakWithVoiceCharacteristics(`Now type the word`);
      
      setWordSpoken(true);
      
    } catch (error) {
      console.error('Error replaying word:', error);
      toast.error('Failed to speak the word. Please try again.');
    } finally {
      setIsPlaying(false);
    }
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Format time for display (mm:ss)
  const formatTimeDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigate to dashboard with cleanup
  const goToDashboard = () => {
    if (wordTimer) {
      clearInterval(wordTimer);
      setWordTimer(null);
    }
    if (levelTimer) {
      clearInterval(levelTimer);
      setLevelTimer(null);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    }
    navigate('/learner-dashboard');
  };

  // Check voice status on load
  useEffect(() => {
    fetchTimerSettings();
    fetchUserProgress();
    fetchVoiceSettings();
    
    try {
      const savedSettings = localStorage.getItem('voiceSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.voiceAnalysis) {
          setVoiceAnalysis(parsedSettings.voiceAnalysis);
        }
      }
    } catch (e) {
      console.warn('Could not load voice analysis from localStorage:', e);
    }
  }, []);

  // Fetch words from API
  useEffect(() => {
    if (currentLevel) {
      fetchWordsByLevel(currentLevel);
    }
  }, [currentLevel]);

  // Auto-speak when current word changes
  useEffect(() => {
    if (currentWord && gameStarted && !gameWon && isCorrect === null && voiceSettings.enabled && !levelTimeUp && !isSpeaking) {
      setHasAutoSpoken(false);
      setWordSpoken(false);
      
      const timer = setTimeout(() => {
        autoSpeakWord(currentWord.word);
      }, autoSpeakDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentWord, gameStarted, gameWon, isCorrect, levelTimeUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wordTimer) {
        clearInterval(wordTimer);
      }
      if (levelTimer) {
        clearInterval(levelTimer);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, [wordTimer, levelTimer]);

  // Fetch voice settings from admin
  const fetchVoiceSettings = async () => {
    try {
      setIsLoadingVoiceSettings(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setVoiceSettings({
          enabled: false,
          useClonedVoice: false,
          voiceSpeed: 0.7,
          voicePitch: 1.0,
          voiceType: 'system'
        });
        setVoiceAnalysis(null);
        setIsLoadingVoiceSettings(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/spelling/voice-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.settings) {
        const settings = response.data.settings;
        setVoiceSettings({
          enabled: settings.enabled || false,
          useClonedVoice: settings.useClonedVoice || false,
          voiceSpeed: settings.voiceSpeed || 0.7,
          voicePitch: settings.voicePitch || 1.0,
          voiceType: settings.useClonedVoice ? 'cloned' : 'system'
        });
        
        if (settings.voiceAnalysis) {
          setVoiceAnalysis(settings.voiceAnalysis);
        } else {
          try {
            const savedAnalysis = localStorage.getItem('voiceAnalysis');
            if (savedAnalysis) {
              const parsedAnalysis = JSON.parse(savedAnalysis);
              setVoiceAnalysis(parsedAnalysis);
            }
          } catch (e) {
            console.warn('Could not load voice analysis from localStorage:', e);
          }
        }
      } else {
        setVoiceSettings({
          enabled: false,
          useClonedVoice: false,
          voiceSpeed: 0.7,
          voicePitch: 1.0,
          voiceType: 'system'
        });
        setVoiceAnalysis(null);
      }
    } catch (error) {
      console.error('Error fetching voice settings:', error);
      setVoiceSettings({
        enabled: false,
        useClonedVoice: false,
        voiceSpeed: 0.7,
        voicePitch: 1.0,
        voiceType: 'system'
      });
      
      try {
        const savedAnalysis = localStorage.getItem('voiceAnalysis');
        if (savedAnalysis) {
          const parsedAnalysis = JSON.parse(savedAnalysis);
          setVoiceAnalysis(parsedAnalysis);
        }
      } catch (e) {
        console.warn('Could not load voice analysis from localStorage:', e);
      }
    } finally {
      setIsLoadingVoiceSettings(false);
    }
  };

  // Fetch timer settings
  const fetchTimerSettings = async () => {
    try {
      setIsLoadingTimer(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setTimerSettings({
          defaultTimeLimit: 30,
          timeLimitPerDifficulty: {
            easy: 30,
            medium: 30,
            hard: 30,
            expert: 30
          }
        });
        setIsLoadingTimer(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/spelling/timer-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.settings) {
        setTimerSettings(response.data.settings);
      } else {
        setTimerSettings({
          defaultTimeLimit: 30,
          timeLimitPerDifficulty: {
            easy: 30,
            medium: 30,
            hard: 30,
            expert: 30
          }
        });
      }
    } catch (error) {
      console.error('Error fetching timer settings:', error);
      setTimerSettings({
        defaultTimeLimit: 30,
        timeLimitPerDifficulty: {
          easy: 30,
          medium: 30,
          hard: 30,
          expert: 30
        }
      });
    } finally {
      setIsLoadingTimer(false);
    }
  };

  // Fetch user progress
  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setCurrentLevel(1);
        setMaxUnlockedLevel(1);
        setLevelProgress({});
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/spelling/user-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCurrentLevel(response.data.currentLevel || 1);
        setMaxUnlockedLevel(response.data.maxUnlockedLevel || 1);
        setLevelProgress(response.data.levelProgress || {});
      } else {
        setCurrentLevel(1);
        setMaxUnlockedLevel(1);
        setLevelProgress({});
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setCurrentLevel(1);
      setMaxUnlockedLevel(1);
      setLevelProgress({});
    }
  };

  // Fetch words by level
  const fetchWordsByLevel = async (level) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login again.');
        navigate('/learner-login');
        setLoading(false);
        return;
      }
      
      const url = `${API_URL}/api/spelling/words/level/${level}`;
      
      const response = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const words = response.data.words || [];
        
        setWordList(words);
        setTotalWords(words.length);
        setLevelWordsCompleted(0);
        setLevelScore(0);
        setConsecutiveCorrect(0);
        setBonusEarned(0);
        
        if (words.length > 0) {
          setShowDialog(true);
          setDialogMessage(`Ready to start Level ${level}? You have 5 minutes to spell ${Math.min(words.length, WORDS_PER_LEVEL)} words. Each word has 30 seconds to answer.`);
          setLoading(false);
        } else {
          toast.info(`No words available for Level ${level}. Please ask an admin to add words.`);
          setLoading(false);
        }
      } else {
        toast.error(response.data.message || `Failed to load words for Level ${level}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching words by level:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/learner-login');
      } else if (error.response?.status === 404) {
        toast.error('Spelling Bee words endpoint not found.');
        setWordList([]);
        setTotalWords(0);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load spelling words');
      }
      
      setLoading(false);
      setWordList([]);
      setTotalWords(0);
    }
  };

  // Get time limit for word - always 30 seconds
  const getTimeLimitForWord = (word) => {
    return WORD_TIME_LIMIT;
  };

  // Check if user can access a level
  const canAccessLevel = (level) => {
    return level <= maxUnlockedLevel;
  };

  // Start level timer
  const startLevelTimer = () => {
    if (levelTimer) {
      clearInterval(levelTimer);
    }
    
    setLevelTimeLeft(LEVEL_DURATION);
    setLevelTimeUp(false);
    setLevelStartTime(Date.now());
    
    const timer = setInterval(() => {
      setLevelTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setLevelTimeUp(true);
          handleLevelTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setLevelTimer(timer);
  };

  // Handle level time up
  const handleLevelTimeUp = () => {
    if (gameWon) return;
    
    setIsTimerRunning(false);
    if (wordTimer) {
      clearInterval(wordTimer);
    }
    
    toast.error(`⏰ Time's up! Level ${currentLevel} time has expired.`);
    
    if (currentWord && isCorrect === null) {
      setIsCorrect(false);
      setShowAnswer(true);
      setShowNextButton(true);
    }
  };

  // Start game with words
  const startGame = (words) => {
    if (!words || words.length === 0) {
      toast.error('No words available');
      setLoading(false);
      return;
    }
    
    setGameStarted(true);
    setWordList(words);
    setTotalWords(words.length);
    setWordIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeElapsed(0);
    setTimerActive(true);
    setGameWon(false);
    setAttempts(0);
    setCorrectAttempts(0);
    setShowAnswer(false);
    setIsCorrect(null);
    setLetterBoxes([]);
    setActiveBoxIndex(0);
    setWordSpoken(false);
    setShowNextButton(false);
    setShowLevelUp(false);
    setLoading(false);
    setInputValue('');
    setHasAutoSpoken(false);
    setShowDialog(false);
    setLevelTimeUp(false);
    setLevelTimeLeft(LEVEL_DURATION);
    setConsecutiveCorrect(0);
    setBonusEarned(0);
    
    startLevelTimer();
    
    const firstWord = words[0];
    if (!firstWord) {
      toast.error('No words available');
      setLoading(false);
      return;
    }
    
    setCurrentWord(firstWord);
    setLetterBoxes(Array(firstWord.word.length).fill(''));
    
    const timeLimit = getTimeLimitForWord(firstWord);
    setTimeLeft(timeLimit);
    setIsTimerRunning(false);
    
    startWordTimer();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    setTimeout(() => {
      if (voiceSettings.enabled) {
        autoSpeakWord(firstWord.word);
      }
    }, 500);
  };

  // Initialize Audio Context
  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext.current;
  };

  // Play sound effect
  const playSound = (type) => {
    if (!soundEnabled) return;
    
    try {
      const ctx = initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      gainNode.gain.value = 0.15;
      
      switch(type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
          
        case 'wrong':
          oscillator.frequency.setValueAtTime(330, ctx.currentTime);
          oscillator.frequency.setValueAtTime(277, ctx.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
          
        case 'win':
          const winNotes = [523, 587, 659, 784, 880, 988, 1047];
          winNotes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.12;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.12);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.12);
          });
          break;
          
        case 'bonus':
          const bonusNotes = [523, 659, 784, 1047];
          bonusNotes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.1;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.15);
          });
          break;
          
        case 'click':
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.05);
          break;
          
        case 'tick':
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.03);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.log('Audio not available');
    }
  };

  // Start word timer (30 seconds)
  const startWordTimer = () => {
    if (wordTimer) {
      clearInterval(wordTimer);
    }
    
    const timeLimit = getTimeLimitForWord(currentWord);
    setTimeLeft(timeLimit);
    setIsTimerRunning(true);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerRunning(false);
          if (currentWord && isCorrect === null && !levelTimeUp) {
            handleTimeUp();
          }
          return 0;
        }
        if (prev <= 10) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);
    
    setWordTimer(timer);
  };

  // Handle time up
  const handleTimeUp = () => {
    if (!currentWord || isCorrect !== null || gameWon || levelTimeUp) return;
    
    setIsCorrect(false);
    setStreak(0);
    setAttempts(prev => prev + 1);
    setConsecutiveCorrect(0);
    
    playSound('wrong');
    toast.error(`⏰ Time's up! The correct spelling is: ${currentWord.word}`);
    
    trackAttempt(currentWord.id, false);
    setShowAnswer(true);
    setShowNextButton(true);

    // Speak feedback — wait for user to click Next or Retry
    speakElevenLabs(`Time is up. The correct spelling is ${currentWord.word}`);
  };

  // Handle keyboard input
  const handleKeyPress = (letter) => {
    if (isCorrect !== null) return;
    if (gameWon) return;
    if (!isTimerRunning) return;
    if (!currentWord) return;
    if (showNextButton) return;
    if (levelTimeUp) return;
    
    if (!wordSpoken) {
      toast('Listening to the word first helps! Click the speaker if you need to hear it again.', {
        duration: 3000,
        icon: '🔊',
      });
    }
    
    playSound('click');
    
    const emptyIndex = letterBoxes.findIndex(box => box === '');
    const indexToFill = emptyIndex !== -1 ? emptyIndex : letterBoxes.length;
    
    if (indexToFill < letterBoxes.length) {
      const newBoxes = [...letterBoxes];
      newBoxes[indexToFill] = letter;
      setLetterBoxes(newBoxes);
      
      if (newBoxes.every(box => box !== '')) {
        const fullWord = newBoxes.join('');
        setTimeout(() => {
          checkAnswer(fullWord);
        }, 300);
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (isCorrect !== null || gameWon || !currentWord || showNextButton) return;
    if (levelTimeUp) return;
    
    playSound('click');
    
    for (let i = letterBoxes.length - 1; i >= 0; i--) {
      if (letterBoxes[i] !== '') {
        const newBoxes = [...letterBoxes];
        newBoxes[i] = '';
        setLetterBoxes(newBoxes);
        break;
      }
    }
  };

  // Check answer
  const checkAnswer = (fullWord) => {
    if (isCorrect !== null || gameWon || !currentWord || levelTimeUp) return;
    
    setIsTimerRunning(false);
    if (wordTimer) {
      clearInterval(wordTimer);
    }
    
    if (fullWord.toLowerCase() === currentWord.word.toLowerCase()) {
      handleCorrect();
    } else {
      handleIncorrect();
    }
  };

  // Handle correct answer
  const handleCorrect = () => {
    if (isCorrect === true || !currentWord) return;
    
    setIsCorrect(true);
    setCorrectAttempts(prev => prev + 1);
    setStreak(prev => prev + 1);
    if (streak + 1 > maxStreak) setMaxStreak(streak + 1);
    setLevelWordsCompleted(prev => prev + 1);
    setAttempts(prev => prev + 1);
    
    const newConsecutiveCorrect = consecutiveCorrect + 1;
    setConsecutiveCorrect(newConsecutiveCorrect);
    
    let pointsEarned = POINTS_PER_WORD;
    
    if (newConsecutiveCorrect % BONUS_INTERVAL === 0) {
      const bonusCount = Math.floor(newConsecutiveCorrect / BONUS_INTERVAL);
      const bonusTotal = bonusCount * BONUS_POINTS;
      pointsEarned += bonusTotal;
      setBonusEarned(prev => prev + bonusTotal);
      playSound('bonus');
    }
    
    const timeBonus = Math.min(Math.floor(timeLeft / 5), 2);
    pointsEarned += timeBonus;
    
    setScore(prev => prev + pointsEarned);
    setLevelScore(prev => prev + pointsEarned);
    
    playSound('correct');
    
    let toastMessage = `✅ Correct! +${pointsEarned} points`;
    toastMessage += ` (${POINTS_PER_WORD} base`;
    if (timeBonus > 0) {
      toastMessage += ` + ${timeBonus} time bonus`;
    }
    if (newConsecutiveCorrect % BONUS_INTERVAL === 0 && newConsecutiveCorrect > 0) {
      toastMessage += ` + ${Math.floor(newConsecutiveCorrect / BONUS_INTERVAL) * BONUS_POINTS} bonus`;
    }
    toastMessage += `)`;
    
    toast.success(toastMessage);
    
    trackAttempt(currentWord.id, true);
    setShowNextButton(true);

    // Speak feedback then wait for user to click Next
    speakElevenLabs('Correct! Well done!');
  };

  // Handle incorrect answer
  const handleIncorrect = () => {
    if (isCorrect === true || !currentWord) return;
    
    setIsCorrect(false);
    setStreak(0);
    setAttempts(prev => prev + 1);
    setConsecutiveCorrect(0);
    
    playSound('wrong');
    toast.error(`❌ Incorrect! The correct spelling is: ${currentWord.word}`);
    
    trackAttempt(currentWord.id, false);
    setShowAnswer(true);
    setShowNextButton(true);

    // Speak feedback — user can retry or click Next
    speakElevenLabs(`Incorrect. The correct spelling is ${currentWord.word}`);
  };

  // Track attempt
  const trackAttempt = async (wordId, correct) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/spelling/track-attempt`, {
        wordId,
        correct,
        timeSpent: timeElapsed,
        level: currentLevel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error tracking attempt:', error);
    }
  };

  // Handle level complete
  const handleLevelComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (levelTimer) {
        clearInterval(levelTimer);
        setLevelTimer(null);
      }
      
      const response = await axios.post(`${API_URL}/api/spelling/level-complete`, {
        level: currentLevel,
        score: levelScore,
        correctAttempts: correctAttempts,
        totalAttempts: attempts,
        bonusEarned: bonusEarned,
        consecutiveCorrect: consecutiveCorrect
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setShowLevelUp(true);
        setLevelUpAnimation(true);
        
        if (response.data.newMaxLevel) {
          setMaxUnlockedLevel(response.data.newMaxLevel);
        }
        
        playSound('win');
        
        toast.success(`Level ${currentLevel} Complete! ${response.data.message || ''}`);
        
        setTimeout(() => {
          setShowLevelUp(false);
          setLevelUpAnimation(false);
          if (currentLevel < 10) {
            if (window.confirm(`Great job! Ready for Level ${currentLevel + 1}?`)) {
              setCurrentLevel(currentLevel + 1);
              setGameStarted(false);
              setShowDialog(true);
              setDialogMessage(`Ready to start Level ${currentLevel + 1}? You have 5 minutes to spell 10 words. Each word has 30 seconds to answer.`);
            } else {
              goToDashboard();
            }
          } else {
            toast.success('You completed all levels! You are a Spelling Master!');
            goToDashboard();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error completing level:', error);
      toast.error('Failed to save level progress');
    }
  };

  // Retry current word (reattempt)
  const handleRetry = () => {
    if (!currentWord) return;
    
    setIsCorrect(null);
    setShowAnswer(false);
    setShowNextButton(false);
    setLetterBoxes(Array(currentWord.word.length).fill(''));
    setActiveBoxIndex(0);
    setInputValue('');
    setWordSpoken(false);
    setHasAutoSpoken(false);
    
    // Restart word timer
    const timeLimit = getTimeLimitForWord(currentWord);
    setTimeLeft(timeLimit);
    startWordTimer();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Re-speak the word
    setTimeout(() => {
      if (voiceSettings.enabled) {
        autoSpeakWord(currentWord.word);
      }
    }, 300);
  };

  // Next word
  const handleNextWord = () => {
    const nextIndex = wordIndex + 1;
    
    if (levelTimeUp) {
      toast.error('⏰ Time is up for this level!');
      return;
    }
    
    if (nextIndex >= wordList.length || nextIndex >= WORDS_PER_LEVEL) {
      setGameWon(true);
      setTimerActive(false);
      setIsTimerRunning(false);
      if (wordTimer) {
        clearInterval(wordTimer);
      }
      if (levelTimer) {
        clearInterval(levelTimer);
        setLevelTimer(null);
      }
      playSound('win');
      handleLevelComplete();
      return;
    }
    
    const nextWordData = wordList[nextIndex];
    if (!nextWordData) {
      setGameWon(true);
      return;
    }
    
    setWordIndex(nextIndex);
    setCurrentWord(nextWordData);
    setLetterBoxes(Array(nextWordData.word.length).fill(''));
    setActiveBoxIndex(0);
    setIsCorrect(null);
    setShowAnswer(false);
    setWordSpoken(false);
    setShowNextButton(false);
    setInputValue('');
    setHasAutoSpoken(false);
    
    const timeLimit = getTimeLimitForWord(nextWordData);
    setTimeLeft(timeLimit);
    
    startWordTimer();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    setTimeout(() => {
      if (voiceSettings.enabled && !levelTimeUp) {
        autoSpeakWord(nextWordData.word);
      }
    }, 500);
  };

  // Skip word
  const skipWord = () => {
    if (gameWon || isCorrect !== null || !currentWord || showNextButton) return;
    if (levelTimeUp) return;
    
    setStreak(0);
    setIsTimerRunning(false);
    if (wordTimer) {
      clearInterval(wordTimer);
    }
    setConsecutiveCorrect(0);
    playSound('click');
    toast('Skipped: ' + currentWord.word, {
      duration: 3000,
    });
    setShowNextButton(true);
    
    setTimeout(() => {
      if (!levelTimeUp && !gameWon) {
        handleNextWord();
      }
    }, 1500);
  };

  // Reset game
  const resetGame = () => {
    if (wordTimer) {
      clearInterval(wordTimer);
    }
    if (levelTimer) {
      clearInterval(levelTimer);
      setLevelTimer(null);
    }
    setGameStarted(false);
    setWordIndex(0);
    setCurrentWord(null);
    setIsCorrect(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeElapsed(0);
    setTimerActive(false);
    setGameWon(false);
    setAttempts(0);
    setCorrectAttempts(0);
    setShowAnswer(false);
    setLetterBoxes([]);
    setActiveBoxIndex(0);
    setWordSpoken(false);
    setShowNextButton(false);
    setShowLevelUp(false);
    setInputValue('');
    setHasAutoSpoken(false);
    setLevelTimeUp(false);
    setLevelTimeLeft(LEVEL_DURATION);
    setConsecutiveCorrect(0);
    setBonusEarned(0);
    playSound('click');
    
    fetchWordsByLevel(currentLevel);
  };

  const getLetterColor = (index) => {
    if (!letterBoxes[index]) return 'bg-teal-50 dark:bg-slate-800 border-teal-200 dark:border-teal-700';
    if (isCorrect === true) return 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 dark:border-teal-400 text-teal-800 dark:text-teal-200';
    if (isCorrect === false) {
      if (letterBoxes[index] && currentWord && letterBoxes[index].toLowerCase() === currentWord.word[index]?.toLowerCase()) {
        return 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 dark:border-teal-400 text-teal-800 dark:text-teal-200';
      }
      return 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-400 text-rose-700 dark:text-rose-300';
    }
    return 'bg-white dark:bg-slate-800 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200';
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color
  const getTimerColor = () => {
    if (timeLeft > 20) return 'text-teal-600 dark:text-teal-400';
    if (timeLeft > 10) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400 animate-pulse';
  };

  // Get level timer color
  const getLevelTimerColor = () => {
    if (levelTimeLeft > 120) return 'text-teal-600 dark:text-teal-400';
    if (levelTimeLeft > 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400 animate-pulse';
  };

  if (loading || isLoadingTimer || isLoadingVoiceSettings) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-teal-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-400 rounded-full blur-2xl opacity-30"></div>
            <Brain className="text-teal-600 dark:text-teal-400 animate-bounce relative z-10" size={48} />
          </div>
          <p className="text-sm text-teal-700 dark:text-teal-300 font-semibold tracking-wide">
            {isLoadingTimer ? 'Loading timer settings...' : 
             isLoadingVoiceSettings ? 'Loading voice settings...' : 
             'Loading spelling words...'}
          </p>
        </div>
      </div>
    );
  }

  // Letter box size: shrink for long words on mobile
  const getBoxSize = () => {
    if (!currentWord) return 'w-10 h-12 text-lg';
    const len = currentWord.word.length;
    if (len <= 5)  return 'w-11 h-14 text-xl';
    if (len <= 7)  return 'w-9 h-11 text-base';
    if (len <= 10) return 'w-7 h-9 text-sm';
    return 'w-6 h-8 text-xs';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-teal-50'
    }`}>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: '13px', maxWidth: '480px' } }} />

      {/* ── HEADER ── sticky to viewport, content pinned to same 512 px column as the game ── */}
      <header className={`sticky top-0 z-50 w-full shadow-lg border-b ${
        isDarkMode ? 'bg-teal-900 border-teal-800' : 'bg-teal-700 border-teal-600'
      }`}>
        {/* ↓ same max-w as main content so header aligns perfectly */}
        <div className="w-full max-w-lg mx-auto px-4">

          {/* Top row */}
          <div className="flex items-center justify-between h-12">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain rounded"
                loading="eager"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/32x32?text=LE'; }}
              />
              <div className="leading-tight">
                <p className="text-sm font-bold text-teal-50 tracking-tight">LearnEarn</p>
                <p className="text-[9px] text-teal-100 uppercase tracking-widest font-semibold">Spelling Bee 🐝</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg transition-all ${
                  soundEnabled ? 'bg-white/20 text-teal-50' : 'bg-teal-800/40 text-teal-100'
                }`}
                aria-label={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 text-teal-50"
                aria-label="Toggle theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={goToDashboard}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-teal-50 text-teal-700 hover:bg-white transition shadow-sm"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 border-t border-white/15 py-1">
            {[
              { label: 'Score',  value: score },
              { label: 'Streak', value: `${streak}🔥` },
              { label: 'Level',  value: `${currentLevel}/10` },
              { label: 'Time',   value: formatTimeDisplay(levelTimeLeft), colored: true },
            ].map(({ label, value, colored }) => (
              <div key={label} className="text-center py-0.5">
                <p className="text-[9px] font-semibold text-teal-100 uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold ${colored ? getLevelTimerColor() : 'text-teal-50'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN — centred narrow column, same width as header inner content ── */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 pb-24">

        {/* ── LOBBY ── */}
        {!gameStarted && (
          <div className="flex flex-col items-center gap-4">

            {/* Hero icon */}
            <div className={`mt-2 p-5 rounded-3xl shadow-lg ${
              isDarkMode ? 'bg-teal-900/60' : 'bg-white'
            }`}>
              <BookOpen className="w-14 h-14 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-center">
              <h2 className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-teal-800'}`}>
                Spelling Bee 🐝
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
                Listen · Spell · Win
              </p>
            </div>

            {/* Level card */}
            <div className={`w-full rounded-2xl border-2 p-5 ${
              isDarkMode ? 'bg-slate-800 border-teal-700' : 'bg-white border-teal-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                    Current Level
                  </p>
                  <p className={`text-2xl font-extrabold ${levelColors[currentLevel]}`}>
                    {levelLabels[currentLevel]}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold ${
                  isDarkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-50 text-teal-700'
                }`}>
                  <span className="text-xl leading-none">{currentLevel}</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-60">/ 10</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-teal-100 dark:bg-teal-900/40 rounded-full h-2 mt-1">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(maxUnlockedLevel / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-[10px] ${isDarkMode ? 'text-teal-500' : 'text-teal-400'}`}>Lvl 1</span>
                <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{maxUnlockedLevel} unlocked</span>
                <span className={`text-[10px] ${isDarkMode ? 'text-teal-500' : 'text-teal-400'}`}>Lvl 10</span>
              </div>

              {/* Pip indicators */}
              <div className="flex items-center gap-1 mt-3 justify-center flex-wrap">
                {LEVELS.map(level => (
                  <div
                    key={level}
                    className={`h-2 rounded-full transition-all ${
                      level === currentLevel ? 'w-6 ring-2 ring-teal-400' : 'w-4'
                    } ${
                      level <= maxUnlockedLevel ? 'bg-teal-600' :
                      level === maxUnlockedLevel + 1 ? 'bg-teal-300 animate-pulse' :
                      isDarkMode ? 'bg-slate-700' : 'bg-teal-100'
                    }`}
                    title={`Level ${level}`}
                  />
                ))}
              </div>
            </div>

            {/* Meta info */}
            <div className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
              isDarkMode ? 'bg-slate-800 text-teal-300' : 'bg-white text-teal-600 shadow-sm'
            }`}>
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} />
                {totalWords} words
              </span>
              {voiceSettings.enabled ? (
                <span className="flex items-center gap-1.5 text-teal-500">
                  <Volume2 size={14} />
                  Voice on
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-500">
                  <VolumeX size={14} />
                  Voice off
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── GAME WON ── */}
        {gameStarted && gameWon && (
          <div className={`rounded-2xl border-2 p-6 w-full text-center animate-fadeIn ${
            isDarkMode ? 'bg-slate-800 border-teal-700' : 'bg-white border-teal-200 shadow-lg'
          }`}>
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-extrabold text-teal-700 dark:text-teal-300">
              Level {currentLevel} Complete!
            </h2>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
              {Math.min(wordList.length, WORDS_PER_LEVEL)} words done
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {[
                { label: 'Score',      value: levelScore },
                { label: 'Accuracy',   value: `${attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0}%` },
                { label: 'Best Streak',value: maxStreak },
                { label: 'Bonus',      value: `+${bonusEarned}` },
              ].map(({ label, value }) => (
                <div key={label} className={`rounded-xl p-3 ${isDarkMode ? 'bg-teal-900/40' : 'bg-teal-50'}`}>
                  <p className="text-[10px] uppercase tracking-wider text-teal-500 dark:text-teal-400 font-semibold">{label}</p>
                  <p className="text-xl font-extrabold text-teal-700 dark:text-teal-300 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 mt-5">
              {currentLevel < 10 && canAccessLevel(currentLevel + 1) && (
                <button
                  onClick={() => {
                    setCurrentLevel(currentLevel + 1);
                    setGameStarted(false);
                    setShowDialog(true);
                    setDialogMessage(`Ready to start Level ${currentLevel + 1}? You have 5 minutes to spell 10 words. Each word has 30 seconds to answer.`);
                  }}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 active:scale-95 transition shadow-sm text-sm"
                >
                  Next Level →
                </button>
              )}
              <button
                onClick={goToDashboard}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 active:scale-95 transition ${
                  isDarkMode ? 'border-teal-700 text-teal-300' : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                }`}
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── GAME PLAY ── */}
        {gameStarted && !gameWon && (
          <div className="flex flex-col gap-3">

            {/* Progress bar row */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-800 border-teal-800' : 'bg-white border-teal-100 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                  Lvl {currentLevel}
                </span>
                <span className={`text-[11px] font-medium truncate ${levelColors[currentLevel]}`}>
                  {levelLabels[currentLevel]}
                </span>
                {consecutiveCorrect > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isDarkMode ? 'bg-teal-900/60 text-teal-300' : 'bg-teal-100 text-teal-700'
                  }`}>
                    🔥 {consecutiveCorrect}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1 text-xs font-bold ${getLevelTimerColor()}`}>
                  <Timer size={13} />
                  {formatTimeDisplay(levelTimeLeft)}
                </div>
                {/* Word dots */}
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(wordList.length, WORDS_PER_LEVEL) }, (_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx < wordIndex ? 'w-3 bg-teal-600' :
                        idx === wordIndex ? 'w-3 bg-teal-400' :
                        `w-3 ${isDarkMode ? 'bg-teal-800' : 'bg-teal-100'}`
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Speaker button */}
            <div className="flex flex-col items-center py-2">
              <button
                onClick={replayWord}
                disabled={isCorrect !== null || showNextButton || !voiceSettings.enabled || isDictating || levelTimeUp}
                className={`relative p-5 rounded-full transition-all active:scale-95 ${
                  !voiceSettings.enabled || levelTimeUp
                    ? 'opacity-40 cursor-not-allowed bg-teal-100 dark:bg-slate-700'
                    : isPlaying || isDictating
                      ? 'bg-teal-200 dark:bg-teal-900/60 shadow-lg'
                      : 'bg-white dark:bg-teal-900/30 shadow-xl border-2 border-teal-100 dark:border-teal-800 hover:bg-teal-50'
                } ${(isCorrect !== null || showNextButton) ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {isPlaying || isDictating ? (
                  <div className="relative">
                    <Pause size={30} className="text-teal-700 dark:text-teal-300" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                    </span>
                  </div>
                ) : (
                  <Volume2 size={30} className={!voiceSettings.enabled ? 'text-teal-300' : 'text-teal-600 dark:text-teal-300'} />
                )}
              </button>
              <p className={`text-xs mt-2 font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                {levelTimeUp ? (
                  <span className="text-rose-500">⏰ Time is up!</span>
                ) : !voiceSettings.enabled ? (
                  <span className="text-amber-500">Voice disabled</span>
                ) : isPlaying || isDictating ? (
                  <span className="animate-pulse">{isDictating ? 'Speaking...' : 'Listening...'}</span>
                ) : wordSpoken ? (
                  <span className="text-teal-500">✓ Now type the word</span>
                ) : (
                  <span className="animate-pulse text-amber-500">🔄 Speaking the word…</span>
                )}
              </p>
            </div>

              {/* Word + keyboard card */}
            <div className={`rounded-2xl border-2 overflow-hidden ${
              isDarkMode ? 'bg-slate-800 border-teal-800' : 'bg-white border-teal-100 shadow-lg'
            }`}>

              {/* Letter boxes */}
              <div className={`flex justify-center gap-2 px-3 pt-5 pb-3 ${
                isDarkMode ? 'bg-slate-800' : 'bg-teal-50/60'
              }`}>
                {currentWord && currentWord.word.split('').map((_, index) => (
                  <div
                    key={index}
                    className={`${getBoxSize()} rounded-lg border-2 flex items-center justify-center font-extrabold transition-all ${getLetterColor(index)}`}
                  >
                    {letterBoxes[index] || ''}
                  </div>
                ))}
              </div>

              {/* Word countdown */}
              {!showNextButton && !levelTimeUp && (
                <div className="flex justify-center py-2">
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                    timeLeft > 20 ? (isDarkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-700') :
                    timeLeft > 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse'
                  }`}>
                    <Clock size={12} />
                    {timeLeft}s
                  </div>
                </div>
              )}

              {/* Keyboard — QWERTY rows, uniform size on all viewports */}
              {!showNextButton && !levelTimeUp && (
                <div className="px-2 pb-3 pt-1">
                  {[
                    'QWERTYUIOP'.split(''),
                    'ASDFGHJKL'.split(''),
                    'ZXCVBNM'.split(''),
                  ].map((row, rowIdx) => (
                    <div key={rowIdx} className="flex justify-center gap-1 mb-1">
                      {row.map((letter) => (
                        <button
                          key={letter}
                          onClick={() => handleKeyPress(letter)}
                          disabled={isCorrect !== null || gameWon || !isTimerRunning}
                          className={`
                            h-11 flex-1 rounded-lg font-bold text-sm transition-all select-none
                            ${row.length === 10 ? 'max-w-[42px]' : row.length === 9 ? 'max-w-[46px]' : 'max-w-[52px]'}
                            ${isCorrect !== null || gameWon || !isTimerRunning
                              ? 'bg-teal-50 dark:bg-teal-900/10 text-teal-300 dark:text-teal-700 cursor-not-allowed'
                              : 'bg-white dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 shadow-sm border border-teal-100 dark:border-teal-800 active:scale-95 active:bg-teal-100 dark:active:bg-teal-800'
                            }
                          `}
                        >
                          {letter}
                        </button>
                      ))}
                      {/* Delete key on last row */}
                      {rowIdx === 2 && (
                        <button
                          onClick={handleBackspace}
                          disabled={isCorrect !== null || gameWon || !isTimerRunning}
                          className={`h-11 px-3 rounded-lg font-medium transition-all select-none flex items-center gap-1 text-xs
                            ${isCorrect !== null || gameWon || !isTimerRunning
                              ? 'bg-teal-50 dark:bg-teal-900/10 text-teal-300 dark:text-teal-700 cursor-not-allowed'
                              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 active:scale-95 active:bg-rose-100'
                            }`}
                        >
                          <Trash2 size={14} />
                          Del
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Status feedback */}
              {isCorrect !== null && currentWord && (
                <div className={`mx-3 mb-3 p-3 rounded-xl text-center font-semibold text-sm ${
                  isCorrect
                    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                }`}>
                  {isCorrect ? '✅ Correct!' : `❌ Correct spelling: ${currentWord.word}`}
                </div>
              )}

              {/* Next / Retry */}
              {showNextButton && !levelTimeUp && !gameWon && (
                <div className="flex gap-2.5 px-3 pb-4">
                  {!isCorrect && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={15} />
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={handleNextWord}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    Next
                    <SkipForward size={15} />
                  </button>
                </div>
              )}

              {/* Level Time Up */}
              {levelTimeUp && (
                <div className="mx-3 mb-3 p-4 bg-rose-100 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 rounded-xl text-center">
                  <AlertCircle className="w-7 h-7 text-rose-500 mx-auto mb-1.5" />
                  <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">⏰ Level Time is Up!</p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-rose-300' : 'text-rose-500'}`}>
                    Your progress has been saved.
                  </p>
                  <button
                    onClick={goToDashboard}
                    className="mt-3 w-full py-2.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 active:scale-95 transition"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Bottom controls */}
            {!levelTimeUp && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={replayWord}
                  disabled={isCorrect !== null || showNextButton || !voiceSettings.enabled || isDictating}
                  className="flex flex-col items-center gap-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium text-xs hover:bg-teal-700 active:scale-95 transition disabled:opacity-40 shadow-sm"
                >
                  <Repeat size={16} />
                  Listen
                </button>
                <button
                  onClick={skipWord}
                  disabled={isCorrect !== null || !currentWord || showNextButton}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl font-medium text-xs active:scale-95 transition disabled:opacity-40 shadow-sm border-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 bg-white dark:bg-transparent"
                >
                  <SkipForward size={16} />
                  Skip
                </button>
                <button
                  onClick={resetGame}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl font-medium text-xs active:scale-95 transition shadow-sm border-2 ${
                    isDarkMode ? 'border-teal-700 text-teal-300' : 'border-teal-200 text-teal-700 bg-white'
                  }`}
                >
                  <RefreshCw size={16} />
                  Restart
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── START DIALOG ── */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border-t-2 sm:border-2 max-h-[92vh] overflow-y-auto bg-white border-teal-200"
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-teal-200" />
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-teal-100">
                <BookOpen size={24} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-teal-800">
                  Ready to Play?
                </h2>
                <p className="text-xs text-teal-500">
                  Level {currentLevel} · {levelLabels[currentLevel]}
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-4 text-teal-700">
              {dialogMessage || `Spell ${Math.min(totalWords, WORDS_PER_LEVEL)} words in 5 minutes. 30 seconds per word.`}
            </p>

            <div className="grid grid-cols-1 gap-2 p-3 rounded-xl border border-teal-100 bg-teal-50 mb-5">
              {[
                [<Volume2 size={13} />, 'Words spoken aloud automatically'],
                [<Keyboard size={13} />, 'On-screen keyboard to spell'],
                [<Timer size={13} />, '5-minute level timer'],
                [<Clock size={13} />, '30 seconds per word'],
                [<Trophy size={13} />, '+2 pts/word · bonus every 5 correct'],
              ].map(([icon, text], i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-teal-600">
                  {icon}<span>{text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={goToDashboard}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-teal-200 text-teal-700 hover:bg-teal-50 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => startGame(wordList)}
                className="flex-1 py-3 bg-teal-600 text-teal-50 rounded-xl font-extrabold text-sm hover:bg-teal-700 active:scale-95 transition shadow-md flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL UP ── */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-teal-600 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl animate-fadeIn">
            <div className="text-5xl mb-3 animate-bounce">🎉</div>
            <h2 className="text-2xl font-extrabold text-white mb-1">Level Up!</h2>
            <p className="text-base font-bold text-teal-100">Level {currentLevel} · {levelLabels[currentLevel]}</p>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {[
                { label: 'Score',      value: levelScore },
                { label: 'Accuracy',   value: `${attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0}%` },
                { label: 'Best Streak',value: maxStreak },
                { label: 'Bonus',      value: `+${bonusEarned}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3">
                  <p className="text-teal-200 text-[10px] uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-white font-extrabold text-xl mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {currentLevel < 10 && (
              <p className="text-teal-100 text-xs mt-3">
                Next → Level {currentLevel + 1}: {levelLabels[currentLevel + 1]}
              </p>
            )}
            <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${(currentLevel / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.22s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SpellingBee;