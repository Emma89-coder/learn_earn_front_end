// TakeQuiz.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { useTheme } from '../../contexts/ThemeContext';
import useVoice from '../../hooks/useVoice';
import QuizResultsModal from './QuizResultsModal';

const renderFormattedText = (text) => {
  if (!text) return '';
  return text
    .replace(/__(.*?)__/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
};

const normalizeLowerCase = (text) => {
  if (!text) return '';
  return String(text).toLowerCase();
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const LEVEL_COLORS = {
  1: 'bg-green-400',   2: 'bg-green-500',
  3: 'bg-teal-400',    4: 'bg-teal-500',
  5: 'bg-blue-400',    6: 'bg-blue-500',
  7: 'bg-purple-400',  8: 'bg-purple-500',
  9: 'bg-orange-500',  10: 'bg-red-500',
};

const DISTRICT_CATEGORY_LABELS = {
  all: 'mixed challenge',
  'capitals-major-towns': 'capitals and major towns',
  'borders-neighbors': 'borders and neighbors',
  'physical-features': 'physical features',
  'parks-wildlife': 'national parks and wildlife',
  'economic-activities': 'economic activities',
  'transport-border-posts': 'transport and border posts',
  'history-culture': 'history and cultural landmarks',
  'region-classification': 'region classification',
};

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getPageStyles } = useTheme();
  const { speak, stop: stopVoice } = useVoice();

  // Core quiz state
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const answersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizLoaded, setQuizLoaded] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const MAX_TIME = 30;
  const POINTS_PER_QUESTION = 2;

  // Per-question UI state
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Level / access
  const [learnerClass, setLearnerClass] = useState(null);
  const [learnerCurrentLevel, setLearnerCurrentLevel] = useState(null);
  const [quizLevel, setQuizLevel] = useState(null);
  const [quizGameLevel, setQuizGameLevel] = useState(1);
  const [userGameLevel, setUserGameLevel] = useState(1);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [isRandomQuiz, setIsRandomQuiz] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [districtCategory, setDistrictCategory] = useState('all');
  const [districtCategories, setDistrictCategories] = useState([]);

  // Results modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [quizResults, setQuizResults] = useState({
    scorePercentage: 0, earnedPoints: 0, correctCount: 0,
    totalQuestions: 0, passed: false, answers: [],
    quizTitle: '',
  });

  const audioRef = useRef(null);
  const token = localStorage.getItem('token');
  const profileCache = useRef(null);
  const levelCache = useRef(null);

  // ── helpers ─────────────────────────────────────────────────────────────
  const sanitizeValue = (v) => {
    if (v === null || v === undefined || v === 'null' || v === 'Null' || v === 'NULL') return '';
    return String(v).trim();
  };
  const normalizeValue = (v) => sanitizeValue(v).toLowerCase();
  const formatLevelName = (l) => {
    if (!l) return 'unknown';
    return l.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };
  const pageStyles = {
    ...getPageStyles('quizTaking'),
    backgroundColor: '#f5f9ff',
    backgroundImage: 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)',
    color: '#1e293b',
  };
  const isDarkMode = false;

  // ── audio ────────────────────────────────────────────────────────────────
  const initAudio = () => {
    if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioRef.current.state === 'suspended') audioRef.current.resume();
  };
  const playSound = (freq = 587.33, dur = 0.15, type = 'sine', vol = 0.1) => {
    try {
      initAudio(); const ctx = audioRef.current;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };
  const playTick  = () => playSound(880, 0.05, 'sine', 0.03);
  const playNav   = () => playSound(587.33, 0.1, 'sine', 0.08);
  const playCorrect = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      [523.25, 587.33, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(0.15, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.2);
        }, i * 80);
      });
    } catch (e) {}
  };
  const playWrong = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      [440, 349.23, 293.66].forEach((f, i) => {
        setTimeout(() => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sawtooth'; o.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(0.12, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25);
        }, i * 100);
      });
    } catch (e) {}
  };
  const playApplause = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      [[0,800,0.08],[50,1000,0.07],[100,1200,0.06],[150,900,0.07],
       [200,1100,0.06],[250,1300,0.05],[300,950,0.05],[350,1050,0.04]
      ].forEach(([d, f, v]) => {
        setTimeout(() => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(v, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.3);
        }, d);
      });
    } catch (e) {}
  };
  const playTimesUp = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  // ── data fetching (parallel + cached) ──────────────────────────────────
  const getLearnerProfile = async () => {
    if (profileCache.current) {
      setLearnerClass(profileCache.current.class_level || 'standard-5');
      setLearnerCurrentLevel(profileCache.current.current_level || profileCache.current.class_level || 'standard-5');
      return profileCache.current;
    }
    try {
      const r = await axios.get(`${API_URL}/api/learner/profile`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (r.data.success) {
        profileCache.current = r.data.learner;
        setLearnerClass(r.data.learner.class_level || 'standard-5');
        setLearnerCurrentLevel(r.data.learner.current_level || r.data.learner.class_level || 'standard-5');
        return r.data.learner;
      }
    } catch { 
      setLearnerClass('standard-5'); 
      setLearnerCurrentLevel('standard-5'); 
    }
    return null;
  };

  const getUserGameLevel = async () => {
    if (levelCache.current) {
      setUserGameLevel(levelCache.current);
      return levelCache.current;
    }
    try {
      const r = await axios.get(`${API_URL}/api/learner/quiz-level`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (r.data.success) {
        levelCache.current = r.data.current_level || 1;
        setUserGameLevel(levelCache.current);
        return levelCache.current;
      }
    } catch { 
      setUserGameLevel(1); 
    }
    return 1;
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      setAccessError('');
      setQuizCompleted(false);
      setCurrentQuestion(0);
      setCurrentScore(0);
      setFiftyFiftyUsed(false);
      setFilteredOptions(null);
      setShowFeedback(false);
      setSelectedOption(null);

      const urlParams = new URLSearchParams(window.location.search);
      const randomParam = urlParams.get('random');
      const limitParam  = urlParams.get('limit');
      const districtCategoryParam = urlParams.get('districtCategory') || districtCategory || 'all';
      
      let url;
      if (quizId === 'malawi-districts') {
        url = `${API_URL}/api/districts/quiz?count=10&category=${encodeURIComponent(districtCategoryParam)}`;
      } else {
        url = `${API_URL}/api/learner/quiz/${quizId}`;
        if (randomParam === 'true') { url += `?random=true&limit=${limitParam || 20}`; setIsRandomQuiz(true); }
      }

      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.data.success) throw new Error('Quiz not found');

      const quizData = response.data.quiz;

      if (quizId === 'malawi-districts') {
        setDistrictCategory(quizData.district_category || districtCategoryParam || 'all');
        const available = Array.isArray(quizData.available_categories) && quizData.available_categories.length > 0
          ? quizData.available_categories
          : Object.keys(DISTRICT_CATEGORY_LABELS).map(id => ({ id, label: DISTRICT_CATEGORY_LABELS[id] }));
        setDistrictCategories(available);
      }

      if (
        quizId !== 'malawi-districts' &&
        quizData.class_level &&
        learnerCurrentLevel &&
        quizData.class_level !== learnerCurrentLevel
      ) {
        setAccessError(`access denied: this quiz is for ${formatLevelName(quizData.class_level)} learners only.`);
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setQuizLevel(quizData.class_level || null);
      setQuizGameLevel(quizData.quiz_level || 1);

      let questions = quizData.questions;
      if (typeof questions === 'string') questions = JSON.parse(questions);
      setTotalAvailable(quizData.total_questions_available || questions.length);

      const randomizedQuestions = questions.map((q, idx) => {
        const opts = (q.options || []).map(o => ({
          text: normalizeLowerCase(sanitizeValue(o)),
          isCorrect: normalizeValue(o) === normalizeValue(q.correctAnswer),
        }));
        const shuffled = shuffleArray(opts);
        return {
          ...q,
          id: q.id || idx,
          question: normalizeLowerCase(sanitizeValue(q.question)) || 'no question text',
          options: shuffled.map(o => o.text),
          correctAnswer: normalizeLowerCase(sanitizeValue(shuffled.find(o => o.isCorrect)?.text || q.correctAnswer)),
          questionImage: q.questionImage && q.questionImage.trim() !== '' &&
            q.questionImage !== 'null' && q.questionImage !== 'NULL' ? q.questionImage : null,
        };
      });

      setQuiz({ ...quizData, questions: randomizedQuestions });
      const init = new Array(randomizedQuestions.length).fill('');
      setAnswers(init);
      answersRef.current = init;
      setTimeLeft(MAX_TIME);
      setCurrentScore(0);
      setQuizLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      toast.error('quiz unavailable');
      navigate('/quizzes');
    }
  };

  // ── lifecycle (parallel loading) ──────────────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsRandomQuiz(urlParams.get('random') === 'true');
  }, []);

  useEffect(() => {
    // Load profile and level in parallel, then fetch quiz
    const loadData = async () => {
      const [profile, level] = await Promise.all([
        getLearnerProfile(),
        getUserGameLevel()
      ]);
      
      // Once we have the learner level, fetch the quiz
      if (profile || level) {
        await fetchQuiz();
      }
    };
    
    loadData();
  }, [quizId]);

  useEffect(() => {
    if (quizId === 'malawi-districts' && learnerCurrentLevel !== null) {
      fetchQuiz();
    }
  }, [districtCategory]);

  // Timer - only start when quiz is loaded
  useEffect(() => {
    if (!quizLoaded || !quiz || loading || timeLeft <= 0 || showFeedback || quizCompleted) return;
    playTick();
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizLoaded, quiz, loading, showFeedback, quizCompleted]);

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && quiz && !loading && !quizCompleted && quizLoaded) handleTimeout();
  }, [timeLeft, quizLoaded]);

  // Read question aloud
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions[currentQuestion] && !showFeedback && !quizCompleted && quizLoaded) {
      const q = quiz.questions[currentQuestion];
      const questionText = sanitizeValue(q.question);
      if (questionText) {
        speak(questionText);
      }
    }
  }, [currentQuestion, quiz, quizLoaded]);

  // Auto-advance after feedback
  useEffect(() => {
    if (!showFeedback) return;
    const t = setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
      if (currentQuestion + 1 < (quiz?.questions?.length || 0)) {
        setCurrentQuestion(prev => prev + 1);
        setFilteredOptions(null);
        setFiftyFiftyUsed(false);
        setTimeLeft(MAX_TIME);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [showFeedback]);

  // ── interaction handlers ─────────────────────────────────────────────────
  const handleTimeout = () => {
    if (showFeedback || quizCompleted) return;
    const currentQ = quiz.questions[currentQuestion];
    playTimesUp();
    setFeedbackMessage(`time's up! correct answer: ${sanitizeValue(currentQ.correctAnswer)}`);
    speak(`time is up. the answer is ${sanitizeValue(currentQ.correctAnswer)}`);
    setIsAnswerCorrect(false);
    setShowFeedback(true);
    const na = [...answers]; na[currentQuestion] = ''; setAnswers(na); answersRef.current = na;
  };

  const handleAnswerSelect = (option) => {
    if (!quiz || loading || showFeedback || selectedOption || quizCompleted) return;
    playNav();
    setSelectedOption(option);
    const currentQ = quiz.questions[currentQuestion];
    const cleanOpt = sanitizeValue(option);
    const cleanAns = sanitizeValue(currentQ.correctAnswer);
    const correct  = normalizeValue(cleanOpt) === normalizeValue(cleanAns) && normalizeValue(cleanOpt) !== '';
    if (correct) { playCorrect(); setCurrentScore(p => p + POINTS_PER_QUESTION); setFeedbackMessage(`correct! +${POINTS_PER_QUESTION} points!`); speak('correct! well done!'); }
    else { playWrong(); setFeedbackMessage(`incorrect! correct answer: ${cleanAns || 'n/a'}`); speak(`wrong. the answer is ${cleanAns}`); }
    setIsAnswerCorrect(correct);
    setShowFeedback(true);
    const na = [...answers]; na[currentQuestion] = cleanOpt; setAnswers(na); answersRef.current = na;
  };

  const goToQuestion = (idx) => {
    if (showFeedback) return;
    playNav();
    setCurrentQuestion(idx);
    setFilteredOptions(null);
    setFiftyFiftyUsed(false);
    setTimeLeft(MAX_TIME);
    setSelectedOption(answersRef.current[idx] || null);
  };

  const handleFiftyFifty = () => {
    if (!quiz || loading || fiftyFiftyUsed || showFeedback || quizCompleted) return;
    playNav();
    const currentQ = quiz.questions[currentQuestion];
    const cleanAns  = sanitizeValue(currentQ.correctAnswer);
    const wrong = currentQ.options.filter(o => normalizeValue(o) !== normalizeValue(cleanAns) && o !== '');
    setFilteredOptions([cleanAns, wrong[Math.floor(Math.random() * wrong.length)] || currentQ.options[0]]);
    setFiftyFiftyUsed(true);
    toast.success('two options remaining!', { icon: '💡' });
    playSound(880, 0.2, 'sine', 0.1);
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    const latestAnswers = answersRef.current;
    try {
      let correctCount = 0;
      const formattedAnswers = latestAnswers.map((answer, idx) => {
        const q = quiz.questions[idx];
        const ca = sanitizeValue(q.correctAnswer);
        const sa = sanitizeValue(answer);
        const isCorrect = normalizeValue(sa) === normalizeValue(ca) && normalizeValue(sa) !== '';
        if (isCorrect) correctCount++;
        return { questionId: q.id || idx, selectedOption: sa, isCorrect, correctAnswer: ca, questionText: q.question };
      });

      const earnedPoints    = correctCount * POINTS_PER_QUESTION;
      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const passed          = scorePercentage >= 60;

      if (quizId !== 'malawi-districts') {
        await axios.post(`${API_URL}/api/learner/quiz-submit-v2`, {
          quizId: parseInt(quizId),
          answers: formattedAnswers,
          score: scorePercentage,
          pointsEarned: earnedPoints,
          correctCount,
          totalQuestions: quiz.questions.length,
          quizTitle: quiz.title,
          quizTopic: quiz.topic,
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        if (passed && earnedPoints > 0) {
          try {
            await axios.post(`${API_URL}/api/learner/quiz-submit`, {
              quizId: 0,
              answers: formattedAnswers,
              score: scorePercentage,
              pointsEarned: earnedPoints
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (e) {}
        }
      }

      setQuizResults({
        scorePercentage, 
        earnedPoints, 
        correctCount,
        totalQuestions: quiz.questions.length, 
        passed,
        answers: formattedAnswers,
        quizTitle: quiz.title || 'quiz',
      });

      setShowResultsModal(true);
      if (passed) playApplause();

    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error('submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = async () => { 
    setShowResultsModal(false); 
    setQuizLoaded(false);
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
  
  const handleViewHistory = () => { 
    setShowResultsModal(false); 
    navigate('/quiz-history'); 
  };

  const handleShareResults = () => {
    const { scorePercentage, correctCount, totalQuestions, passed, earnedPoints } = quizResults;
    const msg = `i scored ${scorePercentage}% (${correctCount}/${totalQuestions}) on a quiz! ${passed ? 'passed!' : 'keep practicing!'} earned ${earnedPoints} pts!`;
    if (navigator.share) { navigator.share({ title: 'Quiz Results', text: msg }).catch(() => {}); }
    else { navigator.clipboard.writeText(msg); toast.success('results copied!'); }
  };

  // ── early returns ────────────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50 text-slate-800">
        <div className="w-full max-w-md rounded-3xl p-6 text-center shadow-2xl bg-white border border-slate-200">
          <div className="text-7xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-4 text-slate-800">access denied</h2>
          <div className="p-4 rounded-lg mb-6 bg-red-50 text-red-700 border border-red-200"><p className="text-sm">{accessError}</p></div>
          <button onClick={() => navigate('/quizzes')} className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition">
            back to quizzes
          </button>
        </div>
      </div>
    );
  }

  // Show loading state only briefly
  if (loading || !quizLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50 text-slate-800">
        <div className="w-full max-w-md rounded-3xl p-8 text-center shadow-2xl bg-white border border-slate-200">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-sky-50 text-slate-800">
        <div className="w-full max-w-md rounded-3xl p-8 text-center shadow-2xl bg-white border border-slate-200">
          <p className="text-slate-600">no questions found.</p>
          <button onClick={() => navigate('/quizzes')} className="mt-4 w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition">
            back to quizzes
          </button>
        </div>
      </div>
    );
  }

  // ── render helpers ───────────────────────────────────────────────────────
  const currentQ     = quiz.questions[currentQuestion];
  const optionsToShow = filteredOptions || currentQ.options;
  const hasImage     = !!currentQ.questionImage;
  const currentQuestionText = normalizeLowerCase(currentQ.question);
  const answeredCount = answersRef.current.filter(a => a !== '').length;
  const levelColor   = LEVEL_COLORS[quizGameLevel] || 'bg-teal-500';

  const renderOptions = (extraClass = '') => optionsToShow.map((option, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const isSelected   = selectedOption === option;
    const wasAnswered  = answersRef.current[currentQuestion] === option && !showFeedback;
    const highlighted  = isSelected || wasAnswered;
    return (
      <button
        key={idx}
        onClick={() => handleAnswerSelect(option)}
        disabled={showFeedback || !!selectedOption || quizCompleted}
        className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${extraClass}
          ${highlighted
            ? 'bg-teal-500 text-white shadow-lg ring-2 ring-teal-400'
            : (!showFeedback && !selectedOption && !quizCompleted)
              ? 'bg-white border border-slate-200 hover:ring-2 hover:ring-sky-300 hover:bg-sky-50 text-slate-700'
              : 'bg-slate-100 opacity-70 text-slate-500 border border-slate-200'
          } ${quizCompleted ? 'cursor-not-allowed' : ''}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${highlighted ? 'bg-white text-teal-600' : 'bg-slate-500 text-white'}`}>
          {letter}
        </div>
        <span className={`font-semibold text-sm flex-1 ${highlighted ? 'text-white' : 'text-slate-700'}`}>{option}</span>
      </button>
    );
  });

  // ── action bar ───────────────────────────────────────────────────────────
  const renderActionBar = () => (
    <div className="flex gap-3 mt-4 sm:mt-6">
      <button
        onClick={() => currentQuestion > 0 && goToQuestion(currentQuestion - 1)}
        disabled={currentQuestion === 0 || showFeedback}
        className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-1
          ${currentQuestion === 0 || showFeedback
            ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
      >
        ◀ prev
      </button>

      {!quizCompleted && currentQuestion < quiz.questions.length - 1 ? (
        <button
          onClick={() => goToQuestion(currentQuestion + 1)}
          disabled={showFeedback}
          className="flex-1 py-2.5 sm:py-3 rounded-xl font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600 transition shadow-sm flex items-center justify-center gap-1"
        >
          next ▶
        </button>
      ) : quizCompleted ? (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all animate-pulse
            ${submitting ? 'opacity-50 cursor-not-allowed bg-slate-300 text-white' : 'bg-green-500 text-white hover:bg-green-600 shadow-md'}`}
        >
          {submitting ? 'submitting…' : 'submit quiz'}
        </button>
      ) : (
        <div className="flex-1 py-2.5 sm:py-3 rounded-xl text-sm text-center font-medium bg-sky-50 text-slate-700 border border-sky-100">
          {answeredCount}/{quiz.questions.length} answered
        </div>
      )}
    </div>
  );

  // ── question navigator sidebar ──────────────────────────────────────────
  const renderNavSidebar = () => (
    <div className="rounded-2xl shadow-lg p-4 flex flex-col gap-3 w-full bg-white border border-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">questions</span>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          {answeredCount}/{quiz.questions.length}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {quiz.questions.map((_, idx) => {
          const answered  = answersRef.current[idx] !== '';
          const isCurrent = idx === currentQuestion;
          return (
            <button
              key={idx}
              onClick={() => !showFeedback && goToQuestion(idx)}
              title={`Q${idx + 1}${answered ? ' ✓' : ''}`}
              className={`w-full aspect-square rounded-lg text-xs font-bold transition-all
                ${isCurrent
                  ? 'bg-teal-500 text-white ring-2 ring-teal-300 ring-offset-1 scale-110 shadow'
                  : answered
                    ? 'bg-green-400 text-white hover:bg-green-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-teal-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">unanswered</span>
        </div>
      </div>

      {quizCompleted && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full mt-2 py-2.5 rounded-xl font-bold text-sm transition-all
            ${submitting
              ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
              : 'bg-green-500 text-white hover:bg-green-600 shadow-md animate-pulse'}`}
        >
          {submitting ? 'submitting…' : 'submit'}
        </button>
      )}
    </div>
  );

  // ── main render ──────────────────────────────────────────────────────────
  return (
    <div className="learner-themed h-screen flex flex-col overflow-hidden bg-sky-50 text-slate-800" style={pageStyles}>
      <QuizResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={quizResults}
        onRetake={handleRetakeQuiz}
        onNextLevel={handleNextLevel}
        onViewDashboard={handleViewDashboard}
        onViewHistory={handleViewHistory}
        onShare={handleShareResults}
      />

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-3 sm:px-4 pt-2 sm:pt-4 pb-2 sm:pb-3 max-w-6xl w-full mx-auto flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`${levelColor} text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow`}>
            lvl {quizGameLevel}
          </span>
          {quiz.title && (
            <span className="text-[10px] sm:text-sm font-medium truncate max-w-[100px] sm:max-w-xs text-slate-600">{quiz.title}</span>
          )}
        </div>
        {quizId === 'malawi-districts' && (
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-[8px] sm:text-xs font-semibold text-slate-600">category</label>
            <select
              value={districtCategory}
              onChange={(e) => {
                const nextCategory = e.target.value;
                setDistrictCategory(nextCategory);
                const params = new URLSearchParams(window.location.search);
                params.set('districtCategory', nextCategory);
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
              }}
              className="text-[8px] sm:text-xs px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-teal-300 bg-white text-slate-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none max-w-[120px] sm:max-w-none"
            >
              {(districtCategories.length > 0 ? districtCategories : Object.keys(DISTRICT_CATEGORY_LABELS).map(id => ({ id, label: DISTRICT_CATEGORY_LABELS[id] }))).map((c) => (
                <option key={c.id} value={c.id}>{c.label || DISTRICT_CATEGORY_LABELS[c.id] || c.id}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/quiz-history')}
            className="text-[8px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition font-medium text-teal-600 border border-teal-300 hover:bg-teal-50"
          >
            history
          </button>
          <button
            onClick={() => setShowExitModal(true)}
            className="text-[8px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition text-slate-600 border border-slate-200 hover:bg-slate-100"
          >
            exit
          </button>
        </div>
      </div>

      {/* ── Body: quiz card + right sidebar ── */}
      <div className="flex-1 overflow-hidden px-3 sm:px-4 pb-3 sm:pb-4 max-w-6xl w-full mx-auto flex gap-3 sm:gap-4 items-stretch min-h-0">

        {/* CENTER — Quiz card */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full bg-white/95 border border-slate-200">

            {/* Card header */}
            <div className="relative flex-shrink-0 bg-teal-600 px-4 sm:px-6 py-3 sm:py-4">
              <div className={`absolute -bottom-6 sm:-bottom-7 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-white shadow-lg z-10 ring-4 ring-white text-base sm:text-lg
                ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-teal-500'}`}>
                {quizCompleted ? '✓' : timeLeft}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-white font-semibold text-[10px] sm:text-sm">
                  q {currentQuestion + 1} / {quiz.questions.length}
                  {quizCompleted && <span className="ml-1 sm:ml-2 text-green-300 text-[8px] sm:text-xs">✓ complete!</span>}
                  {quizId === 'malawi-districts' && (
                    <span className="ml-1 sm:ml-2 text-[8px] sm:text-[11px] text-teal-100 font-medium">
                      • {DISTRICT_CATEGORY_LABELS[districtCategory] || 'mixed challenge'}
                    </span>
                  )}
                </div>
                <div className="bg-white/20 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full">
                  <span className="text-white text-[10px] sm:text-sm">score: </span>
                  <span className="text-white font-bold text-base sm:text-xl">{currentScore}</span>
                </div>
              </div>
            </div>

            {/* Question + options */}
            {hasImage ? (
              <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden pt-6 sm:pt-8">
                <div className="md:w-1/2 p-3 sm:p-5 flex items-center justify-center overflow-hidden bg-sky-50 border-r border-slate-200">
                  <div className="text-center">
                    <div className="rounded-xl p-2 sm:p-3 shadow-md bg-white">
                      <img src={currentQ.questionImage} alt="question" className="max-w-full max-h-40 sm:max-h-56 object-contain mx-auto" />
                    </div>
                    <p className="font-bold mt-2 sm:mt-3 text-xs sm:text-sm px-2 text-slate-800 lowercase"
                        dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQuestionText) }} />
                  </div>
                </div>
                <div className="md:w-1/2 p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-1.5 sm:space-y-2 flex-1">{renderOptions()}</div>
                  {renderActionBar()}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 p-4 sm:p-6 pt-6 sm:pt-8 flex flex-col justify-between overflow-hidden">
                <div className="rounded-xl p-3 sm:p-4 text-center flex-shrink-0 bg-sky-50 border border-slate-200">
                  <h2 className="text-sm sm:text-lg font-bold leading-relaxed text-slate-800 lowercase"
                      dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQuestionText) }} />
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 justify-center my-2 sm:my-3">
                  {renderOptions()}
                </div>
                <div className="flex-shrink-0">
                  {renderActionBar()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — 50:50 + Navigator (desktop only) */}
        <div className="hidden lg:flex w-56 flex-shrink-0 flex-col gap-3 overflow-y-auto">

          <button
            onClick={handleFiftyFifty}
            disabled={fiftyFiftyUsed || showFeedback || quizCompleted}
            className={`flex-shrink-0 w-full py-3 rounded-xl font-bold text-sm transition-all
              ${fiftyFiftyUsed || showFeedback || quizCompleted
                ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 shadow-sm'}`}
          >
            50:50
          </button>

          {renderNavSidebar()}

        </div>

      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl shadow-xl w-full max-w-xs p-6 text-center bg-white border border-slate-200">
            <div className="text-3xl mb-3">🚪</div>
            <h3 className="text-base font-bold mb-1 text-slate-800">leave quiz?</h3>
            <p className="text-sm mb-5 text-slate-600">your progress will be lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                stay
              </button>
              <button
                onClick={() => { setShowExitModal(false); navigate('/quizzes'); }}
                className="flex-1 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback toast */}
      {showFeedback && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`rounded-xl shadow-2xl px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 ${isAnswerCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
            <span className="text-white text-base sm:text-lg">{isAnswerCorrect ? '✓' : '✕'}</span>
            <p className="text-white font-semibold text-xs sm:text-sm lowercase">{feedbackMessage}</p>
          </div>
        </div>
      )}

      <style>{`
        .learner-themed {
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14pt;
          line-height: 1.5;
        }
        .learner-themed,
        .learner-themed * {
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .learner-themed .text-xs,
        .learner-themed .text-sm,
        .learner-themed .text-base {
          font-size: 14pt !important;
          line-height: 1.4;
        }
        .learner-themed .text-lg {
          font-size: 16pt !important;
          line-height: 1.45;
        }
        .learner-themed .text-xl {
          font-size: 18pt !important;
          line-height: 1.45;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        
        @media (max-width: 640px) {
          .h-screen {
            height: 100vh;
            height: 100dvh;
          }
          .learner-themed .text-xs,
          .learner-themed .text-sm,
          .learner-themed .text-base {
            font-size: 12pt !important;
          }
          .learner-themed .text-lg {
            font-size: 14pt !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TakeQuiz;