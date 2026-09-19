// src/screens/learners/Hangman.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import API_URL from '../../config';
import useVoice from '../../hooks/useVoice';
import { 
  ArrowLeft, RefreshCw, Award, Clock, 
  Zap, Trophy, X, Check, HelpCircle, BookOpen,
  Globe, GraduationCap, Music,
  Activity, Brain, Sparkles, Volume2, VolumeX, Mic, MicOff
} from 'lucide-react';

// Subject-based categories with icons and colors
const categoryMetadata = {
  'mathematics':    { name: 'Mathematics',     icon: <Brain size={18} />,       color: '#0d9488', bgColor: 'bg-teal-50' },
  'english':        { name: 'English',          icon: <BookOpen size={18} />,    color: '#0f766e', bgColor: 'bg-teal-50' },
  'primary-science':{ name: 'Science',          icon: <Activity size={18} />,    color: '#115e59', bgColor: 'bg-teal-50' },
  'social-studies': { name: 'Social Studies',   icon: <Globe size={18} />,       color: '#14b8a6', bgColor: 'bg-teal-50' },
  'bible-knowledge':{ name: 'Bible Knowledge',  icon: <BookOpen size={18} />,    color: '#0d9488', bgColor: 'bg-teal-50' },
  'arts-life-skills':{ name: 'Arts & Life Skills', icon: <Music size={18} />,   color: '#0f766e', bgColor: 'bg-teal-50' },
  'chichewa':       { name: 'Chichewa',         icon: <GraduationCap size={18} />, color: '#115e59', bgColor: 'bg-teal-50' }
};

const Hangman = () => {
  const navigate = useNavigate();
  const { speak: speakVoice, stop: stopVoice } = useVoice();
  
  // Audio refs
  const audioContext = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const speechSynth = useRef(null);

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
          oscillator.frequency.setValueAtTime(311, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(277, ctx.currentTime + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
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
          
        case 'lose':
          const loseNotes = [523, 494, 466, 440, 392];
          loseNotes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.12;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15);
            osc.start(ctx.currentTime + i * 0.12);
            osc.stop(ctx.currentTime + i * 0.12 + 0.15);
          });
          break;
          
        case 'hint':
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
          
        case 'click':
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.05);
          break;
          
        case 'lifeline':
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(700, ctx.currentTime + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.log('Audio not available');
    }
  };

  // Voice feedback — uses ElevenLabs cloned voice, falls back to browser TTS
  const speak = (message, options = {}) => {
    if (!voiceEnabled) return;
    // Use the cloned voice hook (which falls back to browser automatically)
    speakVoice(message);
  };

  // Load voices
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Theme toggle effect
  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      setTimeout(() => playSound('click'), 100);
    }
  };

  // Toggle voice
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      setTimeout(() => speak('Voice feedback enabled'), 100);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Game State
  const [categories, setCategories] = useState([]);
  const [words, setWords] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentWordData, setCurrentWordData] = useState(null);
  const [displayWord, setDisplayWord] = useState([]);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [usedWords, setUsedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryWords, setCategoryWords] = useState([]);
  const [trackingAttempt, setTrackingAttempt] = useState(false);
  const [error, setError] = useState(null);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [removedLetters, setRemovedLetters] = useState([]);
  const [currentHint, setCurrentHint] = useState('');

  const maxAttempts = 6;

  // Points are dynamic based on word difficulty (2-5 points)

  // Fetch categories and words
  useEffect(() => {
    fetchCategoriesAndWords();
  }, []);

  const fetchCategoriesAndWords = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to play', {
          duration: 3000,
          position: 'top-center',
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch subjects (categories) for hangman
        const subjectsResponse = await axios.get(`${API_URL}/api/hangman/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (subjectsResponse.data.success && subjectsResponse.data.subjects) {
          const subjects = subjectsResponse.data.subjects;
          setCategories(subjects.map(s => s.id));
        }

        // Fetch all existing words
        const response = await axios.get(`${API_URL}/api/hangman/words`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.words) {
          setWords(response.data.words);
        } else {
          setWords([]);
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Use default subjects even if API fails
        setCategories(['mathematics', 'english', 'primary-science', 'social-studies', 'bible-knowledge', 'arts-life-skills', 'chichewa']);
        setWords([]);
      }
    } catch (error) {
      console.error('Error fetching words:', error);
      setCategories(['mathematics', 'english', 'primary-science', 'social-studies', 'bible-knowledge', 'arts-life-skills', 'chichewa']);
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  const getWordHint = (wordData) => {
    if (wordData?.hint && wordData.hint.trim().length > 0) {
      return wordData.hint;
    }
    return `Word with ${wordData?.word?.length || 'unknown'} letters`;
  };

  const initializeCategory = async (categoryKey) => {
    const token = localStorage.getItem('token');
    
    // First try to generate/fetch words for this subject dynamically
    try {
      const generateResponse = await axios.post(`${API_URL}/api/hangman/generate-words`, 
        { subject: categoryKey, count: 15 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (generateResponse.data.success && generateResponse.data.words && generateResponse.data.words.length > 0) {
        const subjectWords = generateResponse.data.words;
        setWords(prev => {
          // Merge new words with existing, avoiding duplicates
          const existingIds = new Set(prev.map(w => w.id));
          const newWords = subjectWords.filter(w => !existingIds.has(w.id));
          return [...prev, ...newWords];
        });
        
        setSelectedCategory(categoryKey);
        setCategoryWords(subjectWords);
        setUsedWords([]);
        setGuessedLetters([]);
        setIncorrectGuesses([]);
        setWrongAttempts(0);
        setGameOver(false);
        setGameWon(false);
        setHintUsed(false);
        setShowHint(false);
        setTimeElapsed(0);
        setTimerActive(false);
        setGamesPlayed(prev => prev + 1);
        setLifelineUsed(false);
        setRemovedLetters([]);
        setCurrentHint('');

        selectNewWord(subjectWords, []);
        return;
      }
    } catch (genError) {
      console.error('Error generating words for subject:', genError);
    }

    // Fallback: use any existing words for this category
    const categoryWords = words.filter(w => w.category === categoryKey);
    
    if (categoryWords.length === 0) {
      toast.error('No words available for this subject. Please try again.');
      return;
    }

    setSelectedCategory(categoryKey);
    setCategoryWords(categoryWords);
    setUsedWords([]);
    setGuessedLetters([]);
    setIncorrectGuesses([]);
    setWrongAttempts(0);
    setGameOver(false);
    setGameWon(false);
    setHintUsed(false);
    setShowHint(false);
    setTimeElapsed(0);
    setTimerActive(false);
    setGamesPlayed(prev => prev + 1);
    setLifelineUsed(false);
    setRemovedLetters([]);
    setCurrentHint('');

    selectNewWord(categoryWords, []);
  };

  const selectNewWord = (wordsList, used) => {
    const availableWords = wordsList.filter(w => !used.includes(w.id));
    
    if (availableWords.length === 0) {
      setUsedWords([]);
      const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];
      setCurrentWord(randomWord.word);
      setCurrentWordData(randomWord);
      setDisplayWord(Array(randomWord.word.length).fill('_'));
      setUsedWords([randomWord.id]);
      setCurrentHint(getWordHint(randomWord));
      return;
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(randomWord.word);
    setCurrentWordData(randomWord);
    setDisplayWord(Array(randomWord.word.length).fill('_'));
    setUsedWords(prev => [...prev, randomWord.id]);
    setGuessedLetters([]);
    setIncorrectGuesses([]);
    setWrongAttempts(0);
    setGameOver(false);
    setGameWon(false);
    setHintUsed(false);
    setShowHint(false);
    setTimerActive(true);
    setLifelineUsed(false);
    setRemovedLetters([]);
    setCurrentHint(getWordHint(randomWord));
  };

  const handleRemoveFourLetters = () => {
    if (lifelineUsed || gameOver || gameWon) return;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const wrongAvailableLetters = alphabet.filter(
      char => !currentWord.includes(char) && !guessedLetters.includes(char) && !incorrectGuesses.includes(char)
    );

    const shuffled = [...wrongAvailableLetters].sort(() => 0.5 - Math.random());
    const toRemove = shuffled.slice(0, 4);

    setRemovedLetters(toRemove);
    setLifelineUsed(true);
    playSound('lifeline');
    speak('Four letters removed from the keyboard');
    toast.success('Eliminated 4 incorrect letters from the keyboard!');
  };

  useEffect(() => {
    let interval;
    if (timerActive && !gameOver && !gameWon) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver, gameWon]);

  useEffect(() => {
    if (displayWord.length > 0 && !displayWord.includes('_') && !gameOver) {
      setGameWon(true);
      setTimerActive(false);
      setStreak(prev => prev + 1);
      
      const pointsEarned = currentWordData?.points || 2;
      setScore(prev => prev + pointsEarned);
      
      trackWordAttempt(currentWordData?.id, true);
      playSound('win');
      
      const congratulationsMessages = [
        'Congratulations! You solved the word!',
        `Excellent! You guessed ${currentWord} correctly!`,
        `Well done! You earned ${pointsEarned} points!`,
        `Fantastic! You got ${currentWord}!`,
        'Outstanding! You cracked the code!'
      ];
      const randomMessage = congratulationsMessages[Math.floor(Math.random() * congratulationsMessages.length)];
      speak(randomMessage, { rate: 0.85, pitch: 1.1 });
      
      toast.success(`🎉 You got it! +${pointsEarned} points!`, {
        duration: 3000,
        position: 'top-center',
      });
    }
  }, [displayWord, gameOver, currentWordData]);

  useEffect(() => {
    if (gameOver && currentWordData) {
      trackWordAttempt(currentWordData.id, false);
      playSound('lose');
      
      speak("I'm really sorry, try next time", { rate: 0.75, pitch: 0.85 });
    }
  }, [gameOver, currentWordData]);

  const trackWordAttempt = async (wordId, correct) => {
    if (!wordId || trackingAttempt) return;
    
    try {
      setTrackingAttempt(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/hangman/track-attempt`, {
        wordId,
        correct,
        attempts: wrongAttempts + 1,
        timeSpent: timeElapsed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error tracking attempt:', error);
    } finally {
      setTrackingAttempt(false);
    }
  };

  const handleKeyPress = useCallback((letter) => {
    if (gameOver || gameWon) return;
    if (guessedLetters.includes(letter) || incorrectGuesses.includes(letter) || removedLetters.includes(letter)) {
      toast.error('You already guessed that letter!', {
        duration: 2000,
        position: 'top-center',
      });
      return;
    }

    const upperLetter = letter.toUpperCase();
    
    if (currentWord.includes(upperLetter)) {
      setGuessedLetters(prev => [...prev, upperLetter]);
      const newDisplay = currentWord.split('').map((char, index) => {
        if (char === upperLetter) return char;
        return displayWord[index] || '_';
      });
      setDisplayWord(newDisplay);
      playSound('correct');
      speak(`Good guess! ${upperLetter} is correct`, { rate: 0.9, pitch: 1.0 });
    } else {
      setIncorrectGuesses(prev => [...prev, upperLetter]);
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      playSound('wrong');
      
      const remaining = maxAttempts - newAttempts;
      if (remaining > 0) {
        speak(`${upperLetter} is incorrect. ${remaining} attempts left`, { rate: 0.9, pitch: 0.9 });
      }
      
      if (newAttempts >= maxAttempts) {
        setGameOver(true);
        setTimerActive(false);
        setStreak(0);
        toast.error(`😢 Game Over! The word was: ${currentWord}`, {
          duration: 4000,
          position: 'top-center',
        });
      }
    }
  }, [currentWord, displayWord, gameOver, gameWon, guessedLetters, incorrectGuesses, wrongAttempts, removedLetters]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toUpperCase();
      if (key.length === 1 && key >= 'A' && key <= 'Z') {
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getHint = () => {
    if (hintUsed) {
      toast('Hint already used for this word!', {
        duration: 2000,
        position: 'top-center',
      });
      return;
    }
    if (currentWord && currentHint) {
      setShowHint(true);
      setHintUsed(true);
      playSound('hint');
      speak(`Here is a hint: ${currentHint}`, { rate: 0.8, pitch: 1.0 });
      toast.success(`💡 ${currentHint}`, {
        duration: 4000,
        position: 'top-center',
      });
    } else if (currentWord) {
      const fallbackHint = `The word starts with "${currentWord[0]}" and has ${currentWord.length} letters`;
      setShowHint(true);
      setHintUsed(true);
      playSound('hint');
      speak(fallbackHint, { rate: 0.8, pitch: 1.0 });
      toast.success(`💡 ${fallbackHint}`, {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  const skipWord = () => {
    if (gamesPlayed > 0) {
      setStreak(0);
      playSound('click');
      speak(`Skipping the word. The word was ${currentWord}`, { rate: 0.8, pitch: 0.9 });
      toast(`⏭️ Skipped! The word was: ${currentWord}`, {
        duration: 3000,
        position: 'top-center',
      });
      selectNewWord(categoryWords, usedWords);
    }
  };

  const resetGame = () => {
    if (selectedCategory) {
      playSound('click');
      speak('Starting a new game', { rate: 0.9, pitch: 1.0 });
      initializeCategory(selectedCategory);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const keyboardRows = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
    ['U', 'V', 'W', 'X', 'Y', 'Z']
  ];

  const getWordCount = (categoryKey) => words.filter(w => w.category === categoryKey && w.is_active !== false).length;

  const renderHangmanSVG = () => {
    const parts = wrongAttempts;
    
    return (
      <svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-md">
        <style>{`
          @keyframes ropeSwing {
            0% { transform: rotate(-2deg); }
            50% { transform: rotate(2deg); }
            100% { transform: rotate(-2deg); }
          }
          @keyframes figureBounce {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50% { transform: translateY(2px) rotate(1deg); }
          }
          @keyframes tearFall {
            0% { transform: translateY(0px) scale(0.5); opacity: 0; }
            15% { opacity: 1; }
            80% { transform: translateY(28px) scale(1.1); opacity: 0.9; }
            100% { transform: translateY(35px) scale(0); opacity: 0; }
          }
          .rope-swinger {
            transform-origin: 90px 30px;
            animation: ropeSwing 3s ease-in-out infinite;
          }
          .body-bouncer {
            transform-origin: 90px 68px;
            animation: figureBounce 2s ease-in-out infinite;
          }
          .falling-tear {
            animation: tearFall 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>

        <path d="M 60 200 L 160 200" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
        <path d="M 140 200 L 140 30" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
        <path d="M 140 30 L 90 30" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
        <path d="M 140 60 L 115 30" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        
        <g className="rope-swinger">
          <path d="M 90 30 L 90 56" stroke="#451a03" strokeWidth="3" strokeLinecap="round" strokeDasharray="1.5,1.5" />
          
          <g transform="translate(0, 52)">
            <ellipse cx="90" cy="14" rx="10" ry="6" fill="none" stroke="#2C1808" strokeWidth="4" />
            <rect x="85" y="0" width="10" height="9" rx="1.5" fill="#451a03" />
            <line x1="85" y1="3" x2="95" y2="3" stroke="#2C1808" strokeWidth="1" />
            <line x1="85" y1="6" x2="95" y2="6" stroke="#2C1808" strokeWidth="1" />
            <path d="M 80 14 A 10 6 0 0 0 100 14" fill="none" stroke="#451a03" strokeWidth="3" />
          </g>

          <g className="body-bouncer">
            {parts > 0 && (
              <g>
                <circle cx="90" cy="68" r="14" fill="#5C3A21" stroke="#2B1A0F" strokeWidth="3" />
                <circle cx="87" cy="65" r="11" fill="none" stroke="#70482B" strokeWidth="1" className="opacity-50" />
                
                {parts < maxAttempts ? (
                  <>
                    <path d="M 84 66 Q 86 65 87 67" stroke="#1F120A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 93 67 Q 94 65 96 66" stroke="#1F120A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 85 74 Q 90 71 95 74" fill="none" stroke="#1F120A" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path d="M 83 64 L 87 68 M 87 64 L 83 68" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 93 64 L 97 68 M 97 64 L 93 68" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 84 75 Q 90 78 96 75" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 82 70 Q 81 73 79 75 Q 82 76 82 73 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.75" className="falling-tear" />
                    <path d="M 98 70 Q 99 73 101 75 Q 98 76 98 73 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.75" className="falling-tear" style={{ animationDelay: '0.8s' }} />
                  </>
                )}
              </g>
            )}

            {parts > 1 && (
              <g>
                <rect x="74" y="82" width="32" height="40" rx="6" fill="#008080" stroke="#006666" strokeWidth="3" />
                <rect x="76" y="84" width="28" height="36" rx="4" fill="none" stroke="#00A0A0" strokeWidth="1.5" className="opacity-30" />
              </g>
            )}

            {parts > 2 && (
              <g>
                <path d="M 72 86 L 56 120" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 72 86 L 56 120" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {parts > 3 && (
              <g>
                <path d="M 108 86 L 124 120" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 108 86 L 124 120" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {parts > 4 && (
              <g>
                <path d="M 80 122 L 70 165" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 80 122 L 70 165" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {parts > 5 && (
              <g>
                <path d="M 100 122 L 110 165" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 100 122 L 110 165" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}
          </g>
        </g>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-slate-900' : 'bg-teal-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
            Loading hangman words...
          </p>
        </div>
      </div>
    );
  }

  if (categories.length === 0 && !loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-slate-900' : 'bg-teal-50'
      }`}>
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">📝</div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-teal-800'}`}>
            No Subjects Available
          </h2>
          <p className={`mt-2 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
            Unable to load subjects. Please check your connection and try again.
          </p>
          <button
            onClick={() => navigate('/learner-dashboard')}
            className="mt-4 px-4 py-2 bg-teal-600 text-teal-50 rounded-lg font-bold hover:bg-teal-700 transition shadow-md"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`learner-themed min-h-screen w-full max-w-full transition-all duration-500 ${
      isDarkMode ? 'bg-slate-900' : 'bg-teal-50'
    }`}>
      <Toaster position="top-center" />
      
      {/* ── HEADER — matches Spelling Bee style ── */}
      <header className={`sticky top-0 z-50 w-full shadow-lg border-b ${
        isDarkMode ? 'bg-teal-900 border-teal-800' : 'bg-teal-700 border-teal-600'
      }`}>
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
                <p className="text-[9px] text-teal-100 uppercase tracking-widest font-semibold">Hangman 🪓</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-lg transition-all ${
                  voiceEnabled ? 'bg-white/20 text-teal-50' : 'bg-teal-800/40 text-teal-100'
                }`}
                aria-label={voiceEnabled ? 'Voice On' : 'Voice Off'}
              >
                {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
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
                onClick={() => navigate('/learner-dashboard')}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-teal-50 text-teal-700 hover:bg-white transition shadow-sm"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 border-t border-white/15 py-1">
            {[
              { label: 'Score',    value: score },
              { label: 'Streak',   value: `${streak}🔥` },
              { label: 'Attempts', value: `${wrongAttempts}/${maxAttempts}` },
              { label: 'Time',     value: formatTime(timeElapsed) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-0.5">
                <p className="text-[9px] font-semibold text-teal-100 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-teal-50">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-lg mx-auto px-4 py-4">
        {!selectedCategory ? (
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-teal-800'}`}>
              Choose a Subject
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
              Select a subject to start playing
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
              Earn <span className="font-bold text-teal-600 dark:text-teal-400">2-5 points</span> for each word!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {categories.map((categoryKey) => {
                const meta = categoryMetadata[categoryKey];
                const wordCount = getWordCount(categoryKey);
                return (
                  <button
                    key={categoryKey}
                    onClick={() => {
                      initializeCategory(categoryKey);
                      playSound('click');
                    }}
                    className={`p-4 rounded-xl transition-all duration-300 border-2 hover:shadow-lg hover:scale-[1.02] ${
                      isDarkMode
                        ? 'bg-teal-900/30 border-teal-800 hover:border-teal-500 hover:bg-teal-900/50'
                        : 'bg-white border-teal-100 hover:border-teal-500 hover:shadow-md'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-2 mx-auto"
                      style={{ backgroundColor: meta?.color || '#0d9488' }}
                    >
                      {meta?.icon || <BookOpen size={20} />}
                    </div>
                    <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-teal-800'}`}>
                      {meta?.name || categoryKey}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                      {wordCount > 0 ? `${wordCount} words` : 'Dynamic'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Word Display - Boxes with teal borders */}
            <div className="text-center py-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {displayWord.map((letter, index) => {
                  const revealed = guessedLetters.includes(letter) || gameOver;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className={`w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center border-2 rounded-md ${
                        revealed && !gameOver
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : gameOver && !guessedLetters.includes(letter)
                          ? 'border-teal-700 bg-teal-100 dark:bg-teal-900/30'
                          : 'border-teal-300 bg-white dark:bg-teal-900/10'
                      } transition-all duration-300`}>
                        <span className={`text-xl sm:text-2xl font-bold uppercase ${
                          revealed ? 'text-teal-800 dark:text-teal-200' : 'text-transparent'
                        }`}>
                          {letter}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Double Column: Hangman (Left) + Keyboard (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column - Hangman SVG */}
              <div className="flex items-center justify-center relative" style={{ minHeight: '220px' }}>
                <div className="w-full max-w-xs">
                  {renderHangmanSVG()}
                </div>

                {/* Game Over / Win Overlay */}
                {(gameOver || gameWon) && (
                  <div className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center ${
                    isDarkMode ? 'bg-teal-950/95' : 'bg-teal-50/95'
                  } p-4 text-center`}>
                    <h3 className={`text-2xl font-bold ${gameWon ? 'text-teal-600' : 'text-teal-800'}`}>
                      {gameWon ? '🎉 Level Cleared!' : '💥 Game Over'}
                    </h3>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
                      {gameWon
                        ? `Excellent! You earned +${currentWordData?.points || 2} points!`
                        : `The word was: ${currentWord}`}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={resetGame}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition active:scale-95 ${
                          isDarkMode
                            ? 'border-teal-700 text-teal-300 hover:bg-teal-900/40'
                            : 'border-teal-200 text-teal-700 hover:bg-teal-100'
                        }`}
                      >
                        Replay
                      </button>
                      <button
                        onClick={() => {
                          selectNewWord(categoryWords, usedWords);
                          playSound('click');
                        }}
                        className="px-4 py-2 bg-teal-600 text-teal-50 rounded-lg text-sm font-bold hover:bg-teal-700 active:scale-95 transition shadow-md"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Keyboard and Hint Panel */}
              <div className="flex flex-col space-y-3">
                {/* Keyboard */}
                <div className={`border-2 border-teal-400 p-3 w-full rounded-t-xl ${
                  isDarkMode ? 'bg-teal-900/30' : 'bg-white shadow-sm'
                }`}>
                  {keyboardRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center items-center gap-1 mb-1 last:mb-0">
                      {row.map((char) => {
                        const isGuessed = guessedLetters.includes(char);
                        const isIncorrect = incorrectGuesses.includes(char);
                        const isEliminated = removedLetters.includes(char);
                        const isCorrect = isGuessed && currentWord.includes(char);

                        let btnStyle = isDarkMode
                          ? "bg-teal-900/40 text-teal-200 border-b border-teal-700 hover:bg-teal-800/60"
                          : "bg-teal-50 text-teal-800 border-b border-teal-200 hover:bg-teal-100";
                        if (isCorrect)    btnStyle = "bg-teal-600 text-white border-b border-teal-700 font-bold";
                        if (isIncorrect)  btnStyle = "bg-teal-200 text-teal-500 dark:bg-teal-900/20 dark:text-teal-600 border-b border-teal-300 line-through opacity-60";
                        if (isEliminated) btnStyle = "bg-teal-100 text-teal-300 dark:bg-teal-900/10 dark:text-teal-700 cursor-not-allowed opacity-40 border-none pointer-events-none";

                        return (
                          <button
                            key={char}
                            onClick={() => {
                              handleKeyPress(char);
                              if (!isGuessed && !isIncorrect && !isEliminated && !gameOver && !gameWon) {
                                playSound('click');
                              }
                            }}
                            disabled={isGuessed || isIncorrect || isEliminated || gameOver || gameWon}
                            className={`flex-1 min-w-[32px] max-w-[52px] h-11 sm:h-14 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base shadow-sm transition-all uppercase active:scale-95 ${btnStyle}`}
                          >
                            {char}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Hint Panel */}
                <div className={`border-2 border-teal-400 w-full flex items-center justify-between gap-3 p-2.5 rounded-b-xl ${
                  isDarkMode ? 'bg-teal-900/30' : 'bg-white'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`}>
                      💡 Clue:
                    </p>
                    <p className={`text-xs sm:text-sm font-medium truncate ${isDarkMode ? 'text-teal-200' : 'text-teal-800'}`}>
                      {showHint ? currentHint : 'Click "Hint" to reveal'}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFourLetters}
                    disabled={lifelineUsed || gameOver || gameWon}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                      (lifelineUsed || gameOver || gameWon)
                        ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-400 dark:text-teal-600 cursor-not-allowed'
                        : 'bg-teal-600 text-teal-50 hover:bg-teal-700 shadow-md'
                    }`}
                  >
                    {lifelineUsed ? '✓ Used' : '🎯 Remove 4'}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                onClick={getHint}
                disabled={hintUsed || gameOver || gameWon}
                className="flex flex-col items-center gap-1 py-2.5 bg-teal-600 text-teal-50 rounded-xl font-medium text-xs hover:bg-teal-700 active:scale-95 transition disabled:opacity-40 shadow-sm"
              >
                <Sparkles size={15} />
                {hintUsed ? 'Used' : 'Hint'}
              </button>

              <button
                onClick={skipWord}
                disabled={gameOver || gameWon}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl font-medium text-xs active:scale-95 transition disabled:opacity-40 shadow-sm border-2 ${
                  isDarkMode ? 'border-teal-700 text-teal-300' : 'border-teal-200 text-teal-700 bg-white'
                }`}
              >
                <RefreshCw size={15} />
                Skip
              </button>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setGamesPlayed(0);
                  playSound('click');
                }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl font-medium text-xs active:scale-95 transition shadow-sm border-2 ${
                  isDarkMode ? 'border-teal-700 text-teal-300' : 'border-teal-200 text-teal-700 bg-white'
                }`}
              >
                <BookOpen size={15} />
                Subjects
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Hangman;