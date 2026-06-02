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

const QuizPage = () => {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
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

  const subjects = [
    { id: 'social-studies', name: 'SOCIAL STUDIES', icon: '🌍📖', iconBg: 'from-emerald-500 to-teal-500', combined: true },
    { id: 'english', name: 'ENGLISH', icon: '📚', iconBg: 'from-blue-500 to-cyan-500' },
    { id: 'primary-science', name: 'PRIMARY SCIENCE', icon: '🔬', iconBg: 'from-purple-500 to-pink-500' },
    { id: 'arts-life-skills', name: 'ARTS & LIFE SKILLS', icon: '🎨', iconBg: 'from-orange-500 to-red-500' },
    { id: 'mathematics', name: 'MATHEMATICS', icon: '🔢', iconBg: 'from-indigo-500 to-blue-500' },
    { id: 'chichewa', name: 'CHICHEWA', icon: '🇲🇼', iconBg: 'from-green-500 to-emerald-500' }
  ];

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/learner/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getQuizzesBySubject = (subjectId) => {
    if (subjectId === 'social-studies') {
      const socialQuizzes = quizzes.filter(quiz => quiz.topic === 'social-studies');
      const bibleQuizzes = quizzes.filter(quiz => quiz.topic === 'bible-knowledge');
      return [...socialQuizzes, ...bibleQuizzes];
    }
    return quizzes.filter(quiz => quiz.topic === subjectId);
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
    setIsMaximized(false);
    setExpandedQuiz(null);
  };

  const closeDialog = () => {
    stopSpeech();
    setIsClosing(true);
    setTimeout(() => {
      setActiveSubject(null);
      setIsClosing(false);
      setIsMaximized(false);
      setExpandedQuiz(null);
      setFlippedCardId(null);
    }, 300);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    setExpandedQuiz(null);
  };

  const toggleQuizExpand = (quizId) => {
    setExpandedQuiz(prev => (prev === quizId ? null : quizId));
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-darkblue-950' : 'bg-ice-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>Loading quizzes...</p>
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
        <div className="text-center mb-2 flex-shrink-0">
          <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-darkblue-900'}`}>
            Explore Subjects
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>
            Hover to see available quizzes
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 flex-1 overflow-hidden">
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
                      {subjectQuizzes.slice(0, 3).map((quiz) => (
                        <div 
                          key={quiz.id} 
                          className="bg-white/10 rounded-md p-1.5 hover:bg-white/20 transition cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTileClick(subject);
                            setTimeout(() => toggleQuizExpand(quiz.id), 350);
                          }}
                        >
                          <p className="text-white text-xs font-semibold truncate">{quiz.title}</p>
                          <div className="flex justify-between items-center mt-0.5">
                            <p className="text-white/60 text-[10px]">📝 {quiz.questions?.length || 0} items</p>
                            <p className="text-yellow-300 text-[10px] font-semibold">+{quiz.points_reward || 50}</p>
                          </div>
                        </div>
                      ))}
                      {subjectQuizzes.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-white/40 text-xs text-center">No quizzes yet</p>
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

      {/* Cleaner, Smaller Quiz Modal with Solid Teal Header */}
      {activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={closeDialog}>
          <div 
            className={`transition-all duration-300 ${
              isMaximized 
                ? 'w-full h-full max-w-none max-h-none rounded-none' 
                : 'w-full max-w-2xl rounded-2xl'
            } ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl flex flex-col ${isClosing ? 'animate-scaleDown' : 'animate-scaleUp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Solid Teal */}
            <div className="bg-teal-500 rounded-t-2xl">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg">
                      {activeSubject.id === 'social-studies' ? (
                        <img src={mapImage} alt={activeSubject.name} className="w-8 h-8 object-contain" />
                      ) : activeSubject.id === 'english' ? (
                        <img src={learnerImage} alt={activeSubject.name} className="w-8 h-8 object-contain" />
                      ) : activeSubject.id === 'primary-science' ? (
                        <img src={scienceImage} alt={activeSubject.name} className="w-8 h-8 object-contain" />
                      ) : activeSubject.id === 'arts-life-skills' ? (
                        <img src={basketImage} alt={activeSubject.name} className="w-8 h-8 object-contain" />
                      ) : activeSubject.id === 'mathematics' ? (
                        <img src={mathsImage} alt={activeSubject.name} className="w-8 h-8 object-contain" />
                      ) : activeSubject.id === 'chichewa' ? (
                        <img src={chichewaImage} alt={activeSubject.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span>{activeSubject.icon}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {activeSubject.name}
                      </h3>
                      <p className="text-white/80 text-xs mt-0.5">
                        {currentSubjectQuizzes.length} quizzes available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={toggleMaximize} 
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                    >
                      {isMaximized ? '📐' : '🗖'}
                    </button>
                    <button 
                      onClick={closeDialog} 
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz List - Clean and Compact */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isMaximized ? 'max-h-none' : 'max-h-[50vh]'}`}>
              {currentSubjectQuizzes.length > 0 ? (
                <div className="space-y-2.5">
                  {currentSubjectQuizzes.map((quiz, idx) => {
                    let questions = quiz.questions;
                    if (typeof questions === 'string') {
                      try { questions = JSON.parse(questions); } catch(e) { questions = []; }
                    }
                    const questionCount = questions?.length || 0;
                    const timeEstimate = Math.ceil(questionCount * 0.5);
                    
                    return (
                      <div 
                        key={quiz.id} 
                        className={`rounded-xl overflow-hidden transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-800/50 border border-gray-700' 
                            : 'bg-gray-50 border border-gray-200'
                        } ${expandedQuiz === quiz.id ? 'ring-1 ring-teal-500' : ''}`}
                      >
                        {/* Quiz Header */}
                        <button
                          onClick={() => toggleQuizExpand(quiz.id)}
                          className="w-full p-3 text-left transition-all hover:bg-teal-50 dark:hover:bg-gray-700/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500 text-white'
                                }`}>
                                  {idx + 1}
                                </div>
                                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                  {quiz.title}
                                </h4>
                              </div>
                              
                              {/* Stats Row */}
                              <div className="flex flex-wrap items-center gap-2 ml-8">
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  <span>📝</span>
                                  <span>{questionCount}</span>
                                </div>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  <span>⏱️</span>
                                  <span>{timeEstimate}m</span>
                                </div>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700'
                                }`}>
                                  <span>💎</span>
                                  <span>+{quiz.points_reward || 50}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expand Icon */}
                            <div className={`transition-transform duration-200 ${expandedQuiz === quiz.id ? 'rotate-180' : ''}`}>
                              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                        
                        {/* Expanded Content */}
                        {expandedQuiz === quiz.id && (
                          <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-100'}`}>
                            {quiz.image_url && (
                              <div className="mb-2 rounded-lg overflow-hidden">
                                <img src={quiz.image_url} alt={quiz.title} className="w-full h-24 object-cover" />
                              </div>
                            )}
                            
                            <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {quiz.description || 'Test your knowledge with this quiz!'}
                            </p>
                            
                            <div className="flex gap-2 mb-3">
                              <div className={`text-[10px] px-2 py-0.5 rounded-full ${
                                isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                🎯 Pass: 60%
                              </div>
                              <div className={`text-[10px] px-2 py-0.5 rounded-full ${
                                isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                              }`}>
                                ⚡ {quiz.difficulty || 'Medium'}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => navigate(`/quiz/${quiz.id}`)}
                              className="w-full py-2 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600 transition-all transform hover:scale-[1.02]"
                            >
                              Start Quiz →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-2">📭</div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No quizzes available
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-b-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">📚</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentSubjectQuizzes.length} quizzes
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">💎</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentSubjectQuizzes.reduce((sum, q) => sum + (q.points_reward || 50), 0)} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDialog}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-teal-500 text-white hover:bg-teal-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className={`flex-shrink-0 lg:hidden px-3 py-1.5 border-t backdrop-blur-lg ${
        isDarkMode 
          ? 'bg-darkblue-950/90 border-darkblue-800' 
          : 'bg-white/90 border-ice-200'
      }`}>
        <div className="flex justify-around items-center">
          <button onClick={() => navigate('/learner-dashboard')} className="flex flex-col items-center gap-0.5">
            <span className="text-lg">🏠</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>Home</span>
          </button>
          <button onClick={() => navigate('/quizzes')} className="flex flex-col items-center gap-0.5">
            <span className="text-lg">🎮</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>Quizzes</span>
          </button>
          <button onClick={() => navigate('/rewards')} className="flex flex-col items-center gap-0.5">
            <span className="text-lg">🎁</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>Store</span>
          </button>
          <button onClick={() => navigate('/leaderboard')} className="flex flex-col items-center gap-0.5">
            <span className="text-lg">🏆</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>Rank</span>
          </button>
        </div>
      </div>

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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleDown {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.95); opacity: 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
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
        .ml-8 {
          margin-left: 2rem;
        }
      `}</style>
    </div>
  );
};

export default QuizPage;