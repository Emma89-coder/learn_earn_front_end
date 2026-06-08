import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import QuizResultsModal from './QuizResultsModal';

// Helper function to convert text with markdown to HTML
const renderFormattedText = (text) => {
  if (!text) return '';
  
  let formatted = text
    .replace(/__(.*?)__/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  
  return formatted;
};

// Shuffle utility function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [learnerClass, setLearnerClass] = useState(null);
  const [isRandomQuiz, setIsRandomQuiz] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [selectedQuestionsCount, setSelectedQuestionsCount] = useState(0);
  
  // Level progression state
  const [learnerCurrentLevel, setLearnerCurrentLevel] = useState(null);
  const [quizLevel, setQuizLevel] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState('');
  
  // Results Modal State
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [quizResults, setQuizResults] = useState({
    scorePercentage: 0,
    earnedPoints: 0,
    correctCount: 0,
    totalQuestions: 0,
    passed: false,
    answers: []
  });
  
  // Ref to track the absolute latest answers
  const answersRef = useRef([]);
  
  // Constants
  const MAX_TIME = 30;
  const POINTS_PER_QUESTION = 2;
  const audioRef = useRef(null);

  // Helper function to sanitize text values
  const sanitizeValue = (value) => {
    if (value === null || value === undefined || value === "null" || value === "Null" || value === "NULL") {
      return '';
    }
    return String(value).trim();
  };

  // Helper function to normalize for comparison
  const normalizeValue = (value) => {
    return sanitizeValue(value).toLowerCase();
  };

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

  const playTick = () => playSound(880, 0.05, 'sine', 0.03);
  const playNavSound = () => playSound(587.33, 0.1, 'sine', 0.08);
  
  const playCorrectAnswerSound = () => {
    try {
      initAudio();
      const ctx = audioRef.current;
      
      const notes = [523.25, 587.33, 659.25, 783.99];
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }, index * 80);
      });
      
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }, 320);
      
    } catch (error) {
      console.warn('Correct answer sound unavailable:', error);
    }
  };
  
  const playWrongAnswerSound = () => {
    try {
      initAudio();
      const ctx = audioRef.current;
      
      const notes = [440, 349.23, 293.66];
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }, index * 100);
      });
      
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }, 200);
      
    } catch (error) {
      console.warn('Wrong answer sound unavailable:', error);
    }
  };
  
  const playApplause = () => {
    try {
      initAudio();
      const ctx = audioRef.current;
      
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
      
      createClap(0, 800, 0.08);
      createClap(50, 1000, 0.07);
      createClap(100, 1200, 0.06);
      createClap(150, 900, 0.07);
      createClap(200, 1100, 0.06);
      createClap(250, 1300, 0.05);
      createClap(300, 950, 0.05);
      createClap(350, 1050, 0.04);
      
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
  
  const playTimesUpSound = () => {
    try {
      initAudio();
      const ctx = audioRef.current;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      
    } catch (error) {
      console.warn('Times up sound unavailable:', error);
    }
  };

  // Get learner's profile including current level
  const getLearnerProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/learner/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLearnerClass(response.data.learner.class_level || 'standard-5');
        setLearnerCurrentLevel(response.data.learner.current_level || response.data.learner.class_level || 'standard-5');
      }
    } catch (error) {
      console.error('Error fetching learner profile:', error);
      setLearnerClass('standard-5');
      setLearnerCurrentLevel('standard-5');
    }
  };

  // STRICT ACCESS CHECK: Verify learner can access this quiz
  const verifyQuizAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const quizResponse = await axios.get(`${API_URL}/api/learner/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!quizResponse.data.success) {
        throw new Error('Quiz not found');
      }
      
      const quizData = quizResponse.data.quiz;
      const quizClassLevel = quizData.class_level;
      
      const profileResponse = await axios.get(`${API_URL}/api/learner/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const learnerLevel = profileResponse.data.learner.current_level || profileResponse.data.learner.class_level;
      
      if (quizClassLevel && quizClassLevel !== learnerLevel) {
        setAccessError(`❌ Access Denied: This quiz is for ${formatLevelName(quizClassLevel)} learners only.`);
        setAccessDenied(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Access verification error:', error);
      setAccessError('Unable to verify quiz access. Please try again.');
      setAccessDenied(true);
      return false;
    }
  };

  // Format level name for display
  const formatLevelName = (level) => {
    if (!level) return 'Unknown';
    return level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  // Check if quiz has random selection from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const randomParam = urlParams.get('random');
    setIsRandomQuiz(randomParam === 'true');
  }, []);

  // Fetch Quiz Data
  const fetchQuiz = async () => {
    try {
      setLoading(true);
      
      const hasAccess = await verifyQuizAccess();
      if (!hasAccess) {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!learnerCurrentLevel) {
        await getLearnerProfile();
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const randomParam = urlParams.get('random');
      const limitParam = urlParams.get('limit');
      
      let url = `${API_URL}/api/learner/quiz/${quizId}`;
      if (randomParam === 'true') {
        url += `?random=true&limit=${limitParam || 20}`;
        setIsRandomQuiz(true);
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        let quizData = response.data.quiz;
        
        setQuizLevel(quizData.class_level || null);
        
        if (quizData.class_level && quizData.class_level !== learnerCurrentLevel) {
          setAccessError(`❌ Access Denied: This quiz is for ${formatLevelName(quizData.class_level)} learners.`);
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        
        let questions = quizData.questions;
        if (typeof questions === 'string') {
          questions = JSON.parse(questions);
        }
        
        setTotalAvailable(quizData.total_questions_available || questions.length);
        setSelectedQuestionsCount(questions.length);
        
        const randomizedQuestions = questions.map((question, idx) => {
          const optionsWithMeta = (question.options || []).map((option, optIdx) => ({
            text: sanitizeValue(option),
            originalIndex: optIdx,
            isCorrect: normalizeValue(option) === normalizeValue(question.correctAnswer)
          }));
          
          const shuffledOptions = shuffleArray(optionsWithMeta);
          const newCorrectAnswer = shuffledOptions.find(opt => opt.isCorrect)?.text || question.correctAnswer;
          
          return {
            ...question,
            id: question.id || idx,
            question: sanitizeValue(question.question) || 'No question text',
            options: shuffledOptions.map(opt => opt.text),
            correctAnswer: sanitizeValue(newCorrectAnswer),
            questionImage: question.questionImage && question.questionImage.trim() !== '' && 
                           question.questionImage !== "null" && question.questionImage !== "NULL"
              ? question.questionImage 
              : null
          };
        });
        
        setQuiz({
          ...quizData,
          questions: randomizedQuestions
        });
        
        const initialAnswers = new Array(randomizedQuestions.length).fill('');
        setAnswers(initialAnswers);
        answersRef.current = initialAnswers;
        
        setTimeLeft(MAX_TIME);
        setCurrentScore(0);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Quiz unavailable');
      navigate('/quizzes');
    }
  };

  // Check and advance level after quiz completion
  const checkAndAdvanceLevel = async (scorePercentage) => {
    if (!quizLevel) return;
    
    const allLevels = [
      'standard-1', 'standard-2', 'standard-3', 'standard-4',
      'standard-5', 'standard-6', 'standard-7', 'standard-8'
    ];
    
    const currentIndex = allLevels.indexOf(quizLevel);
    const nextLevel = currentIndex + 1 < allLevels.length ? allLevels[currentIndex + 1] : null;
    const classIndex = allLevels.indexOf(learnerClass);
    
    if (scorePercentage >= 70 && nextLevel && learnerCurrentLevel === quizLevel && currentIndex < classIndex) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/learner/advance-level`, {
          current_level: quizLevel,
          next_level: nextLevel,
          score_percentage: scorePercentage,
          quizzes_passed: 1,
          total_quizzes: 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setLearnerCurrentLevel(nextLevel);
          setTimeout(() => {
            toast.success(`🎉 Congratulations! You've advanced to ${formatLevelName(nextLevel)}!`, {
              duration: 5000
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Error advancing level:', error);
      }
    } else if (scorePercentage >= 70 && currentIndex >= classIndex) {
      toast.success(`🎉 Great job! You've mastered ${formatLevelName(quizLevel)}!`, {
        duration: 3000
      });
    }
  };

  // Fetch learner profile on mount
  useEffect(() => {
    getLearnerProfile();
  }, []);

  // Fetch Quiz Data when profile is loaded
  useEffect(() => {
    if (learnerCurrentLevel !== null) {
      fetchQuiz();
    }
  }, [quizId, learnerCurrentLevel]);

  // Timer Logic
  useEffect(() => {
    if (!quiz || loading || timeLeft <= 0 || showFeedback) return;
    
    playTick();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, quiz, loading, showFeedback]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && quiz && !loading) {
      handleTimeout();
    }
  }, [timeLeft]);

  // Auto-hide feedback after 2 seconds
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
        setSelectedOption(null);
        
        if (currentQuestion + 1 < (quiz?.questions?.length || 0)) {
          setCurrentQuestion(prev => prev + 1);
          setFilteredOptions(null);
          setFiftyFiftyUsed(false);
          setTimeLeft(MAX_TIME);
          setSelectedOption(null);
        } else {
          handleSubmit();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  const handleTimeout = () => {
    if (showFeedback) return;
    
    const currentQ = quiz.questions[currentQuestion];
    const cleanCorrectAnswer = sanitizeValue(currentQ.correctAnswer);
    
    playTimesUpSound();
    setFeedbackMessage(`⏰ Time's up! The correct answer is: ${cleanCorrectAnswer}`);
    setIsAnswerCorrect(false);
    setShowFeedback(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = '';
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
  };

  const handleAnswerSelect = (option) => {
    if (!quiz || loading || showFeedback || selectedOption) return; 
    
    playNavSound();
    setSelectedOption(option);
    
    const currentQ = quiz.questions[currentQuestion];
    
    const cleanOption = sanitizeValue(option);
    const cleanCorrectAnswer = sanitizeValue(currentQ.correctAnswer);
    
    const normalizedOption = normalizeValue(cleanOption);
    const normalizedCorrectAnswer = normalizeValue(cleanCorrectAnswer);
    const isCorrect = normalizedOption === normalizedCorrectAnswer && normalizedOption !== '';
    
    if (isCorrect) {
      playCorrectAnswerSound();
      setCurrentScore(prev => prev + POINTS_PER_QUESTION);
      setFeedbackMessage(`✅ Correct! 🎉 +${POINTS_PER_QUESTION} Points!`);
    } else {
      playWrongAnswerSound();
      const displayAnswer = cleanCorrectAnswer || 'No answer available';
      setFeedbackMessage(`❌ Incorrect! The correct answer is: ${displayAnswer}`);
    }
    
    setIsAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = cleanOption;
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
  };

  const handleFiftyFifty = () => {
    if (!quiz || loading || fiftyFiftyUsed || showFeedback) return;
    playNavSound();
    
    const currentQ = quiz.questions[currentQuestion];
    const cleanCorrectAnswer = sanitizeValue(currentQ.correctAnswer);
    const normalizedCorrectAnswer = normalizeValue(cleanCorrectAnswer);
    
    const incorrectOptions = currentQ.options.filter(opt => {
      const normalizedOpt = normalizeValue(opt);
      return normalizedOpt !== normalizedCorrectAnswer && normalizedOpt !== '';
    });
    
    if (incorrectOptions.length > 0) {
      const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      setFilteredOptions([cleanCorrectAnswer, randomIncorrect]);
    } else {
      setFilteredOptions([cleanCorrectAnswer, currentQ.options[0]]);
    }
    
    setFiftyFiftyUsed(true);
    toast.success('🎯 Two options remaining!', { icon: '💡' });
    playSound(880, 0.2, 'sine', 0.1);
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    
    const latestAnswers = answersRef.current;
    
    try {
      let correctCount = 0;
      const formattedAnswers = latestAnswers.map((answer, idx) => {
        const question = quiz.questions[idx];
        
        const cleanAnswer = sanitizeValue(answer);
        const cleanCorrectAnswer = sanitizeValue(question.correctAnswer);
        
        const normalizedAnswer = normalizeValue(cleanAnswer);
        const normalizedCorrectAnswer = normalizeValue(cleanCorrectAnswer);
        
        const isCorrect = normalizedAnswer === normalizedCorrectAnswer && normalizedAnswer !== '';
        
        if (isCorrect) correctCount++;
        
        return {
          questionId: question.id || idx,
          selectedOption: cleanAnswer,
          isCorrect,
          correctAnswer: cleanCorrectAnswer,
          questionText: question.question
        };
      });
      
      const earnedPoints = correctCount * POINTS_PER_QUESTION;
      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = scorePercentage >= 60;
      
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/learner/quiz-submit`, {
        quizId: parseInt(quizId),
        answers: formattedAnswers,
        score: scorePercentage,
        pointsEarned: earnedPoints
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await checkAndAdvanceLevel(scorePercentage);
      
      setQuizResults({
        scorePercentage,
        earnedPoints,
        correctCount,
        totalQuestions: quiz.questions.length,
        passed,
        answers: formattedAnswers,
        quizTitle: quiz.title,
        totalAvailable: totalAvailable,
        isRandom: isRandomQuiz,
        quizLevel: quizLevel,
        advancedLevel: scorePercentage >= 70 && learnerCurrentLevel === quizLevel ? true : false
      });
      
      setShowResultsModal(true);
      
      if (passed) {
        playApplause();
      }
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = async () => {
    setShowResultsModal(false);
    setCurrentQuestion(0);
    setCurrentScore(0);
    setFiftyFiftyUsed(false);
    setFilteredOptions(null);
    setShowFeedback(false);
    setSelectedOption(null);
    await fetchQuiz();
  };

  const handleNextLevel = () => {
    setShowResultsModal(false);
    navigate('/quizzes');
  };

  const handleViewDashboard = () => {
    setShowResultsModal(false);
    navigate('/learner-dashboard');
  };

  const handleShareResults = () => {
    const { scorePercentage, earnedPoints, correctCount, totalQuestions, passed, isRandom, totalAvailable, advancedLevel } = quizResults;
    const randomText = isRandom ? ` (random ${totalQuestions} of ${totalAvailable} questions)` : '';
    const advancedText = advancedLevel ? ` 🎉 I advanced to the next level!` : '';
    const message = `I scored ${scorePercentage}% (${correctCount}/${totalQuestions})${randomText} on the quiz! ${passed ? '🎉 I passed!' : '📚 I\'ll keep practicing!'} Earned ${earnedPoints} points!${advancedText}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Quiz Results',
        text: message,
      }).catch(() => {
        navigator.clipboard.writeText(message);
        toast.success('Results copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Results copied to clipboard!');
    }
  };

  const getLevelDisplayName = (level) => {
    if (!level) return null;
    return level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  // Access Denied Screen
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl p-6 text-center shadow-2xl">
          <div className="text-7xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Access Denied</h2>
          <div className="p-4 rounded-lg mb-6 bg-red-50 text-red-600">
            <p className="text-sm">{accessError}</p>
          </div>
          <button
            onClick={() => navigate('/quizzes')}
            className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition"
          >
            Back to Available Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl p-8 text-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions?.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl p-8 text-center shadow-2xl">
          <p className="text-gray-600">No questions found.</p>
          <button
            onClick={() => navigate('/quizzes')}
            className="mt-4 w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz UI
  const currentQ = quiz.questions[currentQuestion];
  const optionsToShow = filteredOptions || currentQ.options;
  const hasImage = currentQ.questionImage && currentQ.questionImage.trim() !== '';

  return (
    <div className="h-screen bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Results Modal */}
      <QuizResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={quizResults}
        onRetake={handleRetakeQuiz}
        onNextLevel={handleNextLevel}
        onViewDashboard={handleViewDashboard}
        onShare={handleShareResults}
        isDarkMode={false}
      />

      {/* Main Container - Larger for both layouts */}
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${hasImage ? 'w-full max-w-6xl' : 'w-full max-w-3xl'}`}>
        
        {/* Header with Timer and Score - Increased size for both */}
        <div className={`relative bg-teal-600 ${hasImage ? 'px-8 py-5' : 'px-8 py-5'}`}>
          {/* Floating Timer Circle - Larger for both */}
          <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold text-white shadow-lg z-10 ring-4 ring-white ${
            timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-teal-500'
          } ${hasImage ? 'w-16 h-16 text-xl' : 'w-16 h-16 text-xl'}`}>
            {timeLeft}
          </div>

          {/* Score Display - Larger */}
          <div className="flex justify-between items-center">
            <div className="text-white font-semibold text-base">
              Question {currentQuestion + 1}/{quiz.questions.length}
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full">
              <span className="text-white font-semibold text-base">Score: </span>
              <span className="text-white font-bold text-2xl">{currentScore}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Layout Based on Image Presence */}
        {hasImage ? (
          // Two Column Layout for questions with images - ENLARGED
          <div className="flex flex-col md:flex-row">
            {/* Left Column - Diagram/Image - Larger */}
            <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center border-r border-gray-200">
              <div className="text-center">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <img 
                    src={currentQ.questionImage} 
                    alt="Question diagram"
                    className="max-w-full h-auto max-h-96 object-contain mx-auto"
                  />
                </div>
                <p className="text-gray-800 font-bold mt-5 text-center px-4 text-base">
                  {currentQ.question}
                </p>
              </div>
            </div>

            {/* Right Column - Options - Larger */}
            <div className="md:w-1/2 p-8">
              <div className="space-y-3.5">
                {optionsToShow.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === option;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showFeedback || selectedOption}
                      className={`
                        w-full py-4 px-5 rounded-xl flex items-center gap-4 transition-all duration-200 text-left
                        ${isSelected && !showFeedback
                          ? 'bg-teal-500 text-white shadow-lg ring-2 ring-teal-500'
                          : !showFeedback && !selectedOption
                            ? 'bg-gray-100 hover:ring-2 hover:ring-teal-400 hover:bg-gray-50 text-gray-700'
                            : 'bg-gray-50 opacity-60'
                        }
                      `}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                        isSelected && !showFeedback 
                          ? 'bg-white text-teal-600' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {optionLetter}
                      </div>
                      <span className={`font-semibold text-base flex-1 ${
                        isSelected && !showFeedback ? 'text-white' : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons - Larger */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleFiftyFifty}
                  disabled={fiftyFiftyUsed || showFeedback}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200
                    ${fiftyFiftyUsed || showFeedback
                      ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                      : 'bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 shadow-sm'
                    }
                  `}
                >
                  🎯 50:50
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200
                    ${submitting 
                      ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                      : 'bg-teal-500 text-white hover:bg-teal-600 shadow-md'
                    }
                  `}
                >
                  {submitting ? 'Submitting...' : '✓ Submit Quiz'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Single Column Layout for questions without images (Increased font and container)
          <div className="p-8">
            {/* Question Text */}
            <div className="bg-white rounded-xl p-6 text-center shadow-sm mb-6 border-2 border-teal-100">
              <h2 className="text-gray-800 text-xl font-bold leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-6">
              {optionsToShow.map((option, idx) => {
                const optionLetter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === option;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showFeedback || selectedOption}
                    className={`
                      w-full py-4 px-5 rounded-xl flex items-center gap-4 transition-all duration-200 text-left
                      ${isSelected && !showFeedback
                        ? 'bg-teal-500 text-white shadow-lg ring-2 ring-teal-500'
                        : !showFeedback && !selectedOption
                          ? 'bg-gray-100 hover:ring-2 hover:ring-teal-400 hover:bg-gray-50 text-gray-700'
                          : 'bg-gray-50 opacity-60'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                      isSelected && !showFeedback 
                        ? 'bg-white text-teal-600' 
                        : 'bg-gray-400 text-white'
                    }`}>
                      {optionLetter}
                    </div>
                    <span className={`font-semibold text-base flex-1 ${
                      isSelected && !showFeedback ? 'text-white' : 'text-gray-700'
                    }`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleFiftyFifty}
                disabled={fiftyFiftyUsed || showFeedback}
                className={`
                  flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200
                  ${fiftyFiftyUsed || showFeedback
                    ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                    : 'bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 shadow-sm'
                  }
                `}
              >
                🎯 50:50
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`
                  flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200
                  ${submitting 
                    ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                    : 'bg-teal-500 text-white hover:bg-teal-600 shadow-md'
                  }
                `}
              >
                {submitting ? 'Submitting...' : '✓ Submit Quiz'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Toast with Animation */}
      {showFeedback && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className={`rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm ${isAnswerCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="px-6 py-3 flex items-center gap-2">
              <span className="text-white text-lg">{isAnswerCorrect ? '🎉' : '💡'}</span>
              <p className="text-white font-semibold text-sm">{feedbackMessage}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TakeQuiz;