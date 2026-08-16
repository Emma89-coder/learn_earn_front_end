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

  const themeAccentColor = settings?.accentColor || '#14b8a6';
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
    1: 'text-green-600', 2: 'text-green-700', 3: 'text-blue-600', 
    4: 'text-blue-700', 5: 'text-indigo-600', 6: 'text-indigo-700',
    7: 'text-purple-600', 8: 'text-purple-700', 9: 'text-amber-600', 
    10: 'text-amber-700'
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

  // Get letter color
  const getLetterColor = (index) => {
    if (!letterBoxes[index]) return 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600';
    if (isCorrect === true) return 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-500 text-green-700 dark:text-green-400';
    if (isCorrect === false) {
      if (letterBoxes[index] && currentWord && letterBoxes[index].toLowerCase() === currentWord.word[index]?.toLowerCase()) {
        return 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-500 text-green-700 dark:text-green-400';
      }
      return 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-500 text-red-700 dark:text-red-400';
    }
    return 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600';
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color
  const getTimerColor = () => {
    if (timeLeft > 20) return 'text-green-600 dark:text-green-400';
    if (timeLeft > 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400 animate-pulse';
  };

  // Get level timer color
  const getLevelTimerColor = () => {
    if (levelTimeLeft > 120) return 'text-green-600 dark:text-green-400';
    if (levelTimeLeft > 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400 animate-pulse';
  };

  if (loading || isLoadingTimer || isLoadingVoiceSettings) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Brain className="text-teal-600 dark:text-teal-400 animate-bounce relative z-10" size={40} />
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-teal-600'}`}>
            {isLoadingTimer ? 'Loading timer settings...' : 
             isLoadingVoiceSettings ? 'Loading voice settings...' : 
             'Loading spelling words...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`learner-themed min-h-screen w-full max-w-full transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      <Toaster position="top-center" />
      
      {/* Header - AdminRewards Style */}
      <header className="shadow-2xl border-b border-black/10 sticky top-0 z-50" style={{ backgroundColor: 'var(--learner-header-bg, #19475F)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-12 h-12 object-contain drop-shadow-lg"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/48x48?text=LE';
                  }}
                />
                <div>
                  <h1 className="text-xl font-black tracking-tighter text-white" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                    LearnEarn
                  </h1>
                  <p className="text-[10px] text-white/80 font-semibold uppercase tracking-wider">Spelling Bee</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleSound}
                className={`p-2 rounded-lg transition-all ${
                  soundEnabled 
                    ? 'bg-teal-500 text-white shadow-lg' 
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  isDarkMode 
                    ? 'bg-white/20 text-yellow-400' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={goToDashboard}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition shadow-md"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Stats Bar - AdminRewards Style */}
          <div className="grid grid-cols-4 gap-2 py-2 border-t border-white/20">
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Score</p>
              <p className="text-sm font-bold text-white">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Streak</p>
              <p className="text-sm font-bold text-white">{streak}🔥</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Level</p>
              <p className="text-sm font-bold text-white">{currentLevel}/10</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Time</p>
              <p className={`text-sm font-bold text-white ${getLevelTimerColor()}`}>
                {formatTimeDisplay(levelTimeLeft)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center">
          {!gameStarted ? (
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                Spelling Bee
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                Listen to the word, then type it correctly!
              </p>
              
              {/* Level Info - AdminRewards Style */}
              <div className={`mt-4 p-4 rounded-xl border-2 max-w-sm mx-auto ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-teal-400' 
                  : 'bg-white shadow-sm border-teal-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Level {currentLevel}
                    </p>
                    <p className={`text-lg font-bold ${levelColors[currentLevel]}`}>
                      {levelLabels[currentLevel]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Progress
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      {maxUnlockedLevel}/10
                    </p>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(maxUnlockedLevel / 10) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    Level 1
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    Level 10
                  </span>
                </div>
              </div>

              {/* Level Progress Indicators */}
              <div className="flex items-center gap-1 mt-4 justify-center">
                {LEVELS.map(level => (
                  <div
                    key={level}
                    className={`w-6 h-1.5 rounded-full transition-all ${
                      level <= maxUnlockedLevel ? 'bg-teal-500' :
                      level === maxUnlockedLevel + 1 ? 'bg-teal-300 animate-pulse' :
                      'bg-gray-200 dark:bg-slate-700'
                    } ${level === currentLevel ? 'ring-1 ring-teal-500' : ''}`}
                    title={`Level ${level} ${level <= maxUnlockedLevel ? 'Completed' : level === maxUnlockedLevel + 1 ? 'Unlocked' : 'Locked'}`}
                  />
                ))}
              </div>
              
              {/* Voice Status */}
              {voiceSettings.enabled && (
                <div className="mt-3 text-xs">
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1 justify-center">
                    <Volume2 size={14} className="text-green-500" />
                    Voice enabled
                  </span>
                </div>
              )}
              
              {!voiceSettings.enabled && (
                <p className={`text-xs text-amber-600 dark:text-amber-400 mt-2`}>
                  Voice is currently disabled by the administrator.
                </p>
              )}
              
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {totalWords} words in this level
              </p>
            </div>
          ) : gameWon ? (
            // Game Won Screen
            <div className={`rounded-xl border-2 p-6 max-w-md w-full text-center ${
              isDarkMode 
                ? 'bg-slate-800/50 border-teal-400' 
                : 'bg-white shadow-sm border-teal-500'
            }`}>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-teal-700'}`}>
                Level {currentLevel} Complete!
              </h2>
              <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                You completed {Math.min(wordList.length, WORDS_PER_LEVEL)} words!
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className={`rounded-xl p-3 ${
                  isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'
                }`}>
                  <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                    Score
                  </p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    {levelScore}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${
                  isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'
                }`}>
                  <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                    Accuracy
                  </p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    {attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0}%
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${
                  isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'
                }`}>
                  <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                    Best Streak
                  </p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    {maxStreak}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${
                  isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'
                }`}>
                  <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                    Bonus
                  </p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    +{bonusEarned}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                {currentLevel < 10 && canAccessLevel(currentLevel + 1) && (
                  <button
                    onClick={() => {
                      setCurrentLevel(currentLevel + 1);
                      setGameStarted(false);
                      setShowDialog(true);
                      setDialogMessage(`Ready to start Level ${currentLevel + 1}? You have 5 minutes to spell 10 words. Each word has 30 seconds to answer.`);
                    }}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition shadow-md"
                  >
                    Next Level →
                  </button>
                )}
                <button
                  onClick={goToDashboard}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    isDarkMode 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Dashboard
                </button>
              </div>
            </div>
          ) : (
            // Game Play Area
            <div className="w-full max-w-2xl">
              {/* Level Timer and Progress */}
              <div className={`flex justify-between items-center mb-4 p-2 rounded-lg ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-white/80'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Level {currentLevel}
                  </span>
                  <span className={`text-xs font-medium ${levelColors[currentLevel]}`}>
                    {levelLabels[currentLevel]}
                  </span>
                  {consecutiveCorrect > 0 && (
                    <span className={`text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      🔥 {consecutiveCorrect} streak
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 font-bold ${getLevelTimerColor()}`}>
                    <Timer size={20} />
                    <span className="text-lg">{formatTimeDisplay(levelTimeLeft)}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(wordList.length, WORDS_PER_LEVEL) }, (_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 w-6 rounded-full transition-all ${
                          idx < wordIndex ? 'bg-teal-500' :
                          idx === wordIndex ? 'bg-teal-300' : 'bg-gray-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Speaker Button - Cleaned up */}
              <div className="flex flex-col items-center mb-6">
                <button
                  onClick={replayWord}
                  disabled={isCorrect !== null || showNextButton || !voiceSettings.enabled || isDictating || levelTimeUp}
                  className={`relative p-6 rounded-full transition-all transform hover:scale-105 ${
                    !voiceSettings.enabled || levelTimeUp ? 'opacity-50 cursor-not-allowed bg-gray-300 dark:bg-slate-700' :
                    isPlaying || isDictating 
                      ? 'bg-purple-200 dark:bg-purple-900/30 shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30' 
                      : 'bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 shadow-md hover:shadow-lg'
                  } ${(isCorrect !== null || showNextButton) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!voiceSettings.enabled ? 'Voice is disabled by admin' : 'Click to hear the word again'}
                >
                  {isPlaying || isDictating ? (
                    <div className="relative">
                      <Pause size={36} className="text-purple-600 dark:text-purple-400" />
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Volume1 size={36} className={!voiceSettings.enabled ? 'text-gray-400' : 'text-purple-600 dark:text-purple-400'} />
                  )}
                </button>
                <p className={`text-sm mt-3 font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {levelTimeUp ? (
                    <span className="text-red-600 dark:text-red-400">⏰ Level time is up!</span>
                  ) : !voiceSettings.enabled ? (
                    <span className="text-amber-600 dark:text-amber-400">Voice is disabled</span>
                  ) : isPlaying || isDictating ? (
                    <span className="text-purple-600 dark:text-purple-400 animate-pulse">
                      {isDictating ? 'Speaking...' : 'Listening...'}
                    </span>
                  ) : (
                    <span className="text-gray-400">Click to hear the word again</span>
                  )}
                </p>
                {!wordSpoken && !isPlaying && !isDictating && !showNextButton && voiceSettings.enabled && !levelTimeUp && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 animate-pulse">
                    🔄 Speaking the word...
                  </p>
                )}
                {wordSpoken && !isPlaying && !isDictating && !showNextButton && voiceSettings.enabled && !levelTimeUp && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Now type the word
                  </p>
                )}
              </div>

              {/* Word Display */}
              <div className={`rounded-xl border-2 p-6 ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-teal-400' 
                  : 'bg-white shadow-sm border-teal-500'
              }`}>
                {/* Letter Boxes */}
                <div className="flex justify-center gap-2 mb-6">
                  {currentWord && currentWord.word.split('').map((letter, index) => (
                    <div
                      key={index}
                      className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all ${getLetterColor(index)}`}
                    >
                      {letterBoxes[index] || ''}
                    </div>
                  ))}
                </div>

                {/* Word Timer - 30 seconds */}
                {!showNextButton && !levelTimeUp && (
                  <div className="flex justify-center mb-4">
                    <div className={`flex items-center gap-2 font-bold ${getTimerColor()}`}>
                      <Clock size={18} />
                      <span className="text-sm">{timeLeft}s remaining</span>
                    </div>
                  </div>
                )}

                {/* Keyboard */}
                {!showNextButton && !levelTimeUp && (
                  <>
                    <div className="mt-4">
                      <div className="flex flex-wrap justify-center gap-1 max-w-lg mx-auto">
                        {alphabet.map((letter) => (
                          <button
                            key={letter}
                            onClick={() => handleKeyPress(letter)}
                            disabled={isCorrect !== null || gameWon || !isTimerRunning}
                            className={`w-8 h-10 rounded-lg font-bold text-sm transition-all ${
                              isCorrect !== null || gameWon || !isTimerRunning
                                ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                : 'bg-teal-100 dark:bg-teal-900/30 hover:bg-teal-200 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:scale-105 shadow-sm active:bg-teal-300 dark:active:bg-teal-800'
                            }`}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                      
                      {/* Special Keys */}
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={handleBackspace}
                          disabled={isCorrect !== null || gameWon || !isTimerRunning}
                          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                            isCorrect !== null || gameWon || !isTimerRunning
                              ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
                          }`}
                        >
                          <Trash2 size={16} />
                          Backspace
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Status Message */}
                {isCorrect !== null && currentWord && (
                  <div className={`mt-4 p-3 rounded-xl text-center font-medium ${
                    isCorrect 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {isCorrect ? '✅ Correct!' : `❌ Incorrect. Correct spelling: ${currentWord.word}`}
                  </div>
                )}

                {showAnswer && currentWord && (
                  <div className={`mt-2 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    The word was: <span className="font-bold text-teal-600 dark:text-teal-400">{currentWord.word}</span>
                  </div>
                )}

                {/* Next / Retry Buttons */}
                {showNextButton && !levelTimeUp && !gameWon && (
                  <div className="flex justify-center gap-3 mt-4">
                    {!isCorrect && (
                      <button
                        onClick={handleRetry}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={handleNextWord}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-600 text-white shadow-md transition-all flex items-center gap-2"
                    >
                      Next Word
                      <SkipForward size={16} />
                    </button>
                  </div>
                )}

                {/* Level Time Up Message */}
                {levelTimeUp && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 mx-auto mb-2" />
                    <p className="font-bold text-red-700 dark:text-red-400">⏰ Level Time is Up!</p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                      Your progress has been saved.
                    </p>
                    <button
                      onClick={goToDashboard}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              {!levelTimeUp && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <button
                    onClick={replayWord}
                    disabled={isCorrect !== null || showNextButton || !voiceSettings.enabled || isDictating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    <Repeat size={18} />
                    Listen Again
                  </button>

                  <button
                    onClick={skipWord}
                    disabled={isCorrect !== null || !currentWord || showNextButton}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    <SkipForward size={18} />
                    Skip
                  </button>

                  <button
                    onClick={resetGame}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      isDarkMode 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <RefreshCw size={18} />
                    Restart Level
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Start Dialog - Play/Cancel */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => {}}>
          <div
            className="rounded-2xl max-w-md w-full p-8 shadow-2xl border-2"
            style={{
              backgroundColor: modalBackground,
              borderColor: modalBorderColor,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeAccentColor}18` }}>
                <BookOpen size={28} style={{ color: themeAccentColor }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: modalHeadingColor }}>
                  Ready to Play?
                </h2>
                <p className="text-sm" style={{ color: modalAccentTextColor }}>
                  Level {currentLevel}
                </p>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed" style={{ color: modalTextColor }}>
              {dialogMessage || `Ready to start Level ${currentLevel}? You'll hear each word and type it correctly.`}
            </p>
            
            <div
              className="mt-6 p-3 rounded-xl border"
              style={{
                backgroundColor: isDarkMode ? `${themeAccentColor}20` : `${themeAccentColor}12`,
                borderColor: `${themeAccentColor}33`,
              }}
            >
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: modalTextColor }}>
                <Volume2 size={14} />
                <span>Words will be spoken automatically</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: modalTextColor }}>
                <Keyboard size={14} />
                <span>Type using the on-screen keyboard</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: modalTextColor }}>
                <Timer size={14} />
                <span>You have 5 minutes to complete the level</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: modalTextColor }}>
                <Clock size={14} />
                <span>30 seconds per word to spell correctly</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: modalTextColor }}>
                <Trophy size={14} />
                <span>+2 points per word, +2 bonus every 5 correct!</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t-2" style={{ borderColor: isDarkMode ? '#334155' : '#e5e7eb' }}>
              <button
                onClick={goToDashboard}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{ color: modalTextColor }}
              >
                <XCircle size={18} />
                Cancel
              </button>
              <button
                onClick={() => startGame(wordList)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-bold hover:from-teal-600 hover:to-cyan-600 transition shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
              >
                <Play size={18} />
                Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl transform transition-all duration-500 ${levelUpAnimation ? 'scale-100' : 'scale-0'}`}>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
            <p className="text-xl font-bold text-white">Level {currentLevel} Complete!</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-white font-semibold">{levelLabels[currentLevel]}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/80 text-xs">Score</p>
                <p className="text-white font-bold text-xl">{levelScore}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/80 text-xs">Accuracy</p>
                <p className="text-white font-bold text-xl">
                  {attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0}%
                </p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/80 text-xs">Best Streak</p>
                <p className="text-white font-bold text-xl">{maxStreak}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white/80 text-xs">Bonus Earned</p>
                <p className="text-white font-bold text-xl">+{bonusEarned}</p>
              </div>
            </div>
            {currentLevel < 10 && (
              <p className="text-white/90 text-sm mt-4">
                Next: Level {currentLevel + 1} {levelLabels[currentLevel + 1]}
              </p>
            )}
            <div className="mt-4 w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(currentLevel / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SpellingBee;