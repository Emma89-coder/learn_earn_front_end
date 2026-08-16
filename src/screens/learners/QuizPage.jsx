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

const GAME_LEVEL_COLORS = {
  1:'bg-green-400', 2:'bg-green-500', 3:'bg-teal-400', 4:'bg-teal-500',
  5:'bg-blue-400',  6:'bg-blue-500',  7:'bg-purple-400',8:'bg-purple-500',
  9:'bg-orange-500',10:'bg-red-500',
};
const GAME_LEVEL_LABELS = [
  'Starter','Explorer','Thinker','Achiever','Scholar',
  'Expert','Master','Elite','Legend','Champion',
];

const QuizPage = () => {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flippedCardId, setFlippedCardId] = useState(null);
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
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
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

  if (loading && quizzes.length === 0 && !isLoadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-300">
            Loading quizzes...
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
        background: 'linear-gradient(135deg, #ecfef8 0%, #dff8f2 45%, #ccf5eb 100%)',
        color: '#075351',
        fontFamily: 'Calibri, "Segoe UI", "Trebuchet MS", sans-serif',
      }}
    >
      
      {/* Header - Ice-white text on dark background */}
      <header className="shadow-[0_20px_45px_-22px_rgba(7,83,81,0.55)] border-b border-white/10 sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #075351 0%, #0a6a67 100%)', color: '#f7fbff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
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
                  <h1 className="text-2xl font-black tracking-tighter" style={{ fontFamily: 'Calibri, "Segoe UI", "Trebuchet MS", sans-serif', color: '#f7fbff' }}>
                    LearnEarn
                  </h1>
                  <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#f7fbff' }}>Quiz Hub</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSound}
                  className={`px-3 py-2 rounded-lg text-base font-medium transition-all ${
                    isSoundEnabled 
                      ? 'bg-teal-500 text-[#f7fbff] shadow-lg' 
                      : 'bg-white/10 text-[#f7fbff]/70 hover:bg-white/20'
                  }`}
                  title={isSoundEnabled ? 'Sound On' : 'Sound Off'}
                >
                  {isSoundEnabled ? 'Sound On' : 'Sound Off'}
                </button>
                <button
                  onClick={() => navigate('/learner-dashboard')}
                  className="px-4 py-2 rounded-lg text-base font-medium bg-teal-500 text-[#f7fbff] hover:bg-teal-600 transition shadow-md"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar - All ice-white text */}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: '#ffffff' }}>Quizzes</p>
              <p className="text-base font-bold" style={{ color: '#f7fbff' }}>{totalQuizzes}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: '#f7fbff' }}>Level</p>
              <p className="text-base font-bold" style={{ color: '#f7fbff' }}>{getLevelDisplayName(learnerProgress.current_level) || 'Standard 5'}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: '#f7fbff' }}>Progress</p>
              <p className="text-base font-bold" style={{ color: '#f7fbff' }}>{learnerProgress.completed_levels?.length || 0}/{LEVELS.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: '#f7fbff' }}>Subjects</p>
              <p className="text-base font-bold" style={{ color: '#f7fbff' }}>{subjects.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6">
        <div className="sticky top-[118px] z-40 mb-6 -mt-[1px] overflow-hidden rounded-b-[42px] rounded-t-none border-x border-b border-[#d7eee7] bg-[linear-gradient(180deg,#ffffff_0%,#f9fffd_100%)] px-6 py-5 shadow-[0_18px_45px_-28px_rgba(7,83,81,0.55)] sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[34px] leading-[1] font-black uppercase tracking-[0.06em] text-[#0b6a67]" style={{ fontFamily: '"Segoe UI", Calibri, "Trebuchet MS", sans-serif' }}>
                Explore Subjects
              </h2>
              <p className="mt-3 text-sm text-[#2f6b64] sm:text-base">
                Hover or tap a subject to preview quizzes and start learning.
              </p>
            </div>
            <div className="inline-flex h-10 items-center rounded-full border border-[#cde5df] bg-[linear-gradient(180deg,#f5fbff_0%,#eaf4f8_100%)] px-5 text-sm font-bold text-[#0a6663] shadow-[0_8px_18px_-12px_rgba(7,83,81,0.45)]">
              {totalQuizzes} ready-to-play quizzes
            </div>
          </div>
        </div>

        {/* Subject Grid with Flip Cards - Ice-white text on cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const subjectQuizzes = getQuizzesBySubject(subject.id);
            const totalReward = subjectQuizzes.reduce((sum, q) => sum + (q.points_reward || 50), 0);
            const isFlipped = flippedCardId === subject.id;
            
            return (
              <div
                key={subject.id}
                className="relative h-[235px] cursor-pointer perspective group"
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
                  
                  {/* Front Side - Teal themed with ice-white text */}
                  <div className="absolute inset-0 backface-hidden rounded-[30px] border border-white/20 bg-gradient-to-br from-[#0f766e] via-[#0e9488] to-[#14b8a6] p-4 flex flex-col shadow-[0_20px_45px_-20px_rgba(7,83,81,0.6)] overflow-hidden">
                    
                    {subject.id === 'social-studies' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={mapImage}
                            alt="Malawi Map"
                            className="w-auto h-full max-h-[160px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="font-black text-base tracking-wider" style={{ color: '#f7fbff' }}>
                            SOCIAL STUDIES
                          </div>
                          <div className="text-yellow-300 font-bold text-sm">
                            +{totalReward}
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'english' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={learnerImage}
                            alt="English Learning"
                            className="w-auto h-full max-h-[160px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="font-black text-base tracking-wider" style={{ color: '#f7fbff' }}>
                            ENGLISH
                          </div>
                          <div className="text-yellow-300 font-bold text-sm">
                            +{totalReward}
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'primary-science' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={scienceImage}
                            alt="Primary Science"
                            className="w-auto h-full max-h-[160px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="font-black text-base tracking-wider" style={{ color: '#f7fbff' }}>
                            PRIMARY SCIENCE
                          </div>
                          <div className="text-yellow-300 font-bold text-sm">
                            +{totalReward}
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'arts-life-skills' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={basketImage}
                            alt="Arts & Life Skills"
                            className="w-auto h-full max-h-[160px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="font-black text-base tracking-wider" style={{ color: '#f7fbff' }}>
                            ARTS & LIFE SKILLS
                          </div>
                          <div className="text-yellow-300 font-bold text-sm">
                            +{totalReward}
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'mathematics' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={mathsImage}
                            alt="Mathematics"
                            className="w-auto h-full max-h-[160px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="font-black text-base tracking-wider" style={{ color: '#f7fbff' }}>
                            MATHEMATICS
                          </div>
                          <div className="text-yellow-300 font-bold text-sm">
                            +{totalReward}
                          </div>
                        </div>
                      </>
                    ) : subject.id === 'chichewa' ? (
                      <>
                        <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                          <img 
                            src={chichewaImage}
                            alt="Chichewa"
                            className="w-auto h-full max-h-[160px] object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-0 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                          <div className="font-black text-base tracking-wider" style={{ color: '#f7fbff' }}>
                            CHICHEWA
                          </div>
                          <div className="text-yellow-300 font-bold text-sm">
                            +{totalReward}
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
                          <h3 className="font-bold text-base tracking-tight mb-1 leading-tight" style={{ color: '#f7fbff', fontFamily: '"Segoe UI", Calibri, "Trebuchet MS", sans-serif' }}>
                            {subject.name}
                          </h3>
                          {subject.combined && (
                            <div className="text-sm" style={{ color: '#f7fbff' }}>
                              Social Studies + Bible
                            </div>
                          )}
                          <div className="mt-2 text-yellow-300 text-sm font-semibold">
                            +{totalReward} pts
                          </div>
                        </div>
                        <div className="text-center mt-1 flex-shrink-0">
                          <div className="bg-white/20 rounded-full px-2 py-0.5 inline-block">
                            <span className="text-white text-sm font-semibold">{subjectQuizzes.length} quizzes</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Back Side - Dark teal with ice-white text */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[30px] border border-white/10 bg-gradient-to-br from-[#0a4d4a] via-[#0e6e69] to-[#0f766e] p-4 flex flex-col shadow-[0_20px_45px_-20px_rgba(7,83,81,0.65)] overflow-hidden">
                    <h3 className="font-bold text-base mb-2 text-center flex-shrink-0" style={{ color: '#f7fbff' }}>Available Quizzes</h3>
                    
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
                            <p className="text-sm font-semibold truncate flex items-center gap-1" style={{ color: '#f7fbff' }}>
                              {quiz.title}
                            </p>
                            <div className="flex justify-between items-center mt-0.5">
                              <p className="text-sm" style={{ color: '#f7fbff' }}>{questionsDisplay}</p>
                              <p className="text-yellow-300 text-sm font-semibold">+{quiz.points_reward || 50}</p>
                            </div>
                            {isRandom && (
                              <div className="mt-0.5">
                                <span className="text-xs bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded">
                                  🎲 Random
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {subjectQuizzes.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-xs text-center" style={{ color: '#f7fbff' }}>No quizzes available</p>
                        </div>
                      )}
                      {subjectQuizzes.length > 3 && (
                        <p className="text-sm text-center font-medium pt-1" style={{ color: '#f7fbff' }}>
                          +{subjectQuizzes.length - 3} more quizzes
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-center mt-2 flex-shrink-0" style={{ color: '#f7fbff' }}>Click to browse →</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Quiz List Dialog - Ice-white text on dark surfaces */}
      {activeSubject && !selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeDialog}>
          <div 
            className={`w-full max-w-2xl overflow-hidden rounded-[32px] shadow-[0_30px_80px_-24px_rgba(2,24,38,0.35)] transition-all duration-300 border border-teal-300 bg-white backdrop-blur-xl ${isClosing ? 'animate-scaleDown' : 'animate-scaleUp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - with ice-white text */}
            <div className="p-6 border-b border-teal-200 bg-gradient-to-r from-[#f2fdf9] via-[#f9fffe] to-[#eefbf7]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-500 shadow-lg">
                    {activeSubject.id === 'social-studies' ? (
                      <img src={mapImage} alt="" className="w-10 h-10 object-contain" />
                    ) : activeSubject.id === 'english' ? (
                      <img src={learnerImage} alt="" className="w-10 h-10 object-contain" />
                    ) : activeSubject.id === 'primary-science' ? (
                      <img src={scienceImage} alt="" className="w-10 h-10 object-contain" />
                    ) : activeSubject.id === 'arts-life-skills' ? (
                      <img src={basketImage} alt="" className="w-10 h-10 object-contain" />
                    ) : activeSubject.id === 'mathematics' ? (
                      <img src={mathsImage} alt="" className="w-10 h-10 object-contain" />
                    ) : activeSubject.id === 'chichewa' ? (
                      <img src={chichewaImage} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-3xl">{activeSubject.icon}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: '#075351', fontFamily: '"Segoe UI", Calibri, "Trebuchet MS", sans-serif' }}>
                      {activeSubject.name}
                    </h3>
                    <p className="text-sm" style={{ color: '#2f6b64' }}>
                      {currentSubjectQuizzes.length} quizzes available
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeDialog} 
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dff6ef] text-2xl transition-colors hover:bg-[#ccefe2]" style={{ color: '#0f766e' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Quiz List - Ice-white text */}
            <div className="p-5 sm:p-6 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2" style={{ color: '#075351' }}>
              {currentSubjectQuizzes.map((quiz, idx) => {
                const totalQuestions = getTotalQuestions(quiz);
                const isRandom = isRandomQuiz(quiz);
                const timeEstimate = Math.ceil((quiz.random_selection ? (quiz.questions_per_attempt || 20) : totalQuestions) * 0.5);
                
                return (
                  <button
                    key={quiz.id}
                    onClick={() => handleQuizClick(quiz)}
                    className="w-full text-left p-4 rounded-[20px] transition-all hover:scale-[1.01] bg-white hover:bg-[#f4fbf8] border border-teal-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-[#dff6ef] text-[#0f766e]">
                          {idx + 1}
                        </div>
                        <h4 className="font-semibold text-base" style={{ color: '#075351', fontFamily: '"Segoe UI", Calibri, "Trebuchet MS", sans-serif' }}>
                          {quiz.title}
                        </h4>
                        {isRandom && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dbeafe] text-[#1d4ed8] border border-blue-200">
                            Random
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-[#0f766e]">Open</span>
                    </div>
                    
                    <div className="flex items-center gap-3 ml-11">
                      <div className="text-xs px-2 py-1 rounded bg-[#0f766e] text-[#f7fbff]">
                        {isRandom ? `${quiz.questions_per_attempt || 20}/${totalQuestions}` : totalQuestions}
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-[#0f766e] text-[#f7fbff]">
                        {timeEstimate} min
                      </div>
                      <div className="text-xs px-2 py-1 rounded font-semibold bg-[#dff6ef] text-[#0f766e]">
                        +{quiz.points_reward || 50}
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {currentSubjectQuizzes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: '#2f6b64' }}>
                    No quizzes available for this subject
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-teal-200 bg-[#f6fdfb]">
              <button
                onClick={closeDialog}
                className="w-full py-2.75 rounded-[16px] text-sm font-medium transition bg-[#dff6ef] text-[#075351] hover:bg-[#ccefe2]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Quiz Dialog - Ice-white text on dark surfaces */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeQuizDialog}>
          <div 
            className="w-full max-w-md rounded-[28px] shadow-[0_30px_80px_-24px_rgba(2,24,38,0.35)] transition-all duration-300 border border-teal-200/70 animate-scaleUp bg-white/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Section - with ice-white text */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-2xl"></div>
              <div className="relative p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="font-bold text-xl mb-1" style={{ color: '#075351', fontFamily: '"Segoe UI", Calibri, "Trebuchet MS", sans-serif' }}>{selectedQuiz.title}</h3>
                {selectedQuiz.class_level && (
                  <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/30 text-xs font-medium" style={{ color: '#075351' }}>
                    <span>{getLevelDisplayName(selectedQuiz.class_level)}</span>
                  </div>
                )}
                {selectedQuiz.quiz_level && (
                  <div className={`inline-flex items-center gap-1 mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${GAME_LEVEL_COLORS[selectedQuiz.quiz_level] || 'bg-teal-500'}`} style={{ color: '#f7fbff' }}>
                    <span>Level {selectedQuiz.quiz_level} — {GAME_LEVEL_LABELS[(selectedQuiz.quiz_level || 1) - 1]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content - Ice-white text */}
            <div className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 rounded-xl border border-teal-100 bg-[#f7fbff]">
                  <div className="text-lg font-bold" style={{ color: '#075351' }}>
                    {getTotalQuestions(selectedQuiz)}
                  </div>
                  <div className="text-xs" style={{ color: '#2f6b64' }}>Questions</div>
                </div>
                
                <div className="text-center p-3 rounded-xl border border-teal-100 bg-[#f7fbff]">
                  <div className="text-lg font-bold" style={{ color: '#075351' }}>
                    +{selectedQuiz.points_reward || 50}
                  </div>
                  <div className="text-xs" style={{ color: '#2f6b64' }}>Points</div>
                </div>
                
                <div className="text-center p-3 rounded-xl border border-teal-100 bg-[#f7fbff]">
                  <div className="text-lg font-bold" style={{ color: '#075351' }}>
                    {Math.ceil(getTotalQuestions(selectedQuiz) * 0.5)}
                  </div>
                  <div className="text-xs" style={{ color: '#2f6b64' }}>Minutes</div>
                </div>
              </div>

              {/* Random Quiz Info */}
              {isRandomQuiz(selectedQuiz) && (
                <div className="mb-4 p-3 rounded-xl text-center border bg-blue-500/10 border-blue-500/20">
                  <span className="text-sm font-medium" style={{ color: '#f7fbff' }}>
                    Random {selectedQuiz.questions_per_attempt || 20} of {getTotalQuestions(selectedQuiz)} questions
                  </span>
                </div>
              )}

              {/* Description */}
              {selectedQuiz.description && (
                <div 
                  className="mb-6 p-3 rounded-xl text-sm leading-relaxed bg-[#f7fbff] border border-teal-100"
                  style={{ color: '#075351' }}
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(selectedQuiz.description) }}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeQuizDialog}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition bg-[#eaf8f4] text-[#075351] hover:bg-[#d7f2ea]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartQuiz(selectedQuiz)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#0f766e] to-[#0b5f5a] text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                >
                  Start Quiz
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
          background: rgba(15,118,110,0.22);
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