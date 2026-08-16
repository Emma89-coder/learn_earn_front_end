import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
// Import all images
import mapImage from '../../assets/images/map.png';
import learnerImage from '../../assets/images/learner.png';
import scienceImage from '../../assets/images/science.png';
import basketImage from '../../assets/images/basket.png';
import mathsImage from '../../assets/images/maths.png';
import chichewaImage from '../../assets/images/chichewa.png';

// Helper function to render formatted text
const renderFormattedText = (text) => {
  if (!text) return '';
  
  let formatted = text
    .replace(/__(.*?)__/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/\n/g, '<br/>');
  
  return formatted;
};

// Only Standards 5-8
const LEVELS = [
  { id: 'standard-5', name: 'Standard 5', icon: '🎓' },
  { id: 'standard-6', name: 'Standard 6', icon: '🏆' },
  { id: 'standard-7', name: 'Standard 7', icon: '🎯' },
  { id: 'standard-8', name: 'Standard 8', icon: '⚡' }
];

const QuizPage = () => {
  const navigate = useNavigate();
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
    current_level: 'standard-5',
    class_level: 'standard-5',
    completed_levels: [],
    unlocked_levels: ['standard-5'],
    locked_levels: ['standard-6', 'standard-7', 'standard-8'],
    all_levels: ['standard-5', 'standard-6', 'standard-7', 'standard-8']
  });
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [currentLearnerLevel, setCurrentLearnerLevel] = useState('standard-5');

  const subjects = [
    { id: 'social-studies', name: 'SOCIAL STUDIES', icon: '🌍📖', iconBg: 'bg-emerald-500', combined: true },
    { id: 'english', name: 'ENGLISH', icon: '📚', iconBg: 'bg-blue-500' },
    { id: 'primary-science', name: 'PRIMARY SCIENCE', icon: '🔬', iconBg: 'bg-purple-500' },
    { id: 'arts-life-skills', name: 'ARTS & LIFE SKILLS', icon: '🎨', iconBg: 'bg-orange-500' },
    { id: 'mathematics', name: 'MATHEMATICS', icon: '🔢', iconBg: 'bg-indigo-500' },
    { id: 'chichewa', name: 'CHICHEWA', icon: '🇲🇼', iconBg: 'bg-green-500' }
  ];

  useEffect(() => {
    fetchQuizzes();
    fetchLearnerProgress();
  }, []);

  const fetchLearnerProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No token found, using default progress');
        setIsLoadingProgress(false);
        return;
      }

      // Try the main endpoint
      const response = await axios.get(`${API_URL}/api/learner/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const progressData = response.data.progress;
        setLearnerProgress(progressData);
        setCurrentLearnerLevel(progressData.current_level || 'standard-5');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      
      // Handle different error types
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 404) {
          console.warn('Progress endpoint not found. Using default values.');
        } else if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/learner-login');
        } else if (error.response.status === 400) {
          console.warn('Bad request. Using default values.');
        }
      } else if (error.request) {
        console.warn('No response from server. Using default values.');
      }
      
      // Use default progress values
      setLearnerProgress({
        current_level: 'standard-5',
        class_level: 'standard-5',
        completed_levels: [],
        unlocked_levels: ['standard-5'],
        locked_levels: ['standard-6', 'standard-7', 'standard-8'],
        all_levels: ['standard-5', 'standard-6', 'standard-7', 'standard-8']
      });
      setCurrentLearnerLevel('standard-5');
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
          setCurrentLearnerLevel(response.data.learner_progress.current_level || 'standard-5');
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
    let filtered = [];
    if (subjectId === 'social-studies') {
      const socialQuizzes = quizzes.filter(quiz => quiz.topic === 'social-studies');
      const bibleQuizzes = quizzes.filter(quiz => quiz.topic === 'bible-knowledge');
      filtered = [...socialQuizzes, ...bibleQuizzes];
    } else {
      filtered = quizzes.filter(quiz => quiz.topic === subjectId);
    }
    
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

  if (loading || isLoadingProgress) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-darkblue-950' : 'bg-ice-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>
            {isLoadingProgress ? 'Loading progress...' : 'Loading quizzes...'}
          </p>
        </div>
      </div>
    );
  }

  const currentSubjectQuizzes = activeSubject ? getQuizzesBySubject(activeSubject.id) : [];

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-all duration-500 ${
      isDarkMode ? 'bg-darkblue-950' : 'bg-ice-50'
    }`}>
      
      {/* Header */}
      <header className="flex-shrink-0 z-50 shadow-md transition-all duration-300" style={{ backgroundColor: '#daf2f5' }}>
        <div className="max-w-5xl mx-auto px-3 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/learner-dashboard')}>
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg">📚</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-darkblue-900">
                  Quiz <span className="text-teal-500">Hub</span>
                </h1>
                <p className="text-[11px] text-darkblue-600">
                  Choose your subject
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded-lg transition ${
                  isSoundEnabled 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-slate-500/20 text-slate-600'
                }`}
              >
                {isSoundEnabled ? '🔊' : '🔇'}
              </button>
              <button
                onClick={toggleTheme}
                className={`p-1.5 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-darkblue-800 text-yellow-400' 
                    : 'bg-teal-100 text-darkblue-600'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => navigate('/learner-dashboard')}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-teal-500 text-white hover:bg-teal-600 transition"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full px-3 py-2">
        
        {/* Welcome Section */}
        <div className="text-center mb-3 flex-shrink-0">
          <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-darkblue-900'}`}>
            Explore Subjects
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>
            Hover to see available quizzes
          </p>
          {learnerProgress && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-full">
              <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                📚 Level: {getLevelDisplayName(learnerProgress.current_level)}
              </span>
            </div>
          )}
        </div>

        {/* Subject Grid with Flip Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 overflow-y-auto pb-2">
          {subjects.map((subject) => {
            const subjectQuizzes = getQuizzesBySubject(subject.id);
            const totalReward = subjectQuizzes.reduce((sum, q) => sum + (q.points_reward || 50), 0);
            const isFlipped = flippedCardId === subject.id;
            
            return (
              <div
                key={subject.id}
                className="relative cursor-pointer perspective group"
                style={{ height: '200px' }}
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
                  <div className="absolute inset-0 backface-hidden rounded-lg bg-teal-500 p-3 flex flex-col border border-teal-400/50 shadow-md overflow-hidden">
                    
                    {subject.id === 'social-studies' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={mapImage}
                            alt="Malawi Map"
                            className="w-auto h-full max-h-[145px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[10px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="text-white font-black text-sm tracking-wider">
                            SOCIAL STUDIES
                          </div>
                          <div className="text-yellow-300 font-bold text-xs">
                            50 points
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'english' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={learnerImage}
                            alt="English Learning"
                            className="w-auto h-full max-h-[145px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[10px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="text-white font-black text-sm tracking-wider">
                            ENGLISH
                          </div>
                          <div className="text-yellow-300 font-bold text-xs">
                            {totalReward} pts
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'primary-science' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={scienceImage}
                            alt="Primary Science"
                            className="w-auto h-full max-h-[145px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[10px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="text-white font-black text-sm tracking-wider">
                            PRIMARY SCIENCE
                          </div>
                          <div className="text-yellow-300 font-bold text-xs">
                            {totalReward} pts
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'arts-life-skills' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={basketImage}
                            alt="Arts & Life Skills"
                            className="w-auto h-full max-h-[145px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[10px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="text-white font-black text-sm tracking-wider">
                            ARTS & LIFE SKILLS
                          </div>
                          <div className="text-yellow-300 font-bold text-xs">
                            {totalReward} pts
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'mathematics' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={mathsImage}
                            alt="Mathematics"
                            className="w-auto h-full max-h-[145px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[10px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="text-white font-black text-sm tracking-wider">
                            MATHEMATICS
                          </div>
                          <div className="text-yellow-300 font-bold text-xs">
                            {totalReward} pts
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'chichewa' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={chichewaImage}
                            alt="Chichewa"
                            className="w-auto h-full max-h-[145px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[10px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="text-white font-black text-sm tracking-wider">
                            CHICHEWA
                          </div>
                          <div className="text-yellow-300 font-bold text-xs">
                            {totalReward} pts
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-center mb-2 flex-shrink-0">
                          <span className="text-5xl transform hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                            {subject.icon}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center text-center min-h-0">
                          <h3 className="text-white font-bold text-base tracking-tight mb-1 leading-tight">
                            {subject.name}
                          </h3>
                          {subject.combined && (
                            <div className="text-white/70 text-[10px]">
                              Social Studies + Bible
                            </div>
                          )}
                          <div className="mt-2 text-yellow-300 text-sm font-semibold">
                            +{totalReward} pts
                          </div>
                        </div>
                        <div className="text-center mt-1 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-[11px] font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-teal-600 p-3 flex flex-col rounded-lg border border-teal-500/50 shadow-md overflow-hidden">
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
            className={`w-full max-w-2xl rounded-2xl shadow-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            } ${isClosing ? 'animate-scaleDown' : 'animate-scaleUp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-teal-500 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    {activeSubject.id === 'social-studies' ? (
                      <img src={mapImage} alt="" className="w-8 h-8 object-contain" />
                    ) : activeSubject.id === 'english' ? (
                      <img src={learnerImage} alt="" className="w-8 h-8 object-contain" />
                    ) : activeSubject.id === 'primary-science' ? (
                      <img src={scienceImage} alt="" className="w-8 h-8 object-contain" />
                    ) : activeSubject.id === 'arts-life-skills' ? (
                      <img src={basketImage} alt="" className="w-8 h-8 object-contain" />
                    ) : activeSubject.id === 'mathematics' ? (
                      <img src={mathsImage} alt="" className="w-8 h-8 object-contain" />
                    ) : activeSubject.id === 'chichewa' ? (
                      <img src={chichewaImage} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-2xl">{activeSubject.icon}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">{activeSubject.name}</h3>
                    <p className="text-white/70 text-sm">{currentSubjectQuizzes.length} quizzes available</p>
                  </div>
                </div>
                <button onClick={closeDialog} className="text-white/80 hover:text-white transition text-2xl">
                  ×
                </button>
              </div>
            </div>

            {/* Quiz List */}
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="space-y-2">
                {currentSubjectQuizzes.map((quiz, idx) => {
                  const totalQuestions = getTotalQuestions(quiz);
                  const isRandom = isRandomQuiz(quiz);
                  const timeEstimate = Math.ceil((quiz.random_selection ? (quiz.questions_per_attempt || 20) : totalQuestions) * 0.5);
                  
                  return (
                    <button
                      key={quiz.id}
                      onClick={() => handleQuizClick(quiz)}
                      className={`w-full text-left p-4 rounded-xl transition-all hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
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
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                              Random
                            </span>
                          )}
                        </div>
                        <span className="text-teal-500 text-lg">→</span>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-11">
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          <span>📝</span>
                          <span>{isRandom ? `${quiz.questions_per_attempt || 20}/${totalQuestions}` : totalQuestions}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
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
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <button
                onClick={closeDialog}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Start Quiz Dialog */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeQuizDialog}>
          <div 
            className={`w-full max-w-md rounded-2xl shadow-2xl transition-all duration-300 animate-scaleUp ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 rounded-t-2xl"></div>
              <div className="relative p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-1">{selectedQuiz.title}</h3>
                {selectedQuiz.class_level && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">
                    <span>{getLevelDisplayName(selectedQuiz.class_level)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className={`text-center p-3 rounded-xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl mb-1">📝</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {getTotalQuestions(selectedQuiz)}
                  </div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                
                <div className={`text-center p-3 rounded-xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl mb-1">💎</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    +{selectedQuiz.points_reward || 50}
                  </div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
                
                <div className={`text-center p-3 rounded-xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
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
                <div className={`mb-4 p-3 rounded-xl text-center ${
                  isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
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
                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(selectedQuiz.description) }}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeQuizDialog}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                    isDarkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartQuiz(selectedQuiz)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition transform hover:scale-[1.02]"
                >
                  Start Quiz →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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

export default QuizPage;