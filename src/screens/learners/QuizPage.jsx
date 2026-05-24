import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

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

  // All subjects - Social Studies and Bible Knowledge combined
  const subjects = [
    { id: 'social-studies', name: 'Social Studies & Bible', icon: '🌍📖', combined: true },
    { id: 'english', name: 'English', icon: '📚' },
    { id: 'primary-science', name: 'Primary Science', icon: '🔬' },
    { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '🎨' },
    { id: 'mathematics', name: 'Mathematics', icon: '🔢' },
    { id: 'chichewa', name: 'Chichewa', icon: '🇲🇼' }
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
    // For combined Social Studies & Bible, get quizzes from both topics
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
      <header className={`flex-shrink-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-darkblue-950/80 border-b border-darkblue-800' 
          : 'bg-white/80 border-b border-ice-200'
      }`}>
        <div className="max-w-5xl mx-auto px-3 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/learner-dashboard')}>
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-lg">📚</span>
              </div>
              <div>
                <h1 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-darkblue-900'}`}>
                  Quiz <span className="text-teal-500">Hub</span>
                </h1>
                <p className={`text-[11px] ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>
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
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {isSoundEnabled ? '🔊' : '🔇'}
              </button>
              <button
                onClick={toggleTheme}
                className={`p-1.5 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-darkblue-800 text-yellow-400' 
                    : 'bg-ice-100 text-darkblue-600'
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

        {/* Grid - Increased font sizes */}
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
                  
                  {/* Front Side - Teal Card */}
                  <div className="absolute inset-0 backface-hidden rounded-lg bg-teal-500 p-3 flex flex-col justify-between border border-teal-400/50 shadow-md">
                    {/* Top Section */}
                    <div className="flex justify-between items-start">
                      <span className="text-3xl">{subject.icon}</span>
                      <div className="bg-white/20 rounded-full px-2 py-0.5">
                        <span className="text-white text-[11px] font-semibold">{subjectQuizzes.length} quizzes</span>
                      </div>
                    </div>
                    
                    {/* Middle Section */}
                    <div className="flex-1 flex flex-col justify-center text-center">
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
                    
                    {/* Bottom Section */}
                    <div className="text-center h-2"></div>
                  </div>
                  
                  {/* Back Side - Teal Card (Darker) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-teal-600 p-3 flex flex-col rounded-lg border border-teal-500/50 shadow-md">
                    <h3 className="text-white font-bold text-sm mb-2 text-center">Available Quizzes</h3>
                    
                    <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
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
                    <p className="text-white/40 text-[10px] text-center mt-2">Click to browse →</p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Quiz Modal */}
      {activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkblue-950/80 backdrop-blur-sm animate-fadeIn" onClick={closeDialog}>
          <div 
            className={`transition-all duration-300 ${
              isMaximized 
                ? 'w-full h-full max-w-none max-h-none rounded-none' 
                : 'w-full max-w-2xl rounded-xl'
            } ${isDarkMode ? 'bg-darkblue-900 border border-darkblue-700' : 'bg-white shadow-2xl'} flex flex-col ${isClosing ? 'animate-scaleDown' : 'animate-scaleUp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-darkblue-700' : 'border-ice-200'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeSubject.icon}</span>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-darkblue-900'}`}>
                    {activeSubject.name} Quizzes
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>
                    {currentSubjectQuizzes.length} quizzes available
                  </p>
                  {activeSubject.combined && (
                    <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-ice-500' : 'text-darkblue-400'}`}>
                      Includes Social Studies & Bible Knowledge
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMaximize} 
                  className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-darkblue-800' : 'hover:bg-ice-100'}`}
                >
                  {isMaximized ? '📐' : '🗖'}
                </button>
                <button 
                  onClick={closeDialog} 
                  className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-darkblue-800' : 'hover:bg-ice-100'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quiz List */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isMaximized ? 'max-h-none' : 'max-h-[60vh]'}`}>
              {currentSubjectQuizzes.length > 0 ? (
                <div className="space-y-3">
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
                        className={`rounded-lg overflow-hidden border transition-all ${
                          isDarkMode ? 'border-darkblue-700' : 'border-ice-200'
                        }`}
                      >
                        <button
                          onClick={() => toggleQuizExpand(quiz.id)}
                          className="w-full p-3 text-left transition-all hover:bg-teal-50 dark:hover:bg-darkblue-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'
                                }`}>
                                  {idx + 1}
                                </span>
                                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-darkblue-800'}`}>
                                  {quiz.title}
                                </h4>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className={isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}>
                                  📝 {questionCount} questions
                                </span>
                                <span className={isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}>
                                  ⏱️ {timeEstimate} min
                                </span>
                                <span className="text-teal-500 font-semibold">
                                  +{quiz.points_reward || 50} pts
                                </span>
                              </div>
                            </div>
                            <svg className={`w-4 h-4 transition-transform ${expandedQuiz === quiz.id ? 'rotate-180' : ''} ${isDarkMode ? 'text-ice-400' : 'text-darkblue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        
                        {expandedQuiz === quiz.id && (
                          <div className={`p-3 border-t ${isDarkMode ? 'border-darkblue-700 bg-darkblue-800/50' : 'border-ice-100 bg-ice-50'}`}>
                            {quiz.image_url && (
                              <div className="mb-2 rounded-md overflow-hidden">
                                <img src={quiz.image_url} alt={quiz.title} className="w-full h-24 object-cover" />
                              </div>
                            )}
                            <p className={`text-xs mb-2 ${isDarkMode ? 'text-ice-300' : 'text-darkblue-600'}`}>
                              {quiz.description || 'Test your knowledge with this quiz!'}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'
                              }`}>
                                🎯 Passing: 60%
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                isDarkMode ? 'bg-azure-500/20 text-azure-400' : 'bg-azure-100 text-azure-600'
                              }`}>
                                ⚡ {quiz.difficulty || 'Medium'} difficulty
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/quiz/${quiz.id}`)}
                              className="w-full py-2 rounded-lg font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600 transition"
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
                  <p className={`text-sm ${isDarkMode ? 'text-ice-400' : 'text-darkblue-500'}`}>
                    No quizzes available
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t ${isDarkMode ? 'border-darkblue-700' : 'border-ice-200'}`}>
              <button
                onClick={closeDialog}
                className="w-full py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition"
              >
                Close
              </button>
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
          background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,176,255,0.3)'};
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default QuizPage;