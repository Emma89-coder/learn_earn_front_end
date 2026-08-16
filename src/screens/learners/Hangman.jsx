// src/screens/learners/Hangman.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import API_URL from '../../config';
import { 
  ArrowLeft, RefreshCw, Award, Clock, 
  Zap, Trophy, X, Check, HelpCircle, BookOpen,
  Shirt, Briefcase, Globe, GraduationCap, Music,
  Utensils, Car, Home, Activity, Gamepad2, Bell,
  Brain, Sparkles, Volume2, VolumeX, Mic, MicOff
} from 'lucide-react';

// Fallback words in case API fails
const FALLBACK_WORDS = {
  clothes: ['JACKET', 'TROUSERS', 'SHIRT', 'DRESS', 'SKIRT', 'JEANS', 'SWEATER', 'COAT', 'BLOUSE', 'TIE', 'SUIT', 'SHORTS', 'SOCKS', 'SCARF', 'GLOVES', 'BOOTS', 'SANDALS', 'HAT', 'CAP', 'BELT'],
  careers: ['TEACHER', 'DOCTOR', 'ENGINEER', 'NURSE', 'PILOT', 'ARCHITECT', 'CHEF', 'DENTIST', 'PHARMACIST', 'VETERINARIAN', 'JOURNALIST', 'LAWYER', 'SCIENTIST', 'PROFESSOR', 'ACCOUNTANT', 'PHOTOGRAPHER', 'MECHANIC', 'PLUMBER', 'ELECTRICIAN'],
  countries: ['MALAWI', 'ZAMBIA', 'TANZANIA', 'MOZAMBIQUE', 'SOUTHAFRICA', 'KENYA', 'UGANDA', 'RWANDA', 'BOTSWANA', 'ZIMBABWE', 'NIGERIA', 'GHANA', 'EGYPT', 'ETHIOPIA', 'CAMEROON', 'ANGOLA', 'NAMIBIA', 'SENEGAL', 'MALI', 'SUDAN'],
  classroom: ['TEACHER', 'STUDENT', 'DESK', 'CHAIR', 'BOARD', 'BOOK', 'PENCIL', 'PEN', 'RULER', 'ERASER', 'SHARPENER', 'BACKPACK', 'NOTEBOOK', 'CALCULATOR', 'DICTIONARY', 'ATLAS', 'GLOBE', 'MAP', 'CHALK', 'DOOR', 'WINDOW', 'CLOCK'],
  music: ['GUITAR', 'PIANO', 'DRUMS', 'VIOLIN', 'FLUTE', 'TRUMPET', 'SAXOPHONE', 'KEYBOARD', 'HARP', 'CELLO', 'TROMBONE', 'CLARINET', 'BASS', 'UKULELE', 'ACCORDION', 'ORGAN', 'XYLOPHONE', 'MARACAS', 'TAMBOURINE'],
  food: ['PIZZA', 'BURGER', 'PASTA', 'SUSHI', 'TACOS', 'SALAD', 'SOUP', 'SANDWICH', 'BREAD', 'CAKE', 'COOKIE', 'CHOCOLATE', 'VANILLA', 'STRAWBERRY', 'BANANA', 'APPLE', 'ORANGE', 'WATERMELON', 'GRAPES'],
  vehicles: ['BICYCLE', 'MOTORCYCLE', 'CAR', 'BUS', 'TRUCK', 'TRAIN', 'PLANE', 'SHIP', 'BOAT', 'HELICOPTER', 'TAXI', 'AMBULANCE', 'TRACTOR', 'SUBWAY', 'FERRY', 'SAILBOAT', 'JET', 'ROCKET'],
  home: ['KITCHEN', 'BATHROOM', 'BEDROOM', 'LIVINGROOM', 'DININGROOM', 'WINDOW', 'DOOR', 'FLOOR', 'CEILING', 'WALL', 'ROOF', 'GARDEN', 'GARAGE', 'ATTIC', 'BASEMENT', 'CLOSET', 'CABINET', 'FURNITURE'],
  sports: ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'SWIMMING', 'RUNNING', 'CYCLING', 'BOXING', 'WRESTLING', 'GYMNASTICS', 'DIVING', 'SKATING', 'SKIING', 'SURFING', 'SAILING', 'FENCING', 'JUDO'],
  gaming: ['MINECRAFT', 'FORTNITE', 'ROBLOX', 'MARIO', 'ZELDA', 'SONIC', 'POKEMON', 'AMONGUS', 'FIFA', 'MADDEN', 'GTA', 'REDDEAD', 'CYBERPUNK', 'HALO', 'COD', 'BATTLEFIELD']
};

// Fallback hints for words (used when admin hasn't set a hint)
const FALLBACK_HINTS = {
  MALAWI: 'The Warm Heart of Africa',
  ZAMBIA: 'Home to Victoria Falls',
  TANZANIA: 'Home to Mount Kilimanjaro',
  KENYA: 'Known for its wildlife safaris',
  NIGERIA: 'The Giant of Africa',
  GHANA: 'The Gold Coast of Africa',
  EGYPT: 'Home to the ancient pyramids',
  'SOUTH AFRICA': 'The Rainbow Nation',
  TEACHER: 'Helps students learn and grow',
  DOCTOR: 'Treats patients and saves lives',
  ENGINEER: 'Builds and designs structures',
  NURSE: 'Cares for patients in hospitals',
  GUITAR: 'A stringed musical instrument with six strings',
  PIANO: 'A keyboard instrument with black and white keys',
  DRUMS: 'Percussion instrument played with sticks',
  VIOLIN: 'String instrument played with a bow',
  PIZZA: 'Italian dish with cheese and toppings',
  BURGER: 'Served between two buns with a patty',
  PASTA: 'Italian noodle dish',
  SUSHI: 'Japanese rice dish with raw fish',
  BICYCLE: 'Two-wheeled pedal-powered vehicle',
  CAR: 'Four-wheeled motor vehicle for transportation',
  KITCHEN: 'Room where food is prepared and cooked',
  BATHROOM: 'Room for personal hygiene and bathing',
  BEDROOM: 'Room where you sleep and rest',
  FOOTBALL: 'Most popular sport played with a round ball',
  BASKETBALL: 'Sport played with a hoop and ball',
  TENNIS: 'Racket sport played on a court',
  SWIMMING: 'Moving through water using limbs',
  MINECRAFT: 'Popular block-building video game',
  FORTNITE: 'Popular battle royale video game',
  MARIO: 'Famous plumber video game character',
  ZELDA: 'Adventure video game series',
  HANGMAN: 'A classic word guessing game',
  JACKET: 'A piece of clothing worn on the upper body for warmth',
  TROUSERS: 'A garment worn on the legs, also called pants',
  SHIRT: 'A garment worn on the upper torso',
  DRESS: 'A one-piece garment for women',
  SKIRT: 'A garment that hangs from the waist',
  JEANS: 'Denim pants for casual wear',
  SWEATER: 'A knitted garment for warmth',
  SCARF: 'Worn around the neck for warmth or style',
  GLOVES: 'Hand coverings for warmth or protection',
  BOOTS: 'Footwear that covers the ankle and foot',
  SANDALS: 'Open footwear with straps',
  HAT: 'Headwear for fashion or protection from sun',
  BELT: 'A strap worn around the waist to hold up pants'
};

const Hangman = () => {
  const navigate = useNavigate();
  
  // Categories with icons and colors
  const categoryMetadata = {
    clothes: { name: 'Clothes', icon: <Shirt size={20} />, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50' },
    careers: { name: 'Careers', icon: <Briefcase size={20} />, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50' },
    countries: { name: 'Countries', icon: <Globe size={20} />, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50' },
    classroom: { name: 'Classroom', icon: <GraduationCap size={20} />, color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50' },
    music: { name: 'Music', icon: <Music size={20} />, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50' },
    food: { name: 'Food', icon: <Utensils size={20} />, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-50' },
    vehicles: { name: 'Vehicles', icon: <Car size={20} />, color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50' },
    home: { name: 'Home', icon: <Home size={20} />, color: 'from-teal-500 to-cyan-500', bgColor: 'bg-teal-50' },
    sports: { name: 'Sports', icon: <Activity size={20} />, color: 'from-red-500 to-orange-500', bgColor: 'bg-red-50' },
    gaming: { name: 'Gaming', icon: <Gamepad2 size={20} />, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-50' }
  };

  // Audio refs
  const audioContext = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
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

  // Voice feedback using Web Speech API
  const speak = (message, options = {}) => {
    if (!voiceEnabled) return;
    
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      if (!speechSynth.current) {
        speechSynth.current = window.speechSynthesis;
      }
      
      const utterance = new SpeechSynthesisUtterance(message);
      
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 0.8;
      utterance.lang = options.lang || 'en-US';
      
      const voices = speechSynth.current.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                            voices.find(v => v.lang.startsWith('en')) || 
                            voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynth.current.speak(utterance);
    } catch (error) {
      console.log('Voice feedback not available');
    }
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
  const [usingFallback, setUsingFallback] = useState(false);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [removedLetters, setRemovedLetters] = useState([]);
  const [currentHint, setCurrentHint] = useState('');

  const maxAttempts = 6;
  const POINTS_PER_WORD = 2;

  // Fetch categories and words
  useEffect(() => {
    fetchCategoriesAndWords();
  }, []);

  const fetchCategoriesAndWords = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      const token = localStorage.getItem('token');
      
      if (!token) {
        loadFallbackWords();
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/admin/hangman/words`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.words && response.data.words.length > 0) {
          const allWords = response.data.words;
          setWords(allWords);
          const uniqueCategories = [...new Set(allWords.map(w => w.category))];
          setCategories(uniqueCategories);
          toast.success(`Loaded ${allWords.length} words from database!`);
        } else {
          loadFallbackWords();
          toast.info('Using default word list. Admin can add more words.');
        }
      } catch (apiError) {
        console.error('API error, using fallback words:', apiError);
        loadFallbackWords();
        toast.info('Using default word list. Admin can add more words.');
      }
    } catch (error) {
      console.error('Error fetching words:', error);
      loadFallbackWords();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackWords = () => {
    setUsingFallback(true);
    const fallbackWordsList = [];
    const categoriesList = [];
    
    Object.entries(FALLBACK_WORDS).forEach(([category, wordList]) => {
      categoriesList.push(category);
      wordList.forEach(word => {
        const hint = FALLBACK_HINTS[word] || `A word from ${categoryMetadata[category]?.name || category}`;
        fallbackWordsList.push({
          id: `fallback-${category}-${word}`,
          word: word,
          category: category,
          hint: hint,
          difficulty: 'medium',
          points: POINTS_PER_WORD,
          image_url: null,
          is_active: true
        });
      });
    });
    
    setWords(fallbackWordsList);
    setCategories(categoriesList);
    setError(null);
  };

  const getWordHint = (wordData) => {
    if (wordData?.hint && wordData.hint.trim().length > 0) {
      return wordData.hint;
    }
    const fallbackHint = FALLBACK_HINTS[wordData?.word] || `Word with ${wordData?.word?.length || 'unknown'} letters`;
    return fallbackHint;
  };

  const initializeCategory = (categoryKey) => {
    const categoryWords = words.filter(w => w.category === categoryKey);
    
    if (categoryWords.length === 0) {
      toast.error('No words available in this category');
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
      
      const pointsEarned = POINTS_PER_WORD;
      setScore(prev => prev + pointsEarned);
      
      trackWordAttempt(currentWordData?.id, true);
      playSound('win');
      
      const congratulationsMessages = [
        'Congratulations! You solved the word!',
        `Excellent! You guessed ${currentWord} correctly!`,
        'Well done! You earned 2 points!',
        `Fantastic! You got ${currentWord}!`,
        'Outstanding! You cracked the code!'
      ];
      const randomMessage = congratulationsMessages[Math.floor(Math.random() * congratulationsMessages.length)];
      speak(randomMessage, { rate: 0.85, pitch: 1.1 });
      
      toast.success(`🎉 You got it! +${pointsEarned} points!`);
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
    if (!wordId || trackingAttempt || usingFallback) return;
    
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
      toast.error('You already guessed that letter!');
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
        toast.error(`😢 Game Over! The word was: ${currentWord}`);
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
      toast.info('Hint already used for this word!');
      return;
    }
    if (currentWord && currentHint) {
      setShowHint(true);
      setHintUsed(true);
      playSound('hint');
      speak(`Here is a hint: ${currentHint}`, { rate: 0.8, pitch: 1.0 });
      toast.success(`💡 ${currentHint}`);
    } else if (currentWord) {
      const fallbackHint = `The word starts with "${currentWord[0]}" and has ${currentWord.length} letters`;
      setShowHint(true);
      setHintUsed(true);
      playSound('hint');
      speak(fallbackHint, { rate: 0.8, pitch: 1.0 });
      toast.success(`💡 ${fallbackHint}`);
    }
  };

  const skipWord = () => {
    if (gamesPlayed > 0) {
      setStreak(0);
      playSound('click');
      speak(`Skipping the word. The word was ${currentWord}`, { rate: 0.8, pitch: 0.9 });
      toast.info(`⏭️ Skipped! The word was: ${currentWord}`);
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
      <svg viewBox="0 0 200 220" className="w-full h-full max-h-[28vh] drop-shadow-md">
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

        {/* Gallows structure */}
        <path d="M 60 200 L 160 200" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
        <path d="M 140 200 L 140 30" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
        <path d="M 140 30 L 90 30" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
        <path d="M 140 60 L 115 30" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        
        {/* Animated Rope Assembly */}
        <g className="rope-swinger">
          <path d="M 90 30 L 90 56" stroke="#451a03" strokeWidth="3" strokeLinecap="round" strokeDasharray="1.5,1.5" />
          
          <g transform="translate(0, 52)">
            <ellipse cx="90" cy="14" rx="10" ry="6" fill="none" stroke="#2C1808" strokeWidth="4" />
            <rect x="85" y="0" width="10" height="9" rx="1.5" fill="#451a03" />
            <line x1="85" y1="3" x2="95" y2="3" stroke="#2C1808" strokeWidth="1" />
            <line x1="85" y1="6" x2="95" y2="6" stroke="#2C1808" strokeWidth="1" />
            <path d="M 80 14 A 10 6 0 0 0 100 14" fill="none" stroke="#451a03" strokeWidth="3" />
          </g>

          {/* Character Figure Group */}
          <g className="body-bouncer">
            {/* Head - Black African Skin Tone */}
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

            {/* Torso - Teal */}
            {parts > 1 && (
              <g>
                <rect x="74" y="82" width="32" height="40" rx="6" fill="#008080" stroke="#006666" strokeWidth="3" />
                <rect x="76" y="84" width="28" height="36" rx="4" fill="none" stroke="#00A0A0" strokeWidth="1.5" className="opacity-30" />
              </g>
            )}

            {/* Left Arm - Teal */}
            {parts > 2 && (
              <g>
                <path d="M 72 86 L 56 120" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 72 86 L 56 120" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* Right Arm - Teal */}
            {parts > 3 && (
              <g>
                <path d="M 108 86 L 124 120" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 108 86 L 124 120" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* Left Leg - Teal */}
            {parts > 4 && (
              <g>
                <path d="M 80 122 L 70 165" stroke="#008080" strokeWidth="8" strokeLinecap="round" />
                <path d="M 80 122 L 70 165" stroke="#006666" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* Right Leg - Teal */}
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
      <div className="h-screen w-screen bg-teal-50 flex items-center justify-center overflow-hidden font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Brain className="text-teal-600 animate-bounce relative z-10" size={40} />
          </div>
          <p className="text-teal-600 text-sm font-medium font-sans">Loading hangman words...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-teal-50 flex flex-col font-sans antialiased overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Header Segment */}
      <div className="bg-teal-700 shadow-md border-b-2 border-teal-500 flex-none">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => navigate('/learner-dashboard')}
                className="p-1.5 hover:bg-teal-600 rounded-xl transition-all text-white"
                title="Back to Dashboard"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-600 rounded-xl">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white leading-none font-sans tracking-wide">Hangman</h1>
                  <p className="text-[10px] text-teal-200 font-medium mt-0.5 font-sans">Word Challenge</p>
                </div>
              </div>
            </div>

            {/* Stats Row with Sound & Voice Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleVoice}
                className="p-1.5 hover:bg-teal-600 rounded-xl transition-all text-white"
                title={voiceEnabled ? 'Mute Voice' : 'Unmute Voice'}
              >
                {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                onClick={toggleSound}
                className="p-1.5 hover:bg-teal-600 rounded-xl transition-all text-white"
                title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-teal-600 rounded-full">
                <Trophy size={14} className="text-yellow-300" />
                <span className="text-white font-bold text-xs font-sans">{score}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-600 rounded-full">
                <Zap size={14} className="text-teal-200" />
                <span className="text-white font-bold text-xs font-sans">{streak}🔥</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-600 rounded-full">
                <Clock size={14} className="text-teal-200" />
                <span className="text-white font-bold text-xs font-sans">{formatTime(timeElapsed)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Grid Viewport Sizing */}
      <div className="flex-1 overflow-hidden p-3 md:p-4 max-w-4xl mx-auto w-full flex flex-col justify-between items-center space-y-2">
        
        {!selectedCategory ? (
          <div className="w-full h-full overflow-y-auto py-4 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-teal-800 font-sans tracking-wide">Choose a Category</h2>
              <p className="text-teal-600 text-sm mt-1 font-sans">Select a topic to start playing</p>
              <p className="text-xs text-teal-500 mt-0.5 font-sans">Earn <span className="font-bold">2 points</span> for each word you guess correctly!</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                    className="p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all border border-teal-200 flex flex-col items-center hover:border-teal-400"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${meta?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white mb-2`}>
                      {meta?.icon || <BookOpen size={20} />}
                    </div>
                    <h3 className="font-bold text-teal-800 text-sm text-center font-sans">{meta?.name || categoryKey}</h3>
                    <p className="text-[11px] text-teal-500 mt-0.5 font-sans">{wordCount} words</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Word Slots Row */}
            <div className="w-full flex-none flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 px-4 bg-white rounded-xl shadow-sm border border-teal-200">
              {displayWord.map((letter, index) => {
                const revealed = guessedLetters.includes(letter) || gameOver;
                return (
                  <div key={index} className="flex flex-col items-center w-5 sm:w-7">
                    <span className={`text-lg sm:text-2xl font-bold uppercase transition-all tracking-wider ${revealed ? 'text-teal-800' : 'opacity-0'} font-sans`}>
                      {letter}
                    </span>
                    <div className={`w-full h-[2.5px] mt-0.5 ${revealed && gameOver && !guessedLetters.includes(letter) ? 'bg-red-500' : 'bg-teal-500'}`}></div>
                  </div>
                );
              })}
            </div>

            {/* Render 3D Canvas Box */}
            <div className="w-full flex-1 min-h-[140px] flex items-center justify-center p-3 bg-white rounded-2xl border border-teal-200 shadow-inner max-w-md relative">
              {renderHangmanSVG()}

              {/* Status Alert Overlay Modal */}
              {(gameOver || gameWon) && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl border border-teal-300 p-4 flex flex-col items-center justify-center space-y-3 text-center animate-fade-in z-20">
                  <h3 className={`text-xl font-bold font-sans uppercase tracking-wider ${gameWon ? 'text-teal-600' : 'text-red-600'}`}>
                    {gameWon ? '🎉 Level Cleared!' : '💥 Game Over'}
                  </h3>
                  <p className="text-xs text-gray-600 max-w-[260px] font-sans">
                    {gameWon 
                      ? `Excellent deductions! You earned +${POINTS_PER_WORD} points!` 
                      : `The correct word was: ${currentWord}`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={resetGame}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-[11px] font-bold font-sans uppercase transition-all"
                    >
                      Replay
                    </button>
                    <button
                      onClick={() => {
                        selectNewWord(categoryWords, usedWords);
                        playSound('click');
                      }}
                      className="px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-[11px] font-bold font-sans uppercase transition-all shadow-sm"
                    >
                      Next Word
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hint & Strategic Lifeline Panel */}
            <div className="w-full flex-none bg-white rounded-xl p-2.5 border border-teal-200 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-left overflow-hidden flex-1">
                  <span className="font-sans font-bold uppercase text-[10px] tracking-wider text-teal-600 block flex items-center gap-1">
                    💡 Clue:
                    {currentHint && !showHint && (
                      <span className="text-[8px] text-purple-500 font-normal flex items-center gap-0.5">
                        <Sparkles size={10} />
                        (click hint button)
                      </span>
                    )}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-teal-800 truncate font-sans">
                    {showHint ? currentHint : 'Click "Hint" to reveal'}
                  </p>
                </div>

                <button
                  onClick={handleRemoveFourLetters}
                  disabled={lifelineUsed || gameOver || gameWon}
                  className={`px-3 py-1.5 bg-teal-600 text-white font-bold font-sans text-[11px] uppercase tracking-wide rounded-xl transition-all shadow-sm hover:bg-teal-700 whitespace-nowrap ${
                    (lifelineUsed || gameOver || gameWon) && 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {lifelineUsed ? '✓ Used' : '🎯 Remove 4'}
                </button>
              </div>
            </div>

            {/* Integrated Alphanumeric Virtual Keyboard */}
            <div className="w-full flex-none bg-white rounded-xl shadow-md border border-teal-200 p-2.5 max-w-xl space-y-1.5">
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center items-center gap-1">
                  {row.map((char) => {
                    const isGuessed = guessedLetters.includes(char);
                    const isIncorrect = incorrectGuesses.includes(char);
                    const isEliminated = removedLetters.includes(char);
                    const isCorrect = isGuessed && currentWord.includes(char);

                    let btnStyle = "bg-teal-50 text-teal-700 border-b-2 border-teal-200 hover:bg-teal-100";
                    if (isCorrect) btnStyle = "bg-teal-600 text-white border-b-2 border-teal-700 font-bold";
                    if (isIncorrect) btnStyle = "bg-red-100 text-red-600 border-b-2 border-red-300 line-through opacity-70";
                    if (isEliminated) btnStyle = "bg-gray-100 text-gray-400 cursor-not-allowed opacity-40 border-none pointer-events-none";

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
                        className={`w-7 h-9 sm:w-9 sm:h-11 rounded-md flex items-center justify-center font-sans font-bold text-xs sm:text-sm shadow-xs transition-all uppercase ${btnStyle}`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Action Control Bar */}
            <div className="w-full flex-none flex justify-center gap-2 pb-1">
              <button
                onClick={getHint}
                disabled={hintUsed || gameOver || gameWon}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-xl font-bold hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm font-sans"
              >
                <Sparkles size={14} />
                {hintUsed ? 'Hint Used' : 'Hint'}
              </button>

              <button
                onClick={skipWord}
                disabled={gameOver || gameWon}
                className="px-3.5 py-2 bg-cyan-600 text-white text-xs rounded-xl font-bold hover:bg-cyan-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm font-sans"
              >
                <RefreshCw size={14} />
                Skip
              </button>

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setGamesPlayed(0);
                  playSound('click');
                }}
                className="px-3.5 py-2 bg-purple-600 text-white text-xs rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-1.5 shadow-sm font-sans"
              >
                <BookOpen size={14} />
                Category
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Hangman;