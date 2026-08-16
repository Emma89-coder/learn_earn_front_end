// src/screens/learners/SecondaryQuizPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { useTheme } from '../../contexts/ThemeContext';

// Import existing assets used by the secondary quiz experience
import secondaryMapImage from '../../assets/images/map.png';
import secondaryEnglishImage from '../../assets/images/quiz.png';
import secondaryScienceImage from '../../assets/images/science.png';
import secondaryMathsImage from '../../assets/images/maths.png';
import secondaryChichewaImage from '../../assets/images/chichewa.png';

// Secondary School Levels - Form 1-4
const LEVELS = [
  { id: 'form-1', name: 'Form 1', icon: '📘' },
  { id: 'form-2', name: 'Form 2', icon: '📗' },
  { id: 'form-3', name: 'Form 3', icon: '📕' },
  { id: 'form-4', name: 'Form 4', icon: '📙' }
];

const GAME_LEVEL_COLORS = {
  1:'bg-green-400', 2:'bg-green-500', 3:'bg-teal-400', 4:'bg-teal-500',
  5:'bg-blue-400',  6:'bg-blue-500',  7:'bg-purple-400',8:'bg-purple-500',
  9:'bg-orange-500',10:'bg-red-500',
};

const GAME_LEVEL_LABELS = [
  'Starter','Explorer','Thinker','Achiever','Scholar',
  'Expert','Master','Elite','Legend','Champion',
];

// Secondary subjects - different from primary
const SECONDARY_SUBJECTS = [
  { id: 'secondary-english', name: 'ENGLISH', icon: '📚', iconBg: 'bg-blue-500' },
  { id: 'secondary-mathematics', name: 'MATHEMATICS', icon: '🔢', iconBg: 'bg-indigo-500' },
  { id: 'secondary-biology', name: 'BIOLOGY', icon: '🧬', iconBg: 'bg-green-500' },
  { id: 'secondary-chemistry', name: 'CHEMISTRY', icon: '⚗️', iconBg: 'bg-purple-500' },
  { id: 'secondary-physics', name: 'PHYSICS', icon: '⚡', iconBg: 'bg-orange-500' },
  { id: 'secondary-history', name: 'HISTORY', icon: '📜', iconBg: 'bg-amber-500' },
  { id: 'secondary-geography', name: 'GEOGRAPHY', icon: '🌍', iconBg: 'bg-emerald-500' },
  { id: 'secondary-chichewa', name: 'CHICHEWA', icon: '🇲🇼', iconBg: 'bg-green-600' },
];

const SecondaryQuizPage = () => {
  const navigate = useNavigate();
  const { settings: theme, getPageStyles } = useTheme();
  const [activeSubject, setActiveSubject] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const savedSoundSetting = localStorage.getItem('portal-sound-fx');
    return savedSoundSetting ? savedSoundSetting === 'true' : true;
  });
  
  const [learnerProgress, setLearnerProgress] = useState({
    current_level: 'form-1',
    class_level: 'form-1',
    completed_levels: [],
    unlocked_levels: ['form-1'],
    locked_levels: ['form-2', 'form-3', 'form-4'],
    all_levels: ['form-1', 'form-2', 'form-3', 'form-4']
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [currentLearnerLevel, setCurrentLearnerLevel] = useState('form-1');

  useEffect(() => {
    // Check if user is secondary school student
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.class_level) {
      const level = userData.class_level.toLowerCase();
      // If student is primary level, redirect back to primary quiz page
      if (level.startsWith('standard')) {
        navigate('/quiz', { replace: true });
        toast.error('This page is for secondary school students');
        return;
      }
      setCurrentLearnerLevel(level);
    }

    fetchQuizzes();
    fetchLearnerProgress();
  }, [navigate]);

  const fetchLearnerProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No token found, using default progress');
        setIsLoadingProgress(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/learner/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const progressData = response.data.progress;
        setLearnerProgress(progressData);
        setCurrentLearnerLevel(progressData.current_level || 'form-1');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/learner-login');
      }
      
      setLearnerProgress({
        current_level: 'form-1',
        class_level: 'form-1',
        completed_levels: [],
        unlocked_levels: ['form-1'],
        locked_levels: ['form-2', 'form-3', 'form-4'],
        all_levels: ['form-1', 'form-2', 'form-3', 'form-4']
      });
      setCurrentLearnerLevel('form-1');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login again.');
        navigate('/learner-login');
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/learner/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
        if (response.data.learner_progress) {
          setLearnerProgress(response.data.learner_progress);
          setCurrentLearnerLevel(response.data.learner_progress.current_level || 'form-1');
        }
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/learner-login');
      } else {
        toast.error('Failed to load quizzes');
      }
    } finally {
      setLoading(false);
    }
  };

  const getQuizzesBySubject = (subjectId) => {
    const filtered = quizzes.filter(quiz => quiz.topic === subjectId);
    
    return filtered.filter(quiz => {
      if (!quiz.class_level) return true;
      return quiz.class_level === currentLearnerLevel;
    });
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('portal-theme', nextTheme ? 'dark' : 'light');
  };

  const toggleSound = () => {
    const nextSoundState = !isSoundEnabled;
    setIsSoundEnabled(nextSoundState);
    localStorage.setItem('portal-sound-fx', nextSoundState ? 'true' : 'false');
    if (!nextSoundState) window.speechSynthesis.cancel();
  };

  const speakText = (text) => {
    if (!isSoundEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.15;
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  const handleTileClick = (subject) => {
    speakText(`Opening ${subject.name} quizzes`);
    setActiveSubject(subject);
    setSelectedQuiz(null);
  };

  const closeDialog = () => {
    stopSpeech();
    setIsClosing(true);
    setTimeout(() => {
      setActiveSubject(null);
      setSelectedQuiz(null);
      setIsClosing(false);
      setFlippedCardId(null);
    }, 300);
  };

  const closeQuizDialog = () => {
    setSelectedQuiz(null);
  };

  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleStartQuiz = (quiz) => {
    speakText(`Starting ${quiz.title}`);
    if (quiz.random_selection) {
      navigate(`/quiz/${quiz.id}?random=true&limit=${quiz.questions_per_attempt || 20}`);
    } else {
      navigate(`/quiz/${quiz.id}`);
    }
  };

  const getTotalQuestions = (quiz) => {
    let questions = quiz.questions;
    if (typeof questions === 'string') {
      try { questions = JSON.parse(questions); } catch(e) { return 0; }
    }
    return questions?.length || 0;
  };

  const getQuestionsDisplayText = (quiz) => {
    const totalQuestions = getTotalQuestions(quiz);
    
    if (quiz.random_selection) {
      const perAttempt = quiz.questions_per_attempt || 20;
      if (totalQuestions > perAttempt) {
        return `🎲 ${perAttempt}/${totalQuestions}`;
      }
      return `📝 ${totalQuestions}`;
    }
    return `📝 ${totalQuestions}`;
  };

  const isRandomQuiz = (quiz) => {
    const totalQuestions = getTotalQuestions(quiz);
    return quiz.random_selection && totalQuestions > (quiz.questions_per_attempt || 20);
  };

  const getLevelDisplayName = (level) => {
    if (!level) return null;
    const found = LEVELS.find(l => l.id === level);
    return found ? found.name : level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  // Stats
  const totalQuizzes = quizzes.length;

  if (loading || isLoadingProgress) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
            {isLoadingProgress ? 'Loading progress...' : 'Loading quizzes...'}
          </p>
        </div>
      </div>
    );
  }

  const currentSubjectQuizzes = activeSubject ? getQuizzesBySubject(activeSubject.id) : [];

  return (
    <div
      className="learner-themed min-h-screen w-full max-w-full transition-all duration-500"
      style={{
        ...getPageStyles('quizPage'),
        backgroundColor: isDarkMode ? undefined : getPageStyles('quizPage').backgroundColor,
        color: isDarkMode ? undefined : getPageStyles('quizPage').color,
      }}
    >
      {isDarkMode && <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10" />}
      
      {/* Header */}
      <header className="shadow-2xl border-b border-black/10 sticky top-0 z-50" style={{ backgroundColor: '#1a5e6b' }}>
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
                  <p className="text-[10px] text-white/80 font-semibold uppercase tracking-wider">Secondary Quiz Hub</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSound}
                  className={`p-2 rounded-lg transition-all ${
                    isSoundEnabled 
                      ? 'bg-teal-500 text-white shadow-lg' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  title={isSoundEnabled ? 'Sound On' : 'Sound Off'}
                >
                  {isSoundEnabled ? '🔊' : '🔇'}
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
                  onClick={() => navigate('/learner-dashboard')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition shadow-md"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 py-2 border-t border-white/20">
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Quizzes</p>
              <p className="text-sm font-bold text-white">{totalQuizzes}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Level</p>
              <p className="text-sm font-bold text-white">{getLevelDisplayName(learnerProgress.current_level) || 'Form 1'}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Progress</p>
              <p className="text-sm font-bold text-white">{learnerProgress.completed_levels?.length || 0}/{LEVELS.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-medium text-white/80 uppercase tracking-wider">Subjects</p>
              <p className="text-sm font-bold text-white">{SECONDARY_SUBJECTS.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
            Secondary School Subjects
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
            Hover to see available quizzes
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-teal-100 dark:bg-teal-900">
            <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
              {getLevelDisplayName(currentLearnerLevel)} Student
            </span>
          </div>
        </div>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECONDARY_SUBJECTS.map((subject) => {
            const subjectQuizzes = getQuizzesBySubject(subject.id);
            const totalReward = subjectQuizzes.reduce((sum, q) => sum + (q.points_reward || 50), 0);
            const isFlipped = flippedCardId === subject.id;
            
            return (
              <div
                key={subject.id}
                className="relative cursor-pointer perspective group"
                style={{ height: '220px' }}
                onMouseEnter={() => {
                  speakText(subject.name);
                  setFlippedCardId(subject.id);
                }}
                onMouseLeave={() => {
                  stopSpeech();
                  if (!activeSubject) setFlippedCardId(null);
                }}
                onClick={() => handleTileClick(subject)}
              >
                <div className={`w-full h-full preserve-3d transition-all duration-700 relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-4 flex flex-col border-2 border-teal-400/50 shadow-lg overflow-hidden">
                    <div className="flex justify-center mb-2 flex-shrink-0">
                      <span className="text-6xl transform hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                        {subject.icon}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center text-center min-h-0">
                      <h3 className="text-white font-bold text-base tracking-tight mb-1 leading-tight">
                        {subject.name}
                      </h3>
                      <div className="mt-2 text-yellow-300 text-sm font-semibold">
                        +{totalReward} pts
                      </div>
                    </div>
                    <div className="text-center mt-1 flex-shrink-0">
                      <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                        <span className="text-white text-[11px] font-semibold">{subjectQuizzes.length} quizzes</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-teal-600 to-teal-700 p-4 flex flex-col rounded-2xl border-2 border-teal-500/50 shadow-lg overflow-hidden">
                    <h3 className="text-white font-bold text-sm mb-2 text-center flex-shrink-0">Available Quizzes</h3>
                    
                    <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                      {subjectQuizzes.slice(0, 3).map((quiz) => {
                        const questionsDisplay = getQuestionsDisplayText(quiz);
                        const isRandom = isRandomQuiz(quiz);
                        
                        return (
                          <div 
                            key={quiz.id} 
                            className="bg-white/10 rounded-md p-1.5 hover:bg-white/20 transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTileClick(subject);
                              setTimeout(() => handleQuizClick(quiz), 350);
                            }}
                          >
                            <p className="text-white text-xs font-semibold truncate flex items-center gap-1">
                              {quiz.title}
                            </p>
                            <div className="flex justify-between items-center mt-0.5">
                              <p className="text-white/60 text-[10px]">{questionsDisplay}</p>
                              <p className="text-yellow-300 text-[10px] font-semibold">+{quiz.points_reward || 50}</p>
                            </div>
                            {isRandom && (
                              <div className="mt-0.5">
                                <span className="text-[8px] bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded">
                                  🎲 Random
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {subjectQuizzes.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-white/40 text-xs text-center">No quizzes available</p>
                        </div>
                      )}
                      {subjectQuizzes.length > 3 && (
                        <p className="text-white/60 text-[10px] text-center font-medium pt-1">
                          +{subjectQuizzes.length - 3} more quizzes
                        </p>
                      )}
                    </div>
                    <p className="text-white/40 text-[10px] text-center mt-2 flex-shrink-0">Click to browse →</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Quiz List Dialog */}
      {activeSubject && !selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeDialog}>
          <div 
            className={`w-full max-w-2xl rounded-2xl shadow-2xl transition-all duration-300 border-2 ${
              isDarkMode 
                ? 'bg-slate-800/95 border-teal-400' 
                : 'bg-white border-teal-500'
            } ${isClosing ? 'animate-scaleDown' : 'animate-scaleUp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-6 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-teal-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-500 shadow-lg">
                    <span className="text-3xl">{activeSubject.icon}</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                      {activeSubject.name}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                      {currentSubjectQuizzes.length} quizzes available
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeDialog} 
                  className={`text-2xl transition-colors ${
                    isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Quiz List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2">
              {currentSubjectQuizzes.map((quiz, idx) => {
                const totalQuestions = getTotalQuestions(quiz);
                const isRandom = isRandomQuiz(quiz);
                const timeEstimate = Math.ceil((quiz.random_selection ? (quiz.questions_per_attempt || 20) : totalQuestions) * 0.5);
                
                return (
                  <button
                    key={quiz.id}
                    onClick={() => handleQuizClick(quiz)}
                    className={`w-full text-left p-4 rounded-xl transition-all hover:scale-[1.02] border-2 ${
                      isDarkMode 
                        ? 'bg-slate-900/50 border-slate-700 hover:border-teal-500/30 hover:bg-slate-800/50' 
                        : 'bg-white border-gray-200 hover:border-teal-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500 text-white'
                        }`}>
                          {idx + 1}
                        </div>
                        <h4 className={`font-semibold text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {quiz.title}
                        </h4>
                        {isRandom && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                            Random
                          </span>
                        )}
                      </div>
                      <span className="text-teal-500 text-lg">→</span>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-11">
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span>📝</span>
                        <span>{isRandom ? `${quiz.questions_per_attempt || 20}/${totalQuestions}` : totalQuestions}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span>⏱️</span>
                        <span>{timeEstimate} min</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-semibold ${
                        isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700'
                      }`}>
                        <span>💎</span>
                        <span>+{quiz.points_reward || 50}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {currentSubjectQuizzes.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    No quizzes available for this subject
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <button
                onClick={closeDialog}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
                  isDarkMode 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Quiz Dialog */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeQuizDialog}>
          <div 
            className={`w-full max-w-md rounded-2xl shadow-2xl transition-all duration-300 border-2 animate-scaleUp ${
              isDarkMode 
                ? 'bg-slate-800/95 border-teal-400' 
                : 'bg-white border-teal-500'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-2xl"></div>
              <div className="relative p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-1">{selectedQuiz.title}</h3>
                {selectedQuiz.class_level && (
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                    <span>{getLevelDisplayName(selectedQuiz.class_level)}</span>
                  </div>
                )}
                {selectedQuiz.quiz_level && (
                  <div className={`inline-flex items-center gap-1 mt-1 px-3 py-0.5 rounded-full text-white text-xs font-bold ${GAME_LEVEL_COLORS[selectedQuiz.quiz_level] || 'bg-teal-500'}`}>
                    <span>Level {selectedQuiz.quiz_level} — {GAME_LEVEL_LABELS[(selectedQuiz.quiz_level || 1) - 1]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className={`text-center p-3 rounded-xl ${
                  isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl mb-1">📝</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {getTotalQuestions(selectedQuiz)}
                  </div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                
                <div className={`text-center p-3 rounded-xl ${
                  isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl mb-1">💎</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    +{selectedQuiz.points_reward || 50}
                  </div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
                
                <div className={`text-center p-3 rounded-xl ${
                  isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {Math.ceil(getTotalQuestions(selectedQuiz) * 0.5)}
                  </div>
                  <div className="text-xs text-gray-500">Minutes</div>
                </div>
              </div>

              {/* Random Quiz Info */}
              {isRandomQuiz(selectedQuiz) && (
                <div className={`mb-4 p-3 rounded-xl text-center border ${
                  isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🎲</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Random {selectedQuiz.questions_per_attempt || 20} of {getTotalQuestions(selectedQuiz)} questions
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedQuiz.description && (
                <div 
                  className={`mb-6 p-3 rounded-xl text-sm leading-relaxed ${
                    isDarkMode ? 'bg-slate-900/50 text-slate-300' : 'bg-gray-50 text-gray-600'
                  }`}
                  dangerouslySetInnerHTML={{ __html: selectedQuiz.description }}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeQuizDialog}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                    isDarkMode 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartQuiz(selectedQuiz)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Start Quiz →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        .perspective {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleDown {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.95); opacity: 0; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.25s ease-out forwards;
        }
        .animate-scaleDown {
          animation: scaleDown 0.2s ease-in forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(20,184,166,0.3)'};
          border-radius: 10px;
        }
        .ml-11 {
          margin-left: 2.75rem;
        }
      `}</style>
    </div>
  );
};

export default SecondaryQuizPage;