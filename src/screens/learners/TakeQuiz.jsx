import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [quiz, setQuiz] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // Constants
  const MAX_TIME = 30;
  const POINTS_PER_QUESTION = 2;
  const audioRef = useRef(null);

  // Audio Functions
  const initAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume();
    }
  };

  const playSound = (frequency = 587.33, duration = 0.15, type = 'sine', volume = 0.1) => {
    try {
      initAudio();
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback unavailable:', error);
    }
  };

  const playTick = () => playSound(120, 0.05, 'triangle', 0.05);
  const playNavSound = () => playSound(587.33, 0.15, 'sine', 0.1);
  
  // Applause sound effect for correct answer
  const playApplause = () => {
    try {
      initAudio();
      const ctx = audioRef.current;
      
      // Create multiple oscillators for applause effect
      const createClap = (delay, frequency, volume) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'noise' in ctx ? 'noise' : 'sine';
          if (osc.type !== 'noise') {
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
          }
          
          gain.gain.setValueAtTime(volume, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }, delay);
      };
      
      // Create multiple clap sounds for applause effect
      createClap(0, 800, 0.08);
      createClap(50, 1000, 0.07);
      createClap(100, 1200, 0.06);
      createClap(150, 900, 0.07);
      createClap(200, 1100, 0.06);
      createClap(250, 1300, 0.05);
      createClap(300, 950, 0.05);
      createClap(350, 1050, 0.04);
      
      // Cheer sound
      setTimeout(() => {
        const cheerOsc = ctx.createOscillator();
        const cheerGain = ctx.createGain();
        cheerOsc.type = 'sine';
        cheerOsc.frequency.setValueAtTime(880, ctx.currentTime);
        cheerOsc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.5);
        cheerGain.gain.setValueAtTime(0.15, ctx.currentTime);
        cheerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        cheerOsc.connect(cheerGain);
        cheerGain.connect(ctx.destination);
        cheerOsc.start();
        cheerOsc.stop(ctx.currentTime + 0.5);
      }, 100);
      
    } catch (error) {
      console.warn('Applause sound unavailable:', error);
    }
  };
  
  // Incorrect answer sound effect
  const playIncorrectSound = () => {
    try {
      initAudio();
      const ctx = audioRef.current;
      
      // Descending sad/buzzer sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      
      // Add a second lower tone for dramatic effect
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(330, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(165, ctx.currentTime + 0.3);
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 50);
      
    } catch (error) {
      console.warn('Incorrect answer sound unavailable:', error);
    }
  };

  // Fetch Quiz Data
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

  // Timer Logic
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;
    
    playTick();
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

  // Auto-hide feedback after 1.5 seconds
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  // Game Actions
  const startGame = () => {
    playNavSound();
    setGameStarted(true);
    setTimeLeft(MAX_TIME);
  };

  const handleAnswerSelect = (option) => {
    if (!gameStarted) return;
    
    const currentQ = quiz.questions[currentQuestion];
    const isCorrect = option === currentQ.correctAnswer;
    
    // Play appropriate sound effect
    if (isCorrect) {
      playApplause();
      setFeedbackMessage('Correct! 🎉 Great job!');
      toast.success('Correct! 🎉');
    } else {
      playIncorrectSound();
      setFeedbackMessage(`Incorrect! 😅 The correct answer is: ${currentQ.correctAnswer}`);
      toast.error(`Incorrect! The correct answer is: ${currentQ.correctAnswer}`);
    }
    
    // Show feedback animation
    setIsAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    playNavSound();
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = option;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestion + 1 < (quiz?.questions?.length || 0)) {
        setCurrentQuestion(prev => prev + 1);
        setFilteredOptions(null);
        setFiftyFiftyUsed(false);
        setTimeLeft(MAX_TIME);
      } else {
        handleSubmit();
      }
    }, 1500);
  };

  const handleFiftyFifty = () => {
    if (!gameStarted || fiftyFiftyUsed) return;
    playNavSound();
    
    const currentQ = quiz.questions[currentQuestion];
    const incorrectOptions = currentQ.options.filter(opt => opt !== currentQ.correctAnswer);
    const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
    
    setFilteredOptions([currentQ.correctAnswer, randomIncorrect]);
    setFiftyFiftyUsed(true);
    toast.success('Two incorrect options eliminated!');
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
      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/learner/quiz-submit`, {
        quizId: parseInt(quizId),
        answers: formattedAnswers,
        score: scorePercentage,
        pointsEarned: earnedPoints
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Quiz complete! Score: ${scorePercentage}% | Points: ${earnedPoints}`);
      navigate('/learner-dashboard');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-teal-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions?.length) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No questions found.</p>
        </div>
      </div>
    );
  }

  // Start Screen
  if (!gameStarted) {
    return (
      <div className={`h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="max-w-md w-full">
          {/* Theme Toggle */}
          <div className="absolute top-6 right-6">
            <button
              onClick={() => { playNavSound(); setIsDarkMode(!isDarkMode); }}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Main Card */}
          <div className={`rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-8 text-center">
              {/* Icon */}
              <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-6 ${
                isDarkMode ? 'bg-gradient-to-br from-teal-600 to-teal-700' : 'bg-gradient-to-br from-teal-500 to-teal-600'
              }`}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Ready to Test Your Skills?
              </h1>
              <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Answer each question within {MAX_TIME} seconds to earn maximum points
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: '⏱️', label: 'Time Limit', value: `${MAX_TIME}s` },
                  { icon: '💎', label: 'Points', value: `${POINTS_PER_QUESTION} pts` },
                  { icon: '📝', label: 'Questions', value: quiz.questions.length }
                ].map((stat, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.label}
                    </div>
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Start Button */}
              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transform transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz UI - Fixed to one page without scrolling
  const currentQ = quiz.questions[currentQuestion];
  const optionsToShow = filteredOptions || currentQ.options;
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const hasImage = currentQ.questionImage && currentQ.questionImage.trim() !== '';

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Feedback Dialog Box */}
      {showFeedback && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`max-w-md w-full mx-4 transform transition-all duration-300 animate-slide-down pointer-events-auto`}>
            <div className={`rounded-2xl shadow-2xl overflow-hidden ${
              isAnswerCorrect 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              <div className="p-6 text-center">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  {isAnswerCorrect ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                
                {/* Title */}
                <h3 className={`text-2xl font-bold text-white mb-2 ${
                  isAnswerCorrect ? 'animate-pulse' : ''
                }`}>
                  {isAnswerCorrect ? 'Correct!' : 'Incorrect!'}
                </h3>
                
                {/* Message */}
                <p className="text-white text-opacity-90 text-sm">
                  {feedbackMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 pt-6 px-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => { playNavSound(); navigate('/quizzes'); }}
              className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Progress Bar */}
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Question {currentQuestion + 1} of {quiz.questions.length}
                </span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Timer */}
            <div className="relative flex-shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="url(#timerGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * timeLeft) / MAX_TIME}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => { playNavSound(); setIsDarkMode(!isDarkMode); }}
              className={`p-2 rounded-lg transition-all flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed height, no scroll */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-4 min-h-0">
        <div className="w-full max-w-3xl">
          {/* Question Card */}
          <div className={`rounded-2xl shadow-lg p-6 mb-6 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl md:text-2xl font-semibold text-center leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {currentQ.question}
            </h2>
            
            {hasImage && (
              <div className="mt-4 flex justify-center">
                <img 
                  src={currentQ.questionImage} 
                  alt="Question illustration"
                  className="max-h-32 rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          {/* Options Grid with Teal Hover */}
          <div className="grid gap-3">
            {optionsToShow.map((option, idx) => {
              const isSelected = answers[currentQuestion] === option;
              const isHidden = filteredOptions && !filteredOptions.includes(option);
              const isHovered = hoveredOption === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(option)}
                  onMouseEnter={() => setHoveredOption(idx)}
                  onMouseLeave={() => setHoveredOption(null)}
                  disabled={isHidden}
                  className={`
                    p-3 rounded-xl text-left font-medium transition-all duration-300
                    ${isHidden ? 'opacity-0 hidden' : 'opacity-100'}
                    ${isSelected 
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg transform scale-[1.01]' 
                      : isHovered
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white transform scale-[1.01] shadow-lg'
                        : `${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`
                    }
                  `}
                >
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center mr-3 font-semibold text-sm
                      ${isSelected || isHovered
                        ? 'bg-white bg-opacity-30 text-white' 
                        : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {(isSelected || isHovered) && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleFiftyFifty}
              disabled={fiftyFiftyUsed}
              className={`
                px-6 py-2.5 rounded-xl font-medium transition-all duration-300 text-sm
                ${fiftyFiftyUsed 
                  ? 'opacity-50 cursor-not-allowed' 
                  : `transform hover:scale-105 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 shadow-md'}`
                }
              `}
            >
              🎯 50:50
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`
                px-6 py-2.5 rounded-xl font-medium transition-all duration-300 text-sm
                ${submitting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white transform hover:scale-105 shadow-lg'
                }
              `}
            >
              {submitting ? 'Submitting...' : '✓ Submit Quiz'}
            </button>
          </div>
        </div>
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TakeQuiz;