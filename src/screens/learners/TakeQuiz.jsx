import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(null);
  const [isLightTheme, setIsLightTheme] = useState(true);
  
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const maxTime = 30;
  const POINTS_PER_QUESTION = 2;
  const audioCtxRef = useRef(null);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTickSound = () => {
    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn("Audio playback blocked or unsupported:", e);
    }
  };

  const playNavigationSound = () => {
    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); 

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio playback blocked:", e);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/learner/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        let quizData = response.data.quiz;
        if (typeof quizData.questions === 'string') {
          quizData.questions = JSON.parse(quizData.questions);
        }
        setQuiz(quizData);
        setAnswers(new Array(quizData.questions?.length || 0).fill(null));
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Quiz unavailable');
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gameStarted || timeLeft === null || timeLeft <= 0) return;
    
    playTickSound();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameStarted]);

  const startGame = () => {
    playNavigationSound();
    setGameStarted(true);
    setTimeLeft(maxTime);
  };

  const handleAnswerSelect = (option) => {
    if (!gameStarted) return;
    playNavigationSound();
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = option;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion + 1 < (quiz?.questions?.length || 0)) {
        setCurrentQuestion(prev => prev + 1);
        setFilteredOptions(null);
        setFiftyFiftyUsed(false);
        setTimeLeft(maxTime);
      } else {
        handleSubmit();
      }
    }, 400);
  };

  const handleFiftyFifty = () => {
    if (!gameStarted) return;
    playNavigationSound();
    if (fiftyFiftyUsed) return;
    const currentQ = quiz.questions[currentQuestion];
    const correctAnswer = currentQ.correctAnswer;
    const incorrectOptions = currentQ.options.filter(opt => opt !== correctAnswer);
    const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
    
    setFilteredOptions([correctAnswer, randomIncorrect]);
    setFiftyFiftyUsed(true);
    toast.success('Two incorrect options eliminated');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let correctCount = 0;
      const formattedAnswers = answers.map((answer, idx) => {
        const isCorrect = answer === quiz.questions[idx].correctAnswer;
        if (isCorrect) correctCount++;
        return {
          questionId: quiz.questions[idx].id || idx,
          selectedOption: answer,
          isCorrect
        };
      });
      
      const earnedPoints = correctCount * POINTS_PER_QUESTION;
      const scorePercentage = Math.round((correctCount / (quiz?.questions?.length || 1)) * 100);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/learner/quiz-submit`, {
        quizId: parseInt(quizId),
        answers: formattedAnswers,
        score: scorePercentage,
        pointsEarned: earnedPoints
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Quiz complete! Score: ${scorePercentage}% | Points: ${earnedPoints}`);
        navigate('/learner-dashboard');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLightTheme ? 'bg-[#f0f9ff]' : 'bg-[#000814]'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isLightTheme ? 'border-teal-500' : 'border-teal-400'} border-t-transparent`}></div>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLightTheme ? 'bg-[#f0f9ff]' : 'bg-[#000814]'}`}>
        <p className={isLightTheme ? 'text-darkblue-900' : 'text-ice-400'}>No questions found.</p>
      </div>
    );
  }

  // IMPROVED INFORMATION CARD
  if (!gameStarted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ${isLightTheme ? 'bg-ice-50' : 'bg-darkblue-950'}`}>
        
        {/* Modern Information Card */}
        <div className={`max-w-md w-full rounded-2xl p-8 text-center shadow-xl transition-all duration-500 ${
          isLightTheme 
            ? 'bg-white border border-ice-200' 
            : 'bg-darkblue-900 border border-darkblue-700'
        }`}>
          
          {/* Icon with Gradient Background */}
          <div className="mb-6">
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-2 ${isLightTheme ? 'text-darkblue-900' : 'text-white'}`}>
            Ready to Begin?
          </h1>

          {/* Divider */}
          <div className="w-16 h-1 mx-auto mb-6 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"></div>

          {/* Quiz Info Cards */}
          <div className="space-y-3 mb-6">
            <div className={`flex items-center justify-between p-3 rounded-xl ${isLightTheme ? 'bg-ice-50' : 'bg-darkblue-800'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                  <span className="text-lg">⏱️</span>
                </div>
                <span className={`text-sm ${isLightTheme ? 'text-darkblue-600' : 'text-ice-300'}`}>Time per question</span>
              </div>
              <span className={`font-semibold ${isLightTheme ? 'text-darkblue-900' : 'text-white'}`}>30 seconds</span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl ${isLightTheme ? 'bg-ice-50' : 'bg-darkblue-800'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <span className={`text-sm ${isLightTheme ? 'text-darkblue-600' : 'text-ice-300'}`}>Points per correct answer</span>
              </div>
              <span className={`font-semibold ${isLightTheme ? 'text-darkblue-900' : 'text-white'}`}>{POINTS_PER_QUESTION} pts</span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl ${isLightTheme ? 'bg-ice-50' : 'bg-darkblue-800'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <span className={`text-sm ${isLightTheme ? 'text-darkblue-600' : 'text-ice-300'}`}>Total questions</span>
              </div>
              <span className={`font-semibold ${isLightTheme ? 'text-darkblue-900' : 'text-white'}`}>{quiz.questions.length} questions</span>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-500/10 dark:to-teal-500/5">
            <p className={`text-sm ${isLightTheme ? 'text-darkblue-600' : 'text-ice-300'}`}>
              💡 The more accurate the answers, the more you'll earn!
            </p>
          </div>

          {/* PLAY WELL Text */}
          <p className={`text-md font-bold mb-6 text-teal-500`}>
            PLAY WELL 🎮
          </p>

          {/* Let's Play Button */}
          <button
            onClick={startGame}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg transform hover:scale-[1.02]`}
          >
            Let's Play 🚀
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => { playNavigationSound(); setIsLightTheme(!isLightTheme); }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-ice-100 dark:hover:bg-darkblue-800 transition"
          >
            <span className="text-xl">{isLightTheme ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </div>
    );
  }

  // MAIN QUIZ UI - Original design preserved
  const currentQ = quiz.questions[currentQuestion];
  const optionsToShow = filteredOptions || currentQ.options;
  const hasImage = currentQ.questionImage && currentQ.questionImage.trim() !== '';
  const strokeDashoffset = 251.2 - (251.2 * timeLeft) / maxTime;

  return (
    <div className={`min-h-screen flex flex-col justify-between items-center py-6 px-4 select-none overflow-x-hidden transition-colors duration-500 font-sans relative antialiased ${
      isLightTheme ? 'bg-[#f0f9ff] text-[#001d3d]' : 'bg-[#000814] text-[#e0f7fa]'
    }`} onClick={initAudioContext}>
      
      <div className={`absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none ${isLightTheme ? 'opacity-5' : 'opacity-10'}`}></div>
      
      <div className="w-full max-w-xl flex justify-between items-center z-10 px-4">
        <div className="flex gap-3">
          <button 
            onClick={() => { playNavigationSound(); navigate('/quizzes'); }}
            className="w-12 h-12 relative flex items-center justify-center transition active:scale-95 group"
          >
            <div className={`absolute inset-0 rounded-xl rotate-45 border transition-transform opacity-90 group-hover:scale-105 ${
              isLightTheme 
                ? 'bg-gradient-to-b from-teal-400 to-teal-600 border-teal-500 shadow-md shadow-teal-200' 
                : 'bg-gradient-to-b from-teal-200 to-teal-600 border-teal-500 shadow-lg shadow-teal-500/10'
            }`}></div>
            <span className={`text-xl relative z-10 font-bold ${isLightTheme ? 'text-white' : 'text-[#001d3d]'}`}>←</span>
          </button>

          <button 
            onClick={() => { playNavigationSound(); setIsLightTheme(!isLightTheme); }}
            className="w-12 h-12 relative flex items-center justify-center transition active:scale-95 group"
          >
            <div className={`absolute inset-0 rounded-xl rotate-45 border transition-all duration-300 opacity-90 ${
              isLightTheme ? 'bg-gradient-to-b from-[#e0f7fa] to-teal-400 border-white' : 'bg-gradient-to-b from-[#003566] to-[#001d3d] border-[#003566]'
            }`}></div>
            <span className="text-xl relative z-10">{isLightTheme ? '🌙' : '☀️'}</span>
          </button>
        </div>

        <div className="w-14 h-14 relative flex items-center justify-center">
          <div className={`absolute inset-0 rounded-xl rotate-45 border-2 transition-all opacity-90 ${
            isLightTheme 
              ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 border-white shadow-md shadow-teal-200' 
              : 'bg-gradient-to-br from-teal-200 via-teal-500 to-teal-800 border-teal-500 shadow-lg shadow-teal-500/10'
          }`}></div>
          <span className={`text-sm font-black relative z-10 font-sans ${isLightTheme ? 'text-white' : 'text-cyan-400'}`}>PTS</span>
        </div>
      </div>

      <div className="flex flex-col items-center my-2 relative z-10">
        <div className={`w-28 h-28 relative flex items-center justify-center rounded-full transition-all border shadow-2xl ${
          isLightTheme ? 'bg-white shadow-sky-100 border-teal-200' : 'bg-[#000814] shadow-[#001d3d] border-[#003566]'
        }`}>
          <svg className="w-full h-full transform -rotate-90 absolute inset-0">
            <circle cx="56" cy="56" r="40" stroke={isLightTheme ? "#f0f9ff" : "#001d3d"} strokeWidth="6" fill="transparent" />
            <circle 
              cx="56" cy="56" r="40" stroke="url(#gradient)" strokeWidth="6" fill="transparent" 
              strokeDasharray="251.2" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isLightTheme ? "#14B8A6" : "#e0f7fa"} />
                <stop offset="50%" stopColor={isLightTheme ? "#0D9488" : "#007fff"} />
                <stop offset="100%" stopColor={isLightTheme ? "#0F766E" : "#003566"} />
              </linearGradient>
            </defs>
          </svg>
          <span className={`text-3xl font-black font-mono tracking-tighter ${
            isLightTheme ? 'text-teal-600' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e0f7fa] drop-shadow-[0_2px_4px_rgba(0,127,255,0.4)]'
          }`}>
            {timeLeft}
          </span>
        </div>

        <div className="w-72 h-12 mt-6 relative flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-teal-500 p-[2px] shadow-lg"
            style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
          >
            <div 
              className={`w-full h-full flex items-center justify-center px-6 transition-all ${
                isLightTheme ? 'bg-gradient-to-b from-[#f0f9ff] to-white' : 'bg-gradient-to-b from-[#001d3d] to-[#000814]'
              }`}
              style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
            >
              <span className={`tracking-widest text-lg font-black ${isLightTheme ? 'text-teal-600' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e0f7fa]'} font-sans`}>
                {POINTS_PER_QUESTION} POINTS
              </span>
            </div>
          </div>
          <div className="absolute left-[-60px] right-[-60px] h-[1.5px] top-1/2 -z-10 bg-teal-500"></div>
        </div>
      </div>

      <div className="w-full max-w-2xl px-4 z-10 my-2">
        <div className={`w-full border rounded-3xl p-6 relative backdrop-blur-sm transition-all shadow-2xl ${
          isLightTheme ? 'bg-white/95 border-teal-200/40 shadow-teal-100' : 'bg-gradient-to-b from-[#001d3d] to-[#000814] border-[#003566] shadow-[#001d3d]'
        }`}>
          <div className={`absolute inset-3 border rounded-2xl pointer-events-none ${isLightTheme ? 'border-teal-200/20' : 'border-[#007fff]/5'}`}></div>
          
          <div className="w-full flex flex-col items-center gap-6">
            <h2 className={`text-center text-xl md:text-2xl font-bold tracking-wide leading-relaxed font-sans max-w-xl transition-colors ${
              isLightTheme ? 'text-[#001d3d]' : 'text-[#e0f7fa]'
            }`}>
              {currentQ.question || "Loading quiz inquiry..."}
            </h2>

            {hasImage && (
              <div className={`w-full max-w-sm aspect-video border rounded-2xl overflow-hidden p-2 flex items-center justify-center group transition-all ${
                isLightTheme ? 'bg-[#f0f9ff] border-teal-200/30 shadow-md shadow-teal-100' : 'bg-[#000814] border-[#003566] shadow-[0_0_30px_rgba(0,53,102,0.6)]'
              }`}>
                <img src={currentQ.questionImage} alt="Quiz visual asset" className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"/>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-4 my-4 relative z-10">
        {optionsToShow.map((option, idx) => {
          const isSelected = answers[currentQuestion] === option;
          const isHiddenBy5050 = filteredOptions && !filteredOptions.includes(option);
          const isHoveredOrActive = (hoveredIdx === idx) || isSelected;

          let lightNormalBody = 'bg-gradient-to-b from-white via-[#f0f9ff] to-white text-slate-600';
          let darkNormalBody = 'bg-gradient-to-b from-[#001d3d] via-[#000814] to-[#001d3d] text-slate-300';
          let activeAzureBody = 'bg-gradient-to-b from-teal-500 via-teal-400 to-teal-300 text-white font-bold';

          let bodyClass = isHoveredOrActive ? activeAzureBody : (isLightTheme ? lightNormalBody : darkNormalBody);
          const outlineColorClass = isHoveredOrActive ? 'bg-teal-300' : 'bg-teal-500';
          const connectorColorClass = isHoveredOrActive ? 'bg-teal-300' : 'bg-teal-500';

          return (
            <div key={idx} className={`w-full h-14 relative flex items-center justify-center transition-all duration-300 ${
                isHiddenBy5050 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
              }`}>
              <div className={`absolute left-0 right-0 h-[2px] -z-10 opacity-90 transition-colors duration-200 ${connectorColorClass}`}></div>
              <div className={`w-[88%] h-full transition-all duration-200 backdrop-blur-md p-[1px] ${outlineColorClass} ${isHoveredOrActive ? 'shadow-[0_0_22px_rgba(20,184,166,0.6)]' : 'shadow-sm'} ${isSelected ? 'scale-[1.01]' : ''}`}
                style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}>
                <div className="w-full h-full bg-black/10 relative" style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}>
                  <button
                    disabled={isHiddenBy5050}
                    onClick={() => handleAnswerSelect(option)}
                    onMouseEnter={() => !isHiddenBy5050 && (setHoveredIdx(idx), playNavigationSound())}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`w-full h-full text-center text-base tracking-wide transition-all duration-150 flex items-center justify-center px-10 ${bodyClass}`}
                    style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}
                  >
                    <span className="truncate">{option}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-md flex justify-between items-center gap-4 px-6 relative z-10">
        <button onClick={handleFiftyFifty} disabled={fiftyFiftyUsed} className={`w-14 h-12 relative flex items-center justify-center transition-all group ${fiftyFiftyUsed ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}>
          <div className={`absolute inset-0 border rounded-xl rotate-45 shadow-lg transition-all ${isLightTheme ? 'bg-gradient-to-b from-[#f0f9ff] to-white border-teal-200' : 'bg-gradient-to-b from-[#001d3d] to-[#000814] border-[#003566]'}`}></div>
          <span className={`text-[10px] font-black tracking-tighter relative z-10 font-mono ${isLightTheme ? 'text-teal-600' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-[#e0f7fa]'}`}>50:50</span>
        </button>

        <button onClick={playNavigationSound} className="w-14 h-12 relative flex items-center justify-center transition-all active:scale-90 group">
          <div className={`absolute inset-0 border rounded-xl rotate-45 shadow-lg transition-all ${isLightTheme ? 'bg-gradient-to-b from-[#f0f9ff] to-white border-teal-200' : 'bg-gradient-to-b from-[#001d3d] to-[#000814] border-[#003566]'}`}></div>
          <span className="text-lg relative z-10 filter drop-shadow">👥</span>
        </button>

        <button onClick={() => { playNavigationSound(); handleSubmit(); }} disabled={submitting} className="w-14 h-12 relative flex items-center justify-center transition-all active:scale-90 group disabled:opacity-40">
          <div className={`absolute inset-0 border-2 rounded-xl rotate-45 shadow-xl transition-all ${isLightTheme ? 'bg-gradient-to-b from-teal-400 via-teal-500 to-teal-700 border-teal-500' : 'bg-gradient-to-b from-teal-200 via-teal-500 to-teal-800 border-teal-500'}`}></div>
          <span className="text-sm font-black relative z-10 text-white">✓</span>
        </button>

        <button onClick={playNavigationSound} className="w-14 h-12 relative flex items-center justify-center transition-all active:scale-95 group">
          <div className={`absolute inset-0 border rounded-xl rotate-45 shadow-lg transition-all ${isLightTheme ? 'bg-gradient-to-b from-[#f0f9ff] to-white border-teal-200' : 'bg-gradient-to-b from-[#001d3d] to-[#000814] border-[#003566]'}`}></div>
          <span className="text-lg relative z-10 filter drop-shadow">🔄</span>
        </button>
      </div>
    </div>
  );
};

export default TakeQuiz;